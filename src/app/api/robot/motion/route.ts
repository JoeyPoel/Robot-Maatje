import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { motionService } from '@/core/services/MotionService';
import { JointName, PresetActionName } from '@/types/robot';

const MotionRequestSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('preset'),
    action: z.enum([
      'say_hello_avatar',
      'stand_up',
      'standbysquat_001',
      'zitten',
      'move_forward_avatar',
      'turn_left_avatar',
      'turn_right_avatar',
      'bow_avatar',
      'handshake_avatar',
      'act_cute_avatar',
      'air_kiss_avatar',
      'hug_avatar',
      'dance_0001en',
      'dance_0001',
      'w_head_001',
      'speakingAct1',
      'klappen',
      'heupen',
      'fysio1',
      'fysio2',
      'knikarm',
      'nod',
      'shake_head',
      'tilt_head',
      'wave',
      'bow',
      'pushups',
      'scheet',
      'armoefening',
      'hoofd_schouder',
      'head_left',
      'head_right',
      'head_center',
      'w_head_004_v',
      'w_head_005_v',
    ]),
    source: z.string().optional(),
  }),
  z.object({
    type: z.literal('walk'),
    direction: z.enum(['forward', 'backward', 'left', 'right']),
    steps: z.number().min(1).max(10).default(1),
    source: z.string().optional(),
  }),
  z.object({
    type: z.literal('servo'),
    joint: z.enum([
      'head_yaw',
      'head_pitch',
      'left_shoulder_pitch',
      'left_shoulder_roll',
      'left_elbow',
      'right_shoulder_pitch',
      'right_shoulder_roll',
      'right_elbow',
      'left_hip_yaw',
      'left_hip_roll',
      'left_hip_pitch',
      'left_knee',
      'left_ankle',
      'right_hip_yaw',
      'right_hip_roll',
      'right_hip_pitch',
      'right_knee',
      'right_ankle',
    ]),
    angle: z.number().min(-180).max(180),
    source: z.string().optional(),
  }),
  z.object({
    type: z.literal('stop'),
    source: z.string().optional(),
  }),
]);

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const parsed = MotionRequestSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid motion payload', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { data } = parsed;

    if (data.type === 'preset') {
      const res = await motionService.executePresetAction(
        data.action as PresetActionName,
        data.source
      );
      return NextResponse.json(res);
    }

    if (data.type === 'walk') {
      const res = await motionService.walk(
        data.direction,
        data.steps,
        data.source
      );
      return NextResponse.json(res);
    }

    if (data.type === 'servo') {
      const res = await motionService.setServoAngle(
        data.joint as JointName,
        data.angle,
        data.source
      );
      return NextResponse.json(res);
    }

    if (data.type === 'stop') {
      const res = await motionService.emergencyStop(data.source);
      return NextResponse.json(res);
    }

    return NextResponse.json({ error: 'Unsupported motion type' }, { status: 400 });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}

