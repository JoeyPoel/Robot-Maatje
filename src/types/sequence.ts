/**
 * Type definitions for the Robot Maatje Drag & Drop Action Sequencer.
 * Supports chaining motions, turns, gestures, TTS speech, facial expressions, sound effects, and delays.
 */

import { EmotionType, PresetActionName } from './robot';

export type StepType = 'motion' | 'gesture' | 'speak' | 'expression' | 'sound' | 'pause';

export interface MotionParams {
  direction: 'forward' | 'backward' | 'left' | 'right';
  steps: number;
}

export interface GestureParams {
  action: PresetActionName;
}

export interface SpeakParams {
  text: string;
  language: 'nl-NL' | 'en-US';
}

export interface ExpressionParams {
  emotion: EmotionType;
}

export interface SoundParams {
  file: string;
  name: string;
}

export interface PauseParams {
  durationMs: number;
}

export type StepParams =
  | { type: 'motion'; params: MotionParams }
  | { type: 'gesture'; params: GestureParams }
  | { type: 'speak'; params: SpeakParams }
  | { type: 'expression'; params: ExpressionParams }
  | { type: 'sound'; params: SoundParams }
  | { type: 'pause'; params: PauseParams };

export interface SequenceStep {
  id: string;
  type: StepType;
  title: string;
  description: string;
  icon: string;
  color: string;
  params: StepParams['params'];
}

export interface PresetRoutine {
  id: string;
  title: string;
  description: string;
  badge?: string;
  steps: Array<Omit<SequenceStep, 'id'>>;
}

