/**
 * Eye Expression & LED Domain Service
 * Manages dual eye LCD matrix animations and LED lighting.
 */

import { robotBridgeAdapter } from '../adapters/RobotBridgeAdapter';
import { EmotionType, CommandResult } from '@/types/robot';

export class ExpressionService {
  /**
   * Triggers an emotion animation on the robot's dual LCD eye screens.
   */
  public async setEmotion(emotion: EmotionType, source = 'MANUAL_UI'): Promise<CommandResult> {
    return await robotBridgeAdapter.sendCommand({
      category: 'EXPRESSION',
      action: 'emotion',
      params: { emotion },
      source: source as any,
    });
  }

  /**
   * Sets mouth lamp mode, color, and breathing timing.
   */
  public async setMouthLamp(
    enable: boolean,
    color: string | number = 2,
    mode = 1,
    duration = 3000,
    breathDuration = 1000,
    source = 'MANUAL_UI'
  ): Promise<CommandResult> {
    return await robotBridgeAdapter.sendCommand({
      category: 'EXPRESSION',
      action: 'mouth_lamp',
      params: { enable, color, mode, duration, breathDuration },
      source: source as any,
    });
  }

  /**
   * Turns the mouth lamp switch on or off.
   */
  public async switchMouthLamp(isOpen: boolean, source = 'MANUAL_UI'): Promise<CommandResult> {
    return await robotBridgeAdapter.sendCommand({
      category: 'EXPRESSION',
      action: 'switch_mouth_lamp',
      params: { isOpen },
      source: source as any,
    });
  }
}

export const expressionService = new ExpressionService();
