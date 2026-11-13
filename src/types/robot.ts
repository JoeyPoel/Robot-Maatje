/**
 * Strict TypeScript Definitions for UBTECH Alpha Mini (Robot Maatje)
 * Covers 14 servos, sensors, vision, speech, expressions, telemetry & AI contracts.
 */

export type JointName =
  | 'head_yaw'
  | 'head_pitch'
  | 'left_shoulder_pitch'
  | 'left_shoulder_roll'
  | 'left_elbow'
  | 'right_shoulder_pitch'
  | 'right_shoulder_roll'
  | 'right_elbow'
  | 'left_hip_yaw'
  | 'left_hip_roll'
  | 'left_hip_pitch'
  | 'left_knee'
  | 'left_ankle'
  | 'right_hip_yaw'
  | 'right_hip_roll'
  | 'right_hip_pitch'
  | 'right_knee'
  | 'right_ankle';

export interface ServoLimit {
  id: number;
  min: number;
  max: number;
  default: number;
}

export type PresetActionName =
  | 'say_hello_avatar'
  | 'stand_up'
  | 'standbysquat_001'
  | 'zitten'
  | 'move_forward_avatar'
  | 'turn_left_avatar'
  | 'turn_right_avatar'
  | 'bow_avatar'
  | 'handshake_avatar'
  | 'act_cute_avatar'
  | 'air_kiss_avatar'
  | 'hug_avatar'
  | 'dance_0001en'
  | 'dance_0001'
  | 'w_head_001'
  | 'speakingAct1'
  | 'klappen'
  | 'heupen'
  | 'fysio1'
  | 'fysio2'
  | 'knikarm'
  | 'nod'
  | 'shake_head'
  | 'tilt_head'
  | 'wave'
  | 'bow'
  | 'pushups'
  | 'scheet'
  | 'armoefening'
  | 'hoofd_schouder';

export type EmotionType =
  | 'happy'
  | 'curious'
  | 'surprised'
  | 'sleepy'
  | 'angry'
  | 'wink'
  | 'boot'
  | 'tap_head'
  | 'photograph';

export interface BatteryTelemetry {
  level: number;
  voltage: number;
  temperature: number;
  status: 'charging' | 'discharging' | 'full' | 'unknown';
  usb_powered: boolean;
}

export interface WifiTelemetry {
  ip: string;
  mac: string;
  connected: boolean;
}

export interface Vector3D {
  x: number;
  y: number;
  z: number;
}

export interface SensorTelemetry {
  gyro: Vector3D;
  accel: Vector3D;
  tilt_pitch: number;
  tilt_roll: number;
  is_fallen: boolean;
  head_touched: boolean;
  fall_direction: 'none' | 'forward' | 'backward' | 'left' | 'right';
  head_touch_ready?: boolean;
  fall_service_ready?: boolean;
}

export interface RobotTelemetry {
  connected: boolean;
  device_id: string;
  battery: BatteryTelemetry;
  wifi: WifiTelemetry;
  sensors: SensorTelemetry;
  services: Record<string, boolean>;
  timestamp: string;
}

export interface CommandRequestPayload {
  category: 'MOTION' | 'SPEECH' | 'EXPRESSION' | 'VISION' | 'SYSTEM';
  action: string;
  params?: Record<string, unknown>;
  source?: 'MANUAL_UI' | 'PRESET' | 'AI_AGENT' | 'WEBHOOK';
}

export interface CommandResult {
  success: boolean;
  category: string;
  action: string;
  data?: unknown;
  error?: string;
  executionTimeMs: number;
}

export interface ChoreographyStep {
  order: number;
  type: 'action' | 'speech' | 'expression' | 'delay' | 'servo';
  payload: Record<string, unknown>;
  delayMs: number;
}

