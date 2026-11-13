import { NextResponse } from 'next/server';
import { telemetryService } from '@/core/services/VisionService';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const telemetry = await telemetryService.getLiveTelemetry();
    return NextResponse.json(telemetry);
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}

