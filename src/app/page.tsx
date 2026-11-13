'use client';

import React, { useState, useEffect } from 'react';
import { Bot, Sparkles, Terminal, Activity, ArrowRight, ShieldCheck, OctagonAlert } from 'lucide-react';
import { SensorStatusBar } from '@/components/telemetry/SensorStatusBar';
import { CameraFeedPanel } from '@/components/vision/CameraFeedPanel';
import { ServoAndActionPanel } from '@/components/motion/ServoAndActionPanel';
import { SpeechAndAudioPanel } from '@/components/speech/SpeechAndAudioPanel';
import { EyeExpressionMatrix } from '@/components/expression/EyeExpressionMatrix';
import { RobotTelemetry } from '@/types/robot';
import { STRINGS } from '@/config/strings';
import { THEME } from '@/config/theme';

export default function CommandCenterPage() {
  const [telemetry, setTelemetry] = useState<RobotTelemetry | null>(null);
  const [aiTestPrompt, setAiTestPrompt] = useState('Hallo Maatje, kun je voor mij een dansje doen?');
  const [aiResponseLog, setAiResponseLog] = useState<string | null>(null);
  const [isAiExecuting, setIsAiExecuting] = useState(false);

  // Poll live telemetry every 3 seconds from Next.js API
  useEffect(() => {
    let isMounted = true;
    const fetchTelemetry = async () => {
      try {
        const res = await fetch('/api/robot/telemetry', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (isMounted) setTelemetry(data);
        }
      } catch {
        // Degraded fallback
      }
    };

    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 3000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const handleTestAiPipeline = async () => {
    if (!aiTestPrompt.trim()) return;
    setIsAiExecuting(true);
    setAiResponseLog('Dispatching event to AI Orchestrator Pipeline...');
    try {
      const res = await fetch('/api/hooks/ai-pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'user_speech',
          text: aiTestPrompt,
          confidence: 0.98,
        }),
      });
      const data = await res.json();
      setAiResponseLog(
        `AI Plan Executed (${data.orchestratedBy || 'LLM'}):\nSpeech: "${data.plan?.speechReply}"\nMotion: [${data.plan?.motionAction}]\nEmotion: [${data.plan?.eyeEmotion}]`
      );
    } catch (err: any) {
      setAiResponseLog(`AI Pipeline Error: ${err.message}`);
    } finally {
      setIsAiExecuting(false);
    }
  };

  return (
    <main
      className="min-h-screen text-slate-100 flex flex-col p-4 md:p-6 lg:p-8 font-sans"
      style={{ backgroundColor: THEME.colors.background }}
    >
      <div className="max-w-7xl w-full mx-auto flex flex-col gap-6">
        {/* Top Navigation Header (HvA Corporate Identity) */}
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-[#1A2952] pb-5">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-[#25167A] border border-[#3E2BAA] shadow-lg shadow-[#25167A]/30">
              <svg viewBox="0 0 32 32" className="w-7 h-7" fill="none">
                <polygon points="4,28 16,6 28,28" fill="#FFFFFF" />
                <polygon points="11,28 20,12 29,28" fill="#00D26A" fillOpacity="0.85" />
                <polygon points="16,28 24,16 32,28" fill="#FF3E83" fillOpacity="0.9" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <span className="px-2 py-0.5 rounded-md text-[11px] font-black tracking-widest bg-[#25167A] text-white border border-[#3E2BAA]">
                  HvA
                </span>
                <h1 className="text-lg md:text-xl font-mono font-extrabold tracking-wider text-white">
                  ROBOT MAATJE // ALPHA MINI
                </h1>
              </div>
              <p className="text-xs font-mono text-slate-400 mt-0.5">
                Hogeschool van Amsterdam &bull; <span className="text-[#00D26A] font-semibold">Creating Tomorrow</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono">
            {/* Global Emergency Cancel Button in HvA Sweet Pink */}
            <button
              onClick={async () => {
                try {
                  await fetch('/api/robot/motion', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ type: 'stop' }),
                  });
                } catch {}
              }}
              className="px-3.5 py-2 rounded-lg border border-[#FF3E83]/80 bg-[#FF3E83]/20 hover:bg-[#FF3E83] text-[#FFA8C8] hover:text-white flex items-center gap-2 font-bold shadow-lg transition-all active:scale-95"
            >
              <OctagonAlert className="w-4 h-4 text-[#FF3E83] group-hover:text-white" />
              <span>NOODSTOP / CANCEL ALL</span>
            </button>

            <div className="px-3 py-2 rounded-lg border border-[#1A2952] bg-[#0A1329] flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#00D26A]" />
              <span>SAFETY CLAMPS: <strong className="text-[#00D26A]">ACTIVE</strong></span>
            </div>
          </div>
        </header>

        {/* Realtime Sensor Telemetry Bar */}
        <SensorStatusBar telemetry={telemetry} isPolling={true} />

        {/* Primary Command Center Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Vision Feed & AI Overlay */}
          <CameraFeedPanel />

          {/* Dual Eye LCD Matrix & Expressions */}
          <EyeExpressionMatrix />

          {/* 14-Servo Kinematics & Motion Presets */}
          <ServoAndActionPanel />

          {/* Speech, TTS & Audio Stream */}
          <SpeechAndAudioPanel />
        </div>

        {/* Future-Proof AI Pipeline & Model Integration Section */}
        <section
          className={`rounded-xl p-6 flex flex-col gap-4 border border-slate-800/80`}
          style={{ backgroundColor: THEME.colors.surface }}
        >
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <h3 className="text-sm font-mono font-bold tracking-wider text-white">
                {STRINGS.ai.title}
              </h3>
            </div>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30">
              API HOOK: /api/hooks/ai-pipeline
            </span>
          </div>

          <p className="text-xs font-sans text-slate-400 leading-relaxed">
            External multimodal models (LLM, Whisper STT, Vision Transformers) hook directly into this pipeline. Test the orchestrator by sending a natural language prompt below:
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={aiTestPrompt}
              onChange={(e) => setAiTestPrompt(e.target.value)}
              className="flex-1 px-4 py-2.5 rounded-lg bg-slate-900 border border-slate-800 text-sm font-mono text-white focus:outline-none focus:border-amber-400"
            />
            <button
              onClick={handleTestAiPipeline}
              disabled={isAiExecuting}
              className="px-5 py-2.5 rounded-lg font-mono font-bold text-xs bg-amber-500 hover:bg-amber-400 text-black flex items-center justify-center gap-2 transition-all shadow-md disabled:opacity-50"
            >
              <Terminal className="w-4 h-4" />
              <span>{STRINGS.ai.triggerStub}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {aiResponseLog && (
            <pre className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-cyan-300 whitespace-pre-wrap">
              {aiResponseLog}
            </pre>
          )}
        </section>
      </div>
    </main>
  );
}

