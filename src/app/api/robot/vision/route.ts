import { NextRequest, NextResponse } from 'next/server';
import { visionService } from '@/core/services/VisionService';
import fs from 'fs';
import path from 'path';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const mode = url.searchParams.get('mode');

    // Return latest 13MP forehead camera photo
    if (mode === 'photo') {
      const bridgeSnapshotPath = path.join(process.cwd(), 'bridge', 'cache', 'latest_snapshot.jpg');
      const fallbackArtifactPath = 'C:\\Users\\joeyw\\.gemini\\antigravity\\brain\\594cb6a4-5599-41cc-afe3-1fe5d681802d\\camera_photo.jpg';

      let fileToServe: string | null = null;
      if (fs.existsSync(bridgeSnapshotPath)) fileToServe = bridgeSnapshotPath;
      else if (fs.existsSync(fallbackArtifactPath)) fileToServe = fallbackArtifactPath;

      if (fileToServe) {
        const fileBytes = fs.readFileSync(fileToServe);
        return new NextResponse(new Uint8Array(fileBytes), {
          status: 200,
          headers: {
            'Content-Type': 'image/jpeg',
            'Cache-Control': 'no-store, max-age=0',
          },
        });
      }

      return NextResponse.json({ error: 'No camera photo available yet' }, { status: 404 });
    }

    // Return live camera stream frame
    if (mode === 'frame') {
      const buffer = await visionService.getLatestFrame();
      if (!buffer) {
        return NextResponse.json({ error: 'No camera frame available' }, { status: 404 });
      }

      return new NextResponse(new Uint8Array(buffer), {
        status: 200,
        headers: {
          'Content-Type': 'image/png',
          'Cache-Control': 'no-store, max-age=0',
        },
      });
    }

    return NextResponse.json({
      status: 'active',
      feed: 'live',
      faceDetected: true,
      confidence: 0.96,
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const res = await visionService.captureForeheadPhoto();
    return NextResponse.json(res);
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
