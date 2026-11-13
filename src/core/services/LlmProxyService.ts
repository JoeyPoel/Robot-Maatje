/**
 * LiteLLM Proxy Domain Service
 * Connects to UvA / HvA LiteLLM proxy gateway with function/tool calling and vision support.
 */

import { motionService } from './MotionService';
import { speechService } from './SpeechService';
import { expressionService } from './ExpressionService';
import { visionService } from './VisionService';
import { EmotionType, PresetActionName } from '@/types/robot';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string | Array<{ type: string; text?: string; image_url?: { url: string } }>;
  tool_call_id?: string;
  name?: string;
}

export interface ExecutedActionSummary {
  tool: string;
  args: Record<string, unknown>;
  result: unknown;
}

export interface AIResponsePayload {
  replyText: string;
  executedActions: ExecutedActionSummary[];
  emotion?: EmotionType;
}

const SYSTEM_PROMPT = `Je bent Robot Maatje, de officiële humanoïde zorg- en onderwijsrobot van de Hogeschool van Amsterdam (HvA).
Je bent empathisch, vrolijk, behulpzaam en spreekt altijd vlot, natuurlijk Nederlands.

Je hebt een fysiek lichaam (UBTECH Alpha Mini hardware):
- 14 servomotoren: je kunt lopen (vooruit, achteruit), draaien (links, rechts), zwaaien, dansen, handklappen, buigen, rekken, gaan zitten en opstaan.
- Oogschermen (dual LCD): je kunt emoties tonen zoals 'happy' (blij), 'heart' (hartjesogen vol liefde), 'wink' (knipoog), 'surprised' (verbaasd), 'sleepy' (rust).
- Voorhoofdcamera (13MP): je kunt de omgeving en personen bekijken.
- Luidspreker: je spreekt zinnen hardop uit.

RICHTLIJNEN:
1. Roep de juiste tool(s) aan wanneer de gebruiker vraagt om een actie, beweging, dansje, emotie of zichtanalyse.
2. Je mag meerdere tools combineren: als iemand bijvoorbeeld zegt "Zeg hallo en geef me hartjesogen", roep dan zowel 'show_emotion' aan als 'speak_text' of 'play_gesture'.
3. Houd je antwoorden enthousiast, vriendelijk en beknopt (geschikt voor spraak).`;

