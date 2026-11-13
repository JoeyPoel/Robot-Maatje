import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { aiOrchestratorService } from '@/core/services/AIOrchestratorService';

const AIHookSchema = z.discriminatedUnion('event', [
  z.object({
    event: z.literal('user_speech'),
    text: z.string().min(1),
    confidence: z.number().optional(),
  }),
  z.object({
    event: z.literal('vision_detection'),
    entities: z.array(
      z.object({
        label: z.string(),
        confidence: z.number(),
        box: z.object({
          x: z.number(),
          y: z.number(),
          width: z.number(),
          height: z.number(),
        }),
      })
    ),
  }),
  z.object({
    event: z.literal('sensor_trigger'),
    sensor: z.enum(['head_touch', 'fall_detected', 'low_battery']),
    value: z.any().optional(),
  }),
]);

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const parsed = AIHookSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid AI hook payload', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { data } = parsed;

    if (data.event === 'user_speech') {
      const plan = await aiOrchestratorService.handleUserInput(data.text);
      return NextResponse.json({
        handled: true,
        event: 'user_speech',
        plan,
        orchestratedBy: aiOrchestratorService.getAgentName(),
      });
    }

    if (data.event === 'sensor_trigger') {
      if (data.sensor === 'head_touch') {
        const plan = await aiOrchestratorService.handleUserInput('Aanraking op hoofd');
        return NextResponse.json({ handled: true, plan });
      }
      if (data.sensor === 'fall_detected') {
        const plan = await aiOrchestratorService.handleUserInput('Ik ben gevallen, help me opstaan');
        return NextResponse.json({ handled: true, plan });
      }
    }

    return NextResponse.json({
      handled: true,
      event: data.event,
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}

