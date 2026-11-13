/**
 * Motion Domain Service
 * Handles servo kinematics limits, preset movements, emergency stop, and balance recovery.
 */

import { robotBridgeAdapter } from '../adapters/RobotBridgeAdapter';
import { JointName, PresetActionName, CommandResult } from '@/types/robot';

export class MotionService {
  /**
   * Executes a preset movement or locomotion sequence on the robot.
   */
  public async executePresetAction(actionName: PresetActionName, source = 'MANUAL_UI'): Promise<CommandResult> {
    return await robotBridgeAdapter.sendCommand({
      category: 'MOTION',
      action: 'preset',
      params: { action: actionName },
      source: source as any,
    });
  }

  /**
   * Commands walking in a given direction for N steps.
   */
  public async walk(direction: 'forward' | 'backward' | 'left' | 'right', steps = 1, source = 'MANUAL_UI'): Promise<CommandResult> {
    return await robotBridgeAdapter.sendCommand({
      category: 'MOTION',
      action: 'walk',
      params: { direction, steps },
      source: source as any,
    });
  }

  /**
   * Commands an individual servo to a clamped safe angle.
   */
  public async setServoAngle(joint: JointName, angle: number, source = 'MANUAL_UI'): Promise<CommandResult> {
    return await robotBridgeAdapter.sendCommand({
      category: 'MOTION',
      action: 'servo',
      params: { joint, angle },
      source: source as any,
    });
  }

  /**
   * Triggers emergency stop, kinematics origin reset, and balance stance recovery.
   */
  public async emergencyStop(source = 'MANUAL_UI'): Promise<CommandResult> {
    return await robotBridgeAdapter.sendCommand({
      category: 'MOTION',
      action: 'stop',
      source: source as any,
    });
  }
}

export const motionService = new MotionService();
