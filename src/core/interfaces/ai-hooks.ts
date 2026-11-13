/**
 * Pluggable AI & Computer Vision Event Hooks
 * Provides typed contracts for external LLMs, Speech-to-Text (STT), and Vision models.
 */

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface DetectedEntity {
  id: string;
  label: string; // e.g. "Person", "Cup", "Face:Joey"
  confidence: number;
  box: BoundingBox;
  attributes?: Record<string, unknown>;
}

export interface VisionFrameData {
  frameId: string;
  timestamp: string;
  imageUri?: string;
  width: number;
  height: number;
}

export interface IVisionProcessor {
  name: string;
  processFrame(frame: VisionFrameData): Promise<DetectedEntity[]>;
}

export interface ConversationTurn {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
}

export interface AIActionPlan {
  speechReply?: string;
  speechLanguage?: 'nl-NL' | 'en-US';
  motionAction?: string;
  eyeEmotion?: string;
  confidence: number;
}

export interface IConversationAgent {
  name: string;
  processInput(userInput: string, history: ConversationTurn[]): Promise<AIActionPlan>;
}

export interface IActionExecutor {
  executePlan(plan: AIActionPlan): Promise<boolean>;
}

/**
 * Concrete Stub: Demonstrates external LLM conversation integration.
 */
export class LLMConversationStub implements IConversationAgent {
  public name = 'Maatje-LLM-Agent-Stub';

  public async processInput(
    userInput: string,
    history: ConversationTurn[]
  ): Promise<AIActionPlan> {
    const inputLower = userInput.toLowerCase();

    if (inputLower.includes('dans') || inputLower.includes('dance')) {
      return {
        speechReply: 'Natuurlijk, laten we even bewegen! Kijk naar dit dansje.',
        speechLanguage: 'nl-NL',
        motionAction: 'dance_0001',
        eyeEmotion: 'happy',
        confidence: 0.98,
      };
    }

    if (inputLower.includes('zwaai') || inputLower.includes('hallo') || inputLower.includes('hello')) {
      return {
        speechReply: 'Hallo! Fijn om je weer te zien.',
        speechLanguage: 'nl-NL',
        motionAction: 'say_hello_avatar',
        eyeEmotion: 'wink',
        confidence: 0.95,
      };
    }

    if (inputLower.includes('zit') || inputLower.includes('sit')) {
      return {
        speechReply: 'Ik ga even rustig zitten.',
        speechLanguage: 'nl-NL',
        motionAction: 'zitten',
        eyeEmotion: 'sleepy',
        confidence: 0.92,
      };
    }

    // Default conversational reply
    return {
      speechReply: `Ik heb je gehoord: "${userInput}". Hoe kan ik je nog meer helpen?`,
      speechLanguage: 'nl-NL',
      motionAction: 'heupen',
      eyeEmotion: 'curious',
      confidence: 0.85,
    };
  }
}

/**
 * Concrete Stub: Demonstrates external Facial & Object Recognition integration.
 */
export class FaceRecognitionStub implements IVisionProcessor {
  public name = 'AlphaMini-FaceModel-Stub';

  public async processFrame(frame: VisionFrameData): Promise<DetectedEntity[]> {
    // Simulated face detection bounding box
    return [
      {
        id: 'det-001',
        label: 'Face: Detected User',
        confidence: 0.94,
        box: { x: 180, y: 120, width: 240, height: 280 },
        attributes: { emotion: 'smile', attentiveness: 'high' },
      },
    ];
  }
}

