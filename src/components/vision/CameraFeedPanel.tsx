'use client';

import React, { useState, useEffect } from 'react';
import { Camera, RefreshCw, Play, Pause, CheckCircle2, Maximize2 } from 'lucide-react';
import { THEME } from '@/config/theme';

export const CameraFeedPanel: React.FC = () => {
  const [isLive, setIsLive] = useState(true);
  const [frameSrc, setFrameSrc] = useState<string>(`/api/robot/vision?mode=frame&t=${Date.now()}`);
  const [isCapturingSnapshot, setIsCapturingSnapshot] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>('Live video feed active');
  const [frameCount, setFrameCount] = useState(1);
  const [highResPhotoUrl, setHighResPhotoUrl] = useState<string | null>(null);

  // Active continuous live stream loop
  useEffect(() => {
    if (!isLive) return;

    let isMounted = true;
    const interval = setInterval(() => {
      const nextTimestamp = Date.now();
      const nextUrl = `/api/robot/vision?mode=frame&t=${nextTimestamp}`;
      const img = new Image();

      img.onload = () => {
        if (isMounted) {
          setFrameSrc(nextUrl);
          setFrameCount((prev) => prev + 1);
        }
      };

      img.src = nextUrl;
    }, 1200);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [isLive]);

  const handleCaptureHighRes = async () => {
    setIsCapturingSnapshot(true);
    setStatusMessage('Capturing 13MP photo from forehead sensor...');
    try {
      const res = await fetch('/api/robot/vision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'snapshot' }),
      });
      await res.json();
      const photoUrl = `/api/robot/vision?mode=photo&t=${Date.now()}`;
      setHighResPhotoUrl(photoUrl);
      setStatusMessage('13MP high-res photo captured successfully!');
    } catch (err: unknown) {
      setStatusMessage(`Error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsCapturingSnapshot(false);
    }
  };

  return (
    <div
      className={`rounded-xl p-5 flex flex-col gap-4 ${THEME.borders.panel}`}
      style={{ backgroundColor: THEME.colors.surface }}
    >
      {/* Panel Header */}
      <div className="flex items-center justify-between border-b border-[#1A2952] pb-3">
        <div className="flex items-center gap-2">
          <Camera className="w-5 h-5 text-[#00D26A]" />
          <h2 className="text-sm font-mono font-bold tracking-wider text-white">
            13MP FOREHEAD CAMERA FEED
          </h2>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          {isLive ? (
            <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-[#00D26A]/10 border border-[#00D26A]/50 text-[#00D26A] font-bold">
              <span className="w-2 h-2 rounded-full bg-[#00D26A] animate-ping inline-block" />
              LIVE
            </span>
          ) : (
            <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-amber-950/60 border border-amber-500/50 text-amber-400 font-bold">
              PAUSED
            </span>
          )}
          <span className="px-2 py-0.5 rounded bg-[#040A18] border border-[#1A2952] text-slate-400">
            #{frameCount}
          </span>
        </div>
      </div>

      {/* Main Viewport: Pixel-perfect 4:3 crop to the 720x540 camera viewfinder */}
      <div className="relative aspect-[4/3] w-full rounded-lg bg-black border border-[#1A2952] overflow-hidden shadow-inner flex items-center justify-center">
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

        {/* Clean minimal stream indicator */}
        <div className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-[#040A18]/85 border border-[#1A2952] text-[11px] font-mono text-slate-200 flex items-center gap-2 backdrop-blur-sm pointer-events-none">
          <span className={`w-2 h-2 rounded-full ${isLive ? 'bg-[#00D26A] animate-pulse' : 'bg-slate-500'}`} />
          <span className="font-semibold">{isLive ? '13MP OPTICAL SENSOR' : 'STREAM PAUSED'}</span>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-2">
          {/* Pause / Resume Live Stream */}
          <button
            onClick={() => setIsLive(!isLive)}
            className={`py-2 px-3.5 rounded-lg font-mono font-bold text-xs flex items-center gap-1.5 transition-all border ${
              isLive
                ? 'bg-[#040A18] border-[#1A2952] text-slate-300 hover:text-white hover:border-slate-600'
                : 'bg-[#00D26A] text-slate-950 shadow-md font-bold'
            }`}
          >
            {isLive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            {isLive ? 'PAUSE' : 'RESUME'}
          </button>

          {/* Snap 13MP High-Res Photo (HvA Purple Button) */}
          <button
            onClick={handleCaptureHighRes}
            disabled={isCapturingSnapshot}
            className="py-2 px-4 rounded-lg font-mono font-bold text-xs flex items-center gap-1.5 transition-all bg-[#25167A] hover:bg-[#2C18A0] text-white border border-[#3E2BAA] shadow-md shadow-[#25167A]/30 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isCapturingSnapshot ? 'animate-spin' : ''}`} />
            {isCapturingSnapshot ? 'SNAPPING PHOTO...' : 'CAPTURE 13MP PHOTO'}
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
