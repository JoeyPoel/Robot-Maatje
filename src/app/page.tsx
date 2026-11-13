'use client';

import React, { useState, useEffect } from 'react';
import { OctagonAlert, Search, ChevronDown, ArrowRight, BookOpen, RotateCcw, ShieldCheck, HeartHandshake } from 'lucide-react';
import { SensorStatusBar } from '@/components/telemetry/SensorStatusBar';
import { CameraFeedPanel } from '@/components/vision/CameraFeedPanel';
import { ServoAndActionPanel } from '@/components/motion/ServoAndActionPanel';
import { SpeechAndAudioPanel } from '@/components/speech/SpeechAndAudioPanel';
import { EyeExpressionMatrix } from '@/components/expression/EyeExpressionMatrix';
import { AIAssistantPanel } from '@/components/ai/AIAssistantPanel';
import { ActionSequencerPanel } from '@/components/sequencer/ActionSequencerPanel';
import { GebruikershandleidingModal } from '@/components/manual/GebruikershandleidingModal';
import { HvaEmblem } from '@/components/ui/HvaLogo';
import { RobotTelemetry } from '@/types/robot';
import { THEME } from '@/config/theme';

export default function CommandCenterPage() {
  const [telemetry, setTelemetry] = useState<RobotTelemetry | null>(null);
  const [showManual, setShowManual] = useState(false);

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

  const triggerStandUp = async () => {
    try {
      await fetch('/api/robot/motion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'preset', action: 'stand_up' }),
      });
    } catch {}
  };

  const triggerSit = async () => {
    try {
      await fetch('/api/robot/motion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'preset', action: 'zitten' }),
      });
    } catch {}
  };

  const triggerEmergencyStop = async () => {
    try {
      await fetch('/api/robot/motion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'stop' }),
      });
    } catch {}
  };

  return (
    <main
      className="min-h-screen text-white flex flex-col font-sans"
      style={{ backgroundColor: THEME.colors.hvaRoyalBlue }}
    >
      {/* 1. Official HvA Top Navigation Header */}
      <header className="w-full border-b border-white/15 px-4 sm:px-8 py-4 flex items-center justify-between gap-4 sticky top-0 z-50 backdrop-blur-md bg-[#3220B0]/95 shadow-md">
        {/* Left: Hogeschool van Amsterdam Official Logo & Typography */}
        <div className="flex items-center gap-3.5">
          <div className="flex items-center gap-3">
            <HvaEmblem className="w-8 h-8 text-white shrink-0" />
            <div>
              <span className="font-extrabold text-base md:text-lg tracking-tight text-white block leading-tight">
                Hogeschool van Amsterdam
              </span>
              <span className="text-[11px] font-semibold text-white/70 block">
                Robot Maatje // Zorg & Onderwijs
              </span>
            </div>
          </div>
        </div>

        {/* Center Navigation Links (Matching hva.nl header) */}
        <nav className="hidden lg:flex items-center gap-7 text-sm font-bold">
          <a href="#bediening" className="hover:text-white/80 transition-colors">
            Bediening
          </a>
          <a href="#choreograaf" className="hover:text-white/80 transition-colors">
            Choreograaf
          </a>
          <button
            onClick={() => setShowManual(true)}
            className="hover:text-white/80 transition-colors font-bold text-left"
          >
            Gebruikershandleiding
          </button>
        </nav>

        {/* Right Action Utilities: Handleiding Button, Emergency Stop, Search Icon & Language */}
        <div className="flex items-center gap-3">
          {/* Quick Manual Button */}
          <button
            onClick={() => setShowManual(true)}
            className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center gap-1.5 font-bold text-xs border border-white/20 transition-all"
            title="Open interactieve handleiding voor docenten en zorg"
          >
            <BookOpen className="w-3.5 h-3.5 text-[#00D26A]" />
            <span className="hidden sm:inline">Handleiding</span>
          </button>

          {/* Emergency Stop Pill (HvA Coral Pink #E15E7A) */}
          <button
            onClick={triggerEmergencyStop}
            className="px-3.5 sm:px-4 py-2 rounded-lg bg-[#E15E7A] hover:bg-[#D04E6A] text-white flex items-center gap-2 font-extrabold text-xs shadow-lg transition-all active:scale-95"
            title="Brengt robot direct tot stilstand en herstelt balans"
          >
            <OctagonAlert className="w-4 h-4" />
            <span className="hidden sm:inline">NOODSTOP / CANCEL</span>
          </button>

          {/* Language Indicator */}
          <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-white/20 text-xs font-bold text-white hover:bg-white/10 cursor-pointer transition-colors">
            <span>NL</span>
            <ChevronDown className="w-3.5 h-3.5" />
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="max-w-7xl w-full mx-auto flex flex-col gap-8 p-4 sm:p-6 lg:p-8">
        {/* 2. Hero Section (Over de HvA Style with Polygon Chevron Arrow) */}
        <section className="relative overflow-hidden rounded-3xl bg-[#22167A] p-6 sm:p-10 border border-white/15 shadow-2xl">
          {/* Decorative geometric polygon arrow pointing right (as seen in HvA styleguide) */}
          <div
            className="absolute top-0 right-0 w-72 md:w-96 h-full opacity-40 pointer-events-none hidden md:block"
            style={{
              clipPath: 'polygon(25% 0%, 100% 0%, 100% 100%, 25% 100%, 75% 50%)',
              backgroundColor: '#1E1647',
            }}
          />

          <div className="relative z-10 max-w-2xl flex flex-col gap-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[#1E1647] border border-white/15 text-xs font-bold w-fit text-[#E15E7A]">
              <span>HvA Robotica &bull; Alpha Mini Platform</span>
            </div>
            <h1 className="text-2xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white leading-tight">
              Over Robot Maatje
            </h1>
            <p className="text-sm sm:text-base text-white/85 leading-relaxed mt-1">
              De Hogeschool van Amsterdam zet humanoïde robotica in voor onderwijs, zorg en welzijn. Bedien Maatje direct via de onderstaande panelen of ontwerp je eigen routines met de drag &amp; drop choreograaf.
            </p>
            <div className="pt-2">
              <button
                onClick={() => setShowManual(true)}
                className="px-4 py-2.5 rounded-xl bg-[#E15E7A] hover:bg-[#D04E6A] font-extrabold text-xs sm:text-sm text-white inline-flex items-center gap-2 shadow-lg transition-all active:scale-95"
              >
                <BookOpen className="w-4 h-4" />
                <span>Bekijk Nederlandse Gebruikershandleiding &rarr;</span>
              </button>
            </div>
          </div>
        </section>

        {/* 3. Realtime Telemetry Bar */}
        <SensorStatusBar telemetry={telemetry} />

        {/* 4. Primary Command Center Grid */}
        <div id="bediening" className="grid grid-cols-1 lg:grid-cols-2 gap-6 scroll-mt-24">
          {/* Forehead Camera Viewfinder with Face/Person Tracking */}
          <CameraFeedPanel />

          {/* AI Assistant & Conversation Brain (HvA / UvA LiteLLM Proxy) */}
          <AIAssistantPanel />

          {/* Dual Eye LCD Matrix & Expressions */}
          <EyeExpressionMatrix />

          {/* 14-Servo Kinematics & Locomotion Presets */}
          <ServoAndActionPanel />

          {/* Speech, TTS & Audio Stream */}
          <SpeechAndAudioPanel />
        </div>

        {/* 5. Custom Drag & Drop Action Sequencer */}
        <div id="choreograaf" className="scroll-mt-24">
          <ActionSequencerPanel />
        </div>

        {/* 6. Information & Quick Actions Section (Matching HvA styleguide image 3) */}
        <section id="informatie" className="flex flex-col gap-6 pt-4 pb-12 scroll-mt-24">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left Column: Directe Acties */}
            <div className="flex flex-col gap-4">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Directe acties
              </h2>

              <div className="flex flex-col gap-3">
                <button
                  onClick={triggerStandUp}
                  className="w-full p-4 rounded-xl bg-[#22167A] hover:bg-[#1E1647] border border-white/10 flex items-center justify-between text-left transition-all group shadow-md"
                >
                  <span className="hva-arrow-link group-hover:text-white">
                    <ArrowRight className="w-5 h-5 text-white shrink-0" />
                    <span>Rechtop staan &amp; balans herstellen</span>
                  </span>
                  <span className="text-xs font-bold text-white/60">Reset houding</span>
                </button>

                <button
                  onClick={triggerSit}
                  className="w-full p-4 rounded-xl bg-[#22167A] hover:bg-[#1E1647] border border-white/10 flex items-center justify-between text-left transition-all group shadow-md"
                >
                  <span className="hva-arrow-link group-hover:text-white">
                    <ArrowRight className="w-5 h-5 text-white shrink-0" />
                    <span>Gaan zitten / Ruststand</span>
                  </span>
                  <span className="text-xs font-bold text-white/60">Bespaar accu</span>
                </button>

                <button
                  onClick={triggerEmergencyStop}
                  className="w-full p-4 rounded-xl bg-[#22167A] hover:bg-[#1E1647] border border-white/10 flex items-center justify-between text-left transition-all group shadow-md"
                >
                  <span className="hva-arrow-link group-hover:text-white">
                    <ArrowRight className="w-5 h-5 text-white shrink-0" />
                    <span>Noodstop &amp; motoren uitschakelen</span>
                  </span>
                  <span className="text-xs font-bold text-[#E15E7A]">Veiligheid</span>
                </button>
              </div>
            </div>

            {/* Right Column: Handleiding & Hulp (Built-in Interactive Guide) */}
            <div className="flex flex-col gap-4">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Handleiding &amp; Hulp
              </h2>

              <div className="flex flex-col gap-3">
                {/* Built-in Gebruikershandleiding Trigger */}
                <button
                  onClick={() => setShowManual(true)}
                  className="w-full p-5 rounded-2xl bg-[#E15E7A] hover:bg-[#D04E6A] flex items-center justify-between text-left transition-all group shadow-xl active:scale-[0.99]"
                >
                  <span className="hva-arrow-link text-white text-base">
                    <ArrowRight className="w-5 h-5 text-white shrink-0 group-hover:translate-x-1 transition-transform" />
                    <span className="font-extrabold">Nederlandse Gebruikershandleiding</span>
                  </span>
                  <span className="text-xs font-black bg-white/25 px-3 py-1.5 rounded-lg text-white">
                    Open Handleiding
                  </span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Built-in Interactive Gebruikershandleiding Modal */}
        <GebruikershandleidingModal
          isOpen={showManual}
          onClose={() => setShowManual(false)}
        />

        {/* Footer */}
        <footer className="border-t border-white/15 pt-6 pb-8 flex flex-wrap items-center justify-between gap-4 text-xs text-white/70">
          <div>
            &copy; {new Date().getFullYear()} Hogeschool van Amsterdam &bull; Creating Tomorrow
          </div>
          <div className="flex items-center gap-4">
            <span>HvA Robot Maatje Platform</span>
            <span>&bull;</span>
            <span className="text-[#00D26A] font-bold">Lokaal Actief</span>
          </div>
        </footer>
      </div>
    </main>
  );
}
