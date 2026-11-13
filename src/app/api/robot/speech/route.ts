import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { speechService } from '@/core/services/SpeechService';

const SpeechRequestSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('speak'),
    text: z.string().trim().min(1).max(500),
    language: z.enum(['nl-NL', 'en-US']).default('nl-NL'),
    source: z.string().optional(),
  }),
  z.object({
    type: z.literal('volume'),
    level: z.number().int().min(0).max(100),
    source: z.string().optional(),
  }),
]);

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const parsed = SpeechRequestSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid speech payload', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { data } = parsed;

    if (data.type === 'speak') {
      const res = await speechService.speak(data.text, data.language, data.source);
      return NextResponse.json(res, { status: res.success ? 200 : 502 });
    }

    if (data.type === 'volume') {
      const res = await speechService.setVolume(data.level, data.source);
      return NextResponse.json(res, { status: res.success ? 200 : 502 });
    }

    return NextResponse.json({ error: 'Unsupported action type' }, { status: 400 });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