// Function calling / Tool definitions in OpenAI format
const TOOLS = [
  {
    type: 'function',
    function: {
      name: 'speak_text',
      description: 'Laat Robot Maatje een Nederlandse zin hardop uitspreken via zijn fysieke luidspreker.',
      parameters: {
        type: 'object',
        properties: {
          text: {
            type: 'string',
            description: 'De tekst die Maatje hardop moet zeggen in het Nederlands.',
          },
        },
        required: ['text'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'show_emotion',
      description: 'Toon een emotie op de digitale oogschermen van Maatje.',
      parameters: {
        type: 'object',
        properties: {
          emotion: {
            type: 'string',
            enum: ['happy', 'heart', 'wink', 'curious', 'surprised', 'sleepy', 'angry'],
            description: 'De gewenste oogexpressie (bijv. "heart" voor liefdevolle hartjesogen, "happy" voor blij).',
          },
        },
        required: ['emotion'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'play_gesture',
      description: 'Laat Maatje een lichaamsbeweging, gebaar of dansje uitvoeren.',
      parameters: {
        type: 'object',
        properties: {
          gesture: {
            type: 'string',
            enum: [
              'say_hello_avatar',
              'dance_0001',
              'klappen',
              'zitten',
              'stand_up',
              'bow_avatar',
              'handshake_avatar',
              'heupen',
              'fysio1',
              'fysio2',
              'knikarm',
              'pushups',
              'scheet',
              'hoofd_schouder',
            ],
            description: 'Het uit te voeren gebaar of de beweging.',
          },
        },
        required: ['gesture'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'move_robot',
      description: 'Laat Maatje stappen zetten of draaien.',
      parameters: {
        type: 'object',
        properties: {
          direction: {
            type: 'string',
            enum: ['forward', 'backward', 'left', 'right'],
            description: 'De looprichting.',
          },
          steps: {
            type: 'integer',
            minimum: 1,
            maximum: 5,
            description: 'Aantal stappen (1 t/m 5).',
          },
        },
        required: ['direction'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'inspect_camera_view',
      description: 'Bekijkt wat er live voor de camera van Maatje staat en herkent objecten en personen.',
      parameters: {
        type: 'object',
        properties: {
          question: {
            type: 'string',
            description: 'Wat moet er specifiek bekeken worden (bijv. "Welk object zie je?" of "Wie staat er voor je?").',
          },
        },
      },
    },
  },
];

export class LlmProxyService {
  private baseUrl: string;
  private apiKey: string;
  private model: string;

  constructor() {
    this.baseUrl = process.env.LLM_BASE_URL || 'https://llmproxy.uva.nl/v1';
    this.apiKey = process.env.LLM_API_KEY || '';
    this.model = process.env.LLM_MODEL || 'gpt-4o-mini';
  }

  /**
   * Process a conversational turn with function calling tool orchestration.
   */
  public async chatWithTools(
    messages: ChatMessage[],
    options?: { model?: string }
  ): Promise<AIResponsePayload> {
    const selectedModel = options?.model || this.model;
    const fullMessages: ChatMessage[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...messages,
    ];

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: selectedModel,
        messages: fullMessages,
        tools: TOOLS,
        tool_choice: 'auto',
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`LLM Proxy error (${response.status}): ${errText}`);
    }

    const data = await response.json();
    const message = data.choices?.[0]?.message;
    if (!message) {
      throw new Error('Geen antwoord ontvangen van LLM proxy.');
    }

    const executedActions: ExecutedActionSummary[] = [];
    let detectedEmotion: EmotionType | undefined;

    // Check if the LLM invoked any tools
    if (message.tool_calls && Array.isArray(message.tool_calls)) {
      for (const call of message.tool_calls) {
        const fnName = call.function?.name;
        let fnArgs: Record<string, unknown> = {};
        try {
          fnArgs = JSON.parse(call.function?.arguments || '{}');
        } catch {
          fnArgs = {};
        }

        try {
          const res = await this.executeTool(fnName, fnArgs);
          executedActions.push({ tool: fnName, args: fnArgs, result: res });
          if (fnName === 'show_emotion' && fnArgs.emotion) {
            detectedEmotion = fnArgs.emotion as EmotionType;
          }
        } catch (err: unknown) {
          executedActions.push({
            tool: fnName,
            args: fnArgs,
            result: { error: err instanceof Error ? err.message : String(err) },
          });
        }
      }
    }

    let finalReply = message.content || '';

    // If tools were called and the assistant gave no prose, produce a friendly verbal confirmation
    if (!finalReply && executedActions.length > 0) {
      const toolNames = executedActions.map((a) => a.tool);
      if (toolNames.includes('play_gesture')) {
        finalReply = 'Ik voer de beweging nu voor je uit!';
      } else if (toolNames.includes('show_emotion')) {
        finalReply = 'Kijk eens naar mijn ogen!';
      } else if (toolNames.includes('move_robot')) {
        finalReply = 'Ik kom jouw kant op!';
      } else {
        finalReply = 'Actie uitgevoerd!';
      }
    }

    // All text returned by Maatje MUST be spoken aloud via physical loudspeaker
    const alreadySpoke = executedActions.some((a) => a.tool === 'speak_text' || a.tool === 'inspect_camera_view');
    if (finalReply && !alreadySpoke) {
      try {
        await speechService.speak(finalReply, 'nl-NL', 'LLM_REPLY');
        executedActions.unshift({
          tool: 'speak_text',
          args: { text: finalReply },
          result: { success: true, spoken: finalReply },
        });
      } catch (speechErr) {
        console.warn('[LlmProxyService] TTS speak failed:', speechErr);
      }
    }

    return {
      replyText: finalReply,
      executedActions,
      emotion: detectedEmotion,
    };
  }

  /**
   * Executes a physical tool on the robot.
   */
  private async executeTool(name: string, args: Record<string, unknown>): Promise<unknown> {
    switch (name) {
      case 'speak_text': {
        const text = String(args.text || '');
        if (text) {
          await speechService.speak(text, 'nl-NL', 'LLM_TOOL');
          return { success: true, spoken: text };
        }
        return { success: false, reason: 'Empty text' };
      }

      case 'show_emotion': {
        const emotion = (args.emotion as EmotionType) || 'happy';
        await expressionService.setEmotion(emotion, 'LLM_TOOL');
        return { success: true, emotion };
      }

      case 'play_gesture': {
        const gesture = (args.gesture as PresetActionName) || 'say_hello_avatar';
        await motionService.executePresetAction(gesture, 'LLM_TOOL');
        return { success: true, gesture };
      }

      case 'move_robot': {
        const direction = (args.direction as 'forward' | 'backward' | 'left' | 'right') || 'forward';
        const steps = Number(args.steps) || 1;
        await motionService.walk(direction, steps, 'LLM_TOOL');
        return { success: true, direction, steps };
      }

      case 'inspect_camera_view': {
        const question = String(args.question || 'Wat zie je in beeld?');
        const analysis = await this.analyzeLiveCamera(question);
        if (analysis) {
          // Speak the vision result automatically
          await speechService.speak(analysis, 'nl-NL', 'VISION_AI');
        }
        return { success: true, analysis };
      }

      default:
        return { success: false, error: `Onbekende tool: ${name}` };
    }
  }

  /**
   * Captures the live camera frame and sends it to the vision LLM for scene/object understanding.
   */
  public async analyzeLiveCamera(userPrompt = 'Beschrijf wat je ziet in 1 of 2 korte Nederlandse zinnen.'): Promise<string> {
    const frameBuffer = await visionService.getLatestFrame();
    if (!frameBuffer || frameBuffer.length === 0) {
      return 'Mijn camerafeed is momenteel niet beschikbaar.';
    }

    const base64Image = frameBuffer.toString('base64');
    const dataUri = `data:image/jpeg;base64,${base64Image}`;

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'Je bent de camera-ogen van Robot Maatje (HvA). Beschrijf in 1 of 2 vriendelijke, beknopte Nederlandse zinnen wat of wie je ziet (objecten, personen, houding, context).',
          },
          {
            role: 'user',
            content: [
              { type: 'text', text: userPrompt },
              {
                type: 'image_url',
                image_url: { url: dataUri },
              },
            ],
          },
        ],
        max_tokens: 150,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Vision analysis error (${response.status}): ${err}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || 'Ik kon het beeld niet analyseren.';
  }
}

export const llmProxyService = new LlmProxyService();

