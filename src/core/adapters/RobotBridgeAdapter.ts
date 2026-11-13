/**
 * Hardware Bridge Adapter
 * Encapsulates all outbound HTTP requests from Next.js to the local robot bridge daemon.
 */

import { CommandRequestPayload, CommandResult, RobotTelemetry } from '@/types/robot';

export class RobotBridgeAdapter {
  private bridgeUrl: string;
  private authToken: string;

  constructor() {
    this.bridgeUrl = process.env.ROBOT_BRIDGE_HTTP_URL || 'http://localhost:8088';
    this.authToken = process.env.ROBOT_BRIDGE_AUTH_TOKEN || 'alpha_mini_secret_token_123';
  }

  /**
   * Fetch current live telemetry from the local bridge.
   */
  public async getTelemetry(): Promise<RobotTelemetry> {
    try {
      const res = await fetch(`${this.bridgeUrl}/api/telemetry?token=${this.authToken}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.authToken}`,
        },
        cache: 'no-store',
      });

      if (!res.ok) {
        throw new Error(`Bridge returned HTTP ${res.status}: ${res.statusText}`);
      }

      return (await res.json()) as RobotTelemetry;
    } catch (err: unknown) {
      // Return safe degraded telemetry when bridge is unreachable
      return {
        connected: false,
        device_id: 'offline',
        battery: { level: 0, voltage: 0, temperature: 0, status: 'unknown', usb_powered: false },
        wifi: { ip: 'offline', mac: 'offline', connected: false },
        sensors: {
          gyro: { x: 0, y: 0, z: 0 },
          accel: { x: 0, y: 0, z: 0 },
          tilt_pitch: 0,
          tilt_roll: 0,
          is_fallen: false,
          head_touched: false,
          fall_direction: 'none',
        },
        services: {},
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Send a hardware command to the local bridge.
   */
  public async sendCommand(payload: CommandRequestPayload): Promise<CommandResult> {
    const startTime = Date.now();
    try {
      const res = await fetch(`${this.bridgeUrl}/api/command`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.authToken}`,
        },
        body: JSON.stringify(payload),
      });

      const latencyMs = Date.now() - startTime;
      const json = await res.json();

      if (!res.ok) {
        return {
          success: false,
          category: payload.category,
          action: payload.action,
          error: json.error || 'Bridge command failed',
          executionTimeMs: latencyMs,
        };
      }

      return {
        success: json.success ?? true,
        category: payload.category,
        action: payload.action,
        data: json.data,
        error: json.error,
        executionTimeMs: latencyMs,
      };
    } catch (err: unknown) {
      return {
        success: false,
        category: payload.category,
        action: payload.action,
        error: err instanceof Error ? err.message : String(err),
        executionTimeMs: Date.now() - startTime,
      };
    }
  }

  /**
   * Retrieve a live camera frame buffer.
   */
  public async getCameraFrameBuffer(): Promise<Buffer | null> {
    try {
      const res = await fetch(`${this.bridgeUrl}/api/camera-frame?token=${this.authToken}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${this.authToken}`,
        },
        cache: 'no-store',
      });

      if (!res.ok) return null;
      const arrayBuffer = await res.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch {
      return null;
    }
  }
}

export const robotBridgeAdapter = new RobotBridgeAdapter();

