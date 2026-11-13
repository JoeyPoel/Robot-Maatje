/**
 * Vision & Telemetry Domain Services
 * Direct bridge communication for live camera frames, photos, and telemetry.
 */

import { robotBridgeAdapter } from '../adapters/RobotBridgeAdapter';
import { RobotTelemetry } from '@/types/robot';

export class VisionService {
  /**
   * Retrieves the latest camera frame buffer from the hardware bridge.
   */
  public async getLatestFrame(): Promise<Buffer | null> {
    return await robotBridgeAdapter.getCameraFrameBuffer();
  }

  /**
   * Takes a high-resolution 13MP photo from the forehead camera.
   */
  public async captureForeheadPhoto(): Promise<any> {
    return await robotBridgeAdapter.sendCommand({
      category: 'VISION',
      action: 'take_picture',
    });
  }
}

export class TelemetryService {
  /**
   * Reads real-time hardware telemetry (battery, wifi, sensor states).
   */
  public async getLiveTelemetry(): Promise<RobotTelemetry> {
    return await robotBridgeAdapter.getTelemetry();
  }
}

export const visionService = new VisionService();
export const telemetryService = new TelemetryService();
