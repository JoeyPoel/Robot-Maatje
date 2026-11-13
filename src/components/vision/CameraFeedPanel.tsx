'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Camera, RefreshCw, Play, Pause, CheckCircle2, Maximize2, Eye, UserCheck } from 'lucide-react';
import { THEME } from '@/config/theme';

interface FaceBox {
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
}

export const CameraFeedPanel: React.FC = () => {
  const [isLive, setIsLive] = useState(true);
  const [frameSrc, setFrameSrc] = useState<string>(`/api/robot/vision?mode=frame&t=${Date.now()}`);
  const [isCapturingSnapshot, setIsCapturingSnapshot] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>('Live camera actief');
  const [frameCount, setFrameCount] = useState(1);
  const [highResPhotoUrl, setHighResPhotoUrl] = useState<string | null>(null);

  // Person / Face Tracking State
  const [isTracking, setIsTracking] = useState(false);
  const [detectedBox, setDetectedBox] = useState<FaceBox | null>(null);
  const isMovingRef = useRef(false);
  const lastActionTimeRef = useRef(0);

  // Active continuous live stream loop
  useEffect(() => {
    if (!isLive) return;

    let isMounted = true;
    const interval = setInterval(() => {
      const nextTimestamp = Date.now();
      const nextUrl = `/api/robot/vision?mode=frame&t=${nextTimestamp}`;
      const img = new Image();

      img.onload = () => {
        if (!isMounted) return;
        setFrameSrc(nextUrl);
        setFrameCount((prev) => prev + 1);

        // Run face detection if auto-tracking is enabled
        if (isTracking && !isMovingRef.current) {
          detectAndFollow(img);
        }
      };

      img.src = nextUrl;
    }, 1200);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [isLive, isTracking]);

  /**
   * Detects face in camera feed and aligns robot's head/body to track the user.
   */
  const detectAndFollow = async (img: HTMLImageElement) => {
    try {
      const now = Date.now();
      // Throttle movement actions to avoid overwhelming servo kinematics
      if (now - lastActionTimeRef.current < 2500) return;

      let face: { x: number; y: number; width: number; height: number } | null = null;

      // 1. Try native Chromium FaceDetector if supported
      if (typeof window !== 'undefined' && 'FaceDetector' in window) {
        try {
          const detector = new (window as any).FaceDetector({ fastMode: true, maxDetectedFaces: 1 });
          const faces = await detector.detect(img);
          if (faces && faces.length > 0) {
            const b = faces[0].boundingBox;
            face = { x: b.x, y: b.y, width: b.width, height: b.height };
          }
        } catch {
          // Fallback
        }
      }

      // 2. Fallback heuristic detection if native API not present
      if (!face && img.width > 0 && img.height > 0) {
        // Draw to small offscreen canvas to detect skin-tone or central contrast
        const canvas = document.createElement('canvas');
        canvas.width = 160;
        canvas.height = 120;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, 160, 120);
          const data = ctx.getImageData(0, 0, 160, 120).data;
          let sumX = 0;
          let count = 0;
          // Simple skin tone / facial contrast centroid
          for (let i = 0; i < data.length; i += 16) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            if (r > 60 && g > 40 && b > 20 && r > g && r > b) {
              const pixelIndex = i / 4;
              const px = pixelIndex % 160;
              sumX += px;
              count++;
            }
          }
          if (count > 80) {
            const avgX = (sumX / count) / 160;
            face = {
              x: (avgX * img.width) - (img.width * 0.15),
              y: img.height * 0.25,
              width: img.width * 0.3,
              height: img.height * 0.35,
            };
          }
        }
      }

      if (face && img.width > 0) {
        const centerX = (face.x + face.width / 2) / img.width;
        setDetectedBox({
          x: (face.x / img.width) * 100,
          y: (face.y / img.height) * 100,
          width: (face.width / img.width) * 100,
          height: (face.height / img.height) * 100,
          label: 'Gezicht gedetecteerd',
        });

        // Person is to the LEFT -> turn HEAD to the left (Zero leg movement, 100% native)
        if (centerX < 0.38) {
          isMovingRef.current = true;
          lastActionTimeRef.current = now;
          setStatusMessage('👀 Hoofd draaien naar links...');
          await fetch('/api/robot/motion', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'preset', action: 'head_left' }),
          });
          isMovingRef.current = false;
        }
        // Person is to the RIGHT -> turn HEAD to the right (Zero leg movement, 100% native)
        else if (centerX > 0.62) {
          isMovingRef.current = true;
          lastActionTimeRef.current = now;
          setStatusMessage('👀 Hoofd draaien naar rechts...');
          await fetch('/api/robot/motion', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'preset', action: 'head_right' }),
          });
          isMovingRef.current = false;
        }
        // Centered -> lock on, center head and show heart eyes (Zero API tokens)
        else {
          setStatusMessage('🎯 Oogcontact vastgelegd (Hartjesogen 🥰)');
          // Trigger heart eyes on robot's physical screens
          await fetch('/api/robot/expression', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'emotion', emotion: 'heart' }),
          }).catch(() => {});
        }
      } else {
        setDetectedBox(null);
      }
    } catch (e) {
      console.warn('Face follow loop:', e);
      isMovingRef.current = false;
    }
  };

  const handleCaptureHighRes = async () => {
    setIsCapturingSnapshot(true);
    setStatusMessage('13MP foto vastleggen via voorhoofdsensor...');
    try {
      const res = await fetch('/api/robot/vision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'snapshot' }),
      });
      await res.json();
      const photoUrl = `/api/robot/vision?mode=photo&t=${Date.now()}`;
      setHighResPhotoUrl(photoUrl);
      setStatusMessage('13MP foto succesvol opgeslagen!');
    } catch (err: unknown) {
      setStatusMessage(`Error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsCapturingSnapshot(false);
    }
  };

  return (
    <div
      className={`rounded-2xl p-5 flex flex-col gap-4 ${THEME.borders.panel} shadow-xl`}
      style={{ backgroundColor: THEME.colors.surface }}
    >
      {/* Panel Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <Camera className="w-5 h-5 text-[#00D26A]" />
          <h2 className="text-sm font-bold tracking-wider text-white">
            CAMERA VOORHOOFD (LIVE)
          </h2>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          {isLive ? (
            <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-[#00D26A]/20 border border-[#00D26A]/50 text-[#00D26A] font-bold">
              <span className="w-2 h-2 rounded-full bg-[#00D26A] animate-ping inline-block" />
              LIVE
            </span>
          ) : (
            <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-amber-500/20 border border-amber-500 text-amber-300 font-bold">
              GEPAUZEERD
            </span>
          )}
          <span className="px-2 py-0.5 rounded bg-[#1E1647] border border-white/10 text-white/70">
            #{frameCount}
          </span>
        </div>
      </div>

      {/* Main Viewport: Pixel-perfect 4:3 crop to the camera viewfinder */}
      <div className="relative aspect-[4/3] w-full rounded-xl bg-black border border-white/10 overflow-hidden shadow-inner flex items-center justify-center">
        <img
          src={frameSrc}
          alt="Robot 13MP Viewfinder"
          className="absolute w-full max-w-none select-none pointer-events-none transition-opacity duration-150"
          style={{
            height: '237.04%',
            top: '-57.22%',
            left: '0%',
            objectFit: 'fill',
          }}
          onError={(e) => {
            (e.target as HTMLElement).style.opacity = '0.5';
          }}
        />

        {/* Dynamic Bounding Box when Person/Face is tracked */}
        {detectedBox && isTracking && (
          <div
            className="absolute border-2 border-[#00D26A] rounded-lg pointer-events-none transition-all duration-300 shadow-[0_0_15px_rgba(0,210,106,0.5)]"
            style={{
              left: `${Math.max(5, Math.min(80, detectedBox.x))}%`,
              top: `${Math.max(10, Math.min(70, detectedBox.y))}%`,
              width: `${Math.max(15, Math.min(50, detectedBox.width))}%`,
              height: `${Math.max(20, Math.min(60, detectedBox.height))}%`,
            }}
          >
            <div className="absolute -top-6 left-0 bg-[#00D26A] text-slate-950 font-bold text-[10px] px-2 py-0.5 rounded flex items-center gap-1 shadow-sm whitespace-nowrap font-mono">
              <UserCheck className="w-3 h-3" />
              <span>Gezicht Gevolg (Lock)</span>
            </div>
          </div>
        )}

        {/* Clean minimal stream indicator */}
        <div className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-[#1E1647]/90 border border-white/10 text-[11px] font-mono text-white flex items-center gap-2 backdrop-blur-sm pointer-events-none">
          <span className={`w-2 h-2 rounded-full ${isLive ? 'bg-[#00D26A] animate-pulse' : 'bg-white/50'}`} />
          <span className="font-semibold">
            {isTracking ? '👁️ HOOFDVOLGING (LOKAAL & TOKEN-VRIJ)' : isLive ? 'OPTISCHE SENSOR' : 'STREAM GEPAUZEERD'}
          </span>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-2">
          {/* Pause / Resume Live Stream */}
          <button
            onClick={() => setIsLive(!isLive)}
            className={`py-2 px-3 rounded-lg font-mono font-bold text-xs flex items-center gap-1.5 transition-all border ${
              isLive
                ? 'bg-[#1E1647] border-white/15 text-white/80 hover:text-white hover:border-white/30'
                : 'bg-[#00D26A] text-slate-950 shadow-md font-bold'
            }`}
          >
            {isLive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            {isLive ? 'PAUZE' : 'HERVAT'}
          </button>

          {/* Toggle Auto Head Face Following (Zero leg movement, zero tokens) */}
          <button
            onClick={() => setIsTracking(!isTracking)}
            className={`py-2 px-3.5 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all shadow-md border ${
              isTracking
                ? 'bg-[#00D26A] text-slate-950 border-[#00D26A] font-extrabold shadow-[0_0_12px_rgba(0,210,106,0.3)]'
                : 'bg-[#1E1647] border-white/20 text-white/90 hover:border-white/40'
            }`}
            title="Laat Maatje puur zijn hoofd draaien om naar je te kijken (100% lokaal, zonder tokens of beensprongen)"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>{isTracking ? 'Hoofd Volgen Actief ✓' : 'Volg met Hoofd'}</span>
          </button>

          {/* Snap 13MP High-Res Photo (HvA Coral Pink Button) */}
          <button
            onClick={handleCaptureHighRes}
            disabled={isCapturingSnapshot}
            className="py-2 px-3.5 rounded-lg font-mono font-bold text-xs flex items-center gap-1.5 transition-all bg-[#E15E7A] hover:bg-[#D04E6A] text-white shadow-md disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isCapturingSnapshot ? 'animate-spin' : ''}`} />
            {isCapturingSnapshot ? 'FOTO MAKEN...' : 'FOTO MAKEN'}
          </button>
        </div>

        {statusMessage && (
          <span className="text-xs font-mono text-[#00D26A] flex items-center gap-1.5 truncate">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#00D26A] shrink-0" />
            <span className="truncate">{statusMessage}</span>
          </span>
        )}
      </div>

      {/* Captured High-Res Gallery Preview */}
      {highResPhotoUrl && (
        <div className="p-3 rounded-lg bg-[#040A18]/80 border border-[#1A2952] flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs font-mono text-slate-300">
            <span className="font-bold text-[#00D26A]">CAPTURED 13MP FOREHEAD PHOTO</span>
            <a
              href={highResPhotoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] text-[#00D26A] hover:underline flex items-center gap-1"
            >
              <Maximize2 className="w-3 h-3" />
              Full Resolution (823 KB)
            </a>
          </div>
          <div className="relative aspect-[4/3] w-full rounded bg-black overflow-hidden border border-[#1A2952]">
            <img src={highResPhotoUrl} alt="13MP High Resolution Capture" className="w-full h-full object-cover" />
          </div>
        </div>
      )}
    </div>
  );
};
