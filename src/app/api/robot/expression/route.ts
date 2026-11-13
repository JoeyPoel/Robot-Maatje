import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { expressionService } from '@/core/services/ExpressionService';
import { EmotionType } from '@/types/robot';

const ExpressionRequestSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('emotion'),
    emotion: z.enum([
      'happy',
      'curious',
      'surprised',
      'sleepy',
      'angry',
      'wink',
      'boot',
      'tap_head',
      'photograph',
    ]),
    source: z.string().optional(),
  }),
  z.object({
    type: z.literal('mouth_lamp'),
    enable: z.boolean(),
    color: z.union([z.string(), z.number()]).optional(),
    mode: z.number().optional(),
    duration: z.number().optional(),
    breathDuration: z.number().optional(),
    source: z.string().optional(),
  }),
]);

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const parsed = ExpressionRequestSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid expression payload', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { data } = parsed;

    if (data.type === 'emotion') {
      const res = await expressionService.setEmotion(data.emotion as EmotionType, data.source);
      return NextResponse.json(res);
    }

    if (data.type === 'mouth_lamp') {
      const res = await expressionService.setMouthLamp(
        data.enable,
        data.color ?? 2,
        data.mode ?? 1,
        data.duration ?? 3000,
        data.breathDuration ?? 1000,
        data.source
      );
      return NextResponse.json(res);
    }

    return NextResponse.json({ error: 'Unsupported action type' }, { status: 400 });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}

