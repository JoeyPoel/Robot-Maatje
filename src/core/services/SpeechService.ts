/**
 * Speech & Audio Domain Service
 * Manages multilingual TTS, physical loudspeaker playback, and volume control.
 */

import { robotBridgeAdapter } from '../adapters/RobotBridgeAdapter';
import { CommandResult } from '@/types/robot';

export class SpeechService {
  /**
   * Synthesizes and plays speech aloud through the robot's physical head speaker.
   */
  public async speak(text: string, language: 'nl-NL' | 'en-US' = 'nl-NL', source = 'MANUAL_UI'): Promise<CommandResult> {
    return await robotBridgeAdapter.sendCommand({
      category: 'SPEECH',
      action: 'speak',
      params: { text, language },
      source: source as any,
    });
  }

  /**
   * Adjusts the physical master audio volume on the robot.
   */
  public async setVolume(level: number, source = 'MANUAL_UI'): Promise<CommandResult> {
    return await robotBridgeAdapter.sendCommand({
      category: 'SPEECH',
      action: 'volume',
      params: { level: Math.max(0, Math.min(100, level)) },
      source: source as any,
    });
  }
}

export const speechService = new SpeechService();
