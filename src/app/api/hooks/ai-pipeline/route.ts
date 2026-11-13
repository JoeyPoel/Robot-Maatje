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
      const result = await aiOrchestratorService.handleUserInput(data.text);
      return NextResponse.json({
        handled: true,
        event: 'user_speech',
        result,
      });
    }

    if (data.event === 'sensor_trigger') {
      if (data.sensor === 'head_touch') {
        const result = await aiOrchestratorService.handleUserInput(
          'Iemand aait zojuist zachtjes over mijn hoofd. Reageer met liefdevolle hartjesogen en zeg iets liefs!'
        );
        return NextResponse.json({ handled: true, result });
      }
      if (data.sensor === 'fall_detected') {
        const result = await aiOrchestratorService.handleUserInput(
          'Oei, de gyroscoop detecteert dat ik gevallen ben. Zeg dat het goed gaat en probeer op te staan!'
        );
        return NextResponse.json({ handled: true, result });
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
