import { NextRequest, NextResponse } from 'next/server';
import { llmProxyService } from '@/core/services/LlmProxyService';

export async function POST(req: NextRequest) {
  try {
    let prompt = 'Wat zie je voor de camera van Maatje? Benoem personen, objecten en de context in 1 of 2 korte Nederlandse zinnen.';
    try {
      const body = await req.json();
      if (body.prompt) prompt = body.prompt;
    } catch {
      // Default prompt
    }

    const description = await llmProxyService.analyzeLiveCamera(prompt);

    return NextResponse.json({
      success: true,
      description,
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    console.error('[Vision AI Route Error]:', err);
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}

