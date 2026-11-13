/**
 * AI Orchestrator Service
 * Connects vision detections, speech inputs, and conversational LLMs to robot actions.
 */

import { motionService } from './MotionService';
import { speechService } from './SpeechService';
import { expressionService } from './ExpressionService';
import {
  IConversationAgent,
  IVisionProcessor,
  AIActionPlan,
  LLMConversationStub,
  FaceRecognitionStub,
} from '../interfaces/ai-hooks';
import { PresetActionName, EmotionType } from '@/types/robot';

export class AIOrchestratorService {
  private conversationAgent: IConversationAgent;
  private visionProcessor: IVisionProcessor;

  constructor(
    conversationAgent?: IConversationAgent,
    visionProcessor?: IVisionProcessor
  ) {
    this.conversationAgent = conversationAgent || new LLMConversationStub();
    this.visionProcessor = visionProcessor || new FaceRecognitionStub();
  }

  /**
   * Process user speech or text input through the LLM agent and execute the planned actions.
   */
  public async handleUserInput(userInput: string): Promise<AIActionPlan> {
    const plan = await this.conversationAgent.processInput(userInput, []);

    // Sequentially execute the planned physical reactions
    if (plan.eyeEmotion) {
      await expressionService.setEmotion(plan.eyeEmotion as EmotionType, 'AI_AGENT');
    }

    if (plan.speechReply) {
      await speechService.speak(plan.speechReply, plan.speechLanguage || 'nl-NL', 'AI_AGENT');
    }

    if (plan.motionAction) {
      await motionService.executePresetAction(plan.motionAction as PresetActionName, 'AI_AGENT');
    }

    return plan;
  }

  public getAgentName() {
    return this.conversationAgent.name;
  }

  public getVisionModelName() {
    return this.visionProcessor.name;
  }
}

export const aiOrchestratorService = new AIOrchestratorService();

