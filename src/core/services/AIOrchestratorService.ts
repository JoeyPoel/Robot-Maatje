/**
 * AI Orchestrator Service
 * Coordinates conversation, vision perception, and physical action execution.
 */

import { llmProxyService, ChatMessage, AIResponsePayload } from './LlmProxyService';
import { EmotionType } from '@/types/robot';

export class AIOrchestratorService {
  /**
   * Processes natural user input through the LiteLLM proxy and executes actions.
   */
  public async handleUserInput(
    userInput: string,
    history: ChatMessage[] = []
  ): Promise<AIResponsePayload> {
    const messages: ChatMessage[] = [...history, { role: 'user', content: userInput }];
    return await llmProxyService.chatWithTools(messages);
  }

  /**
   * Captures the live camera feed and returns a textual description of what the robot sees.
   */
  public async describeCameraView(prompt?: string): Promise<string> {
    return await llmProxyService.analyzeLiveCamera(prompt);
  }
}

export const aiOrchestratorService = new AIOrchestratorService();
