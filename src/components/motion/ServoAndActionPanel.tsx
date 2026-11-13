'use client';

import React, { useState } from 'react';
import { Play, OctagonAlert, Move, CheckCircle2, ShieldCheck, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Activity, Smile, Footprints } from 'lucide-react';
import { PresetActionName } from '@/types/robot';
import { STRINGS } from '@/config/strings';
import { THEME } from '@/config/theme';

interface ActionItem {
  key: PresetActionName;
  label: string;
  icon: string;
  badge?: string;
}

const HEAD_GESTURES: ActionItem[] = [
  { key: 'nod', label: 'Nod Head Yes', icon: '🙆' },
  { key: 'shake_head', label: 'Shake Head No', icon: '🙅' },
  { key: 'tilt_head', label: 'Tilt Head Puzzled', icon: '🧐' },
  { key: 'w_head_001', label: 'Nod & Smile', icon: '🙂' },
];

const UPPER_BODY_GESTURES: ActionItem[] = [
  { key: 'say_hello_avatar', label: 'Wave Greeting', icon: '👋' },
  { key: 'handshake_avatar', label: 'Offer Handshake', icon: '🤝' },
  { key: 'bow', label: 'Polite Bow', icon: '🙇' },
  { key: 'act_cute_avatar', label: 'Act Cute Pose', icon: '🥰' },
  { key: 'hug_avatar', label: 'Warm Hug', icon: '🤗' },
  { key: 'air_kiss_avatar', label: 'Air Kiss', icon: '😘' },
  { key: 'pushups', label: 'Push-Up Workout', icon: '💪' },
  { key: 'speakingAct1', label: 'Speech Gestures', icon: '🗣️' },
];

const DUTCH_MAATJE_ROUTINES: ActionItem[] = [
  { key: 'klappen', label: 'Klappen in Handen', icon: '👏', badge: 'Dutch' },
  { key: 'fysio1', label: 'Fysio Oefening 1', icon: '🧘', badge: 'Care' },
  { key: 'fysio2', label: 'Fysio Oefening 2', icon: '🤸', badge: 'Care' },
  { key: 'zitten', label: 'Gaan Zitten / Rust', icon: '🧎', badge: 'Posture' },
  { key: 'scheet', label: 'Grapje / Scheet', icon: '💨', badge: 'Humor' },
  { key: 'dance_0001en', label: 'Muziek & Dans', icon: '💃', badge: 'Music' },
];

export const ServoAndActionPanel: React.FC = () => {
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [walkSteps, setWalkSteps] = useState<number>(1);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isStopping, setIsStopping] = useState(false);

  const triggerPreset = async (action: PresetActionName) => {
    setActiveAction(action);
    setStatusMessage(`Running ${action}...`);
    try {
      const res = await fetch('/api/robot/motion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'preset', action }),
      });
      const data = await res.json();
      if (data.success) {
        setStatusMessage(`Executed ${action} successfully`);
      } else {
        setStatusMessage(`Failed: ${data.error}`);
      }
    } catch (err: unknown) {
      setStatusMessage(`Error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setActiveAction(null);
    }
  };

  const triggerWalk = async (direction: 'forward' | 'backward' | 'left' | 'right') => {
    const dirLabels = { forward: 'Forward', backward: 'Backward', left: 'Turn Left', right: 'Turn Right' };
    setActiveAction(`walk_${direction}`);
    setStatusMessage(`Walking ${dirLabels[direction]} (${walkSteps} step${walkSteps > 1 ? 's' : ''})...`);
    try {
      const res = await fetch('http://localhost:8088/api/command', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer alpha_mini_secret_token_123',
        },
        body: JSON.stringify({
          category: 'MOTION',
          action: 'walk',
          params: { direction, steps: walkSteps },
        }),
      });
      const data = await res.json();
      if (data.success) {
        setStatusMessage(`Walk ${direction} complete`);
      } else {
        setStatusMessage(`Walk failed: ${data.error}`);
      }
    } catch (err: unknown) {
      setStatusMessage(`Error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setActiveAction(null);
    }
  };

  const triggerCancelAll = async () => {
    setIsStopping(true);
    setStatusMessage('Stopping motors & recovering balance...');
    try {
      await fetch('/api/robot/motion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'stop' }),
      });
      setStatusMessage('Motors stopped & balance locked');
    } catch (err: unknown) {
      setStatusMessage(`Error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsStopping(false);
    }
  };

  return (
    <div
      className={`rounded-xl p-5 flex flex-col gap-5 ${THEME.borders.panel}`}
      style={{ backgroundColor: THEME.colors.surface }}
    >
      {/* Panel Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <Move className="w-5 h-5 text-[#00D26A]" />
          <h2 className="text-sm font-bold tracking-wider text-white">
            BEWEGINGEN &amp; GEBAREN
          </h2>
        </div>

        {/* Emergency Stop & Balance Lock */}
        <button
          onClick={triggerCancelAll}
          disabled={isStopping}
          className="px-3.5 py-1.5 rounded-lg bg-[#E15E7A] hover:bg-[#D04E6A] text-white flex items-center gap-1.5 text-xs font-bold shadow-md transition-all active:scale-95 disabled:opacity-50"
        >
          <OctagonAlert className={`w-3.5 h-3.5 ${isStopping ? 'animate-spin' : ''}`} />
          {isStopping ? 'HERSTELLEN...' : 'BALANS HERSTEL'}
        </button>
      </div>

      {statusMessage && (
        <div className="px-3 py-1.5 rounded-lg bg-[#1E1647] border border-white/10 text-xs text-[#00D26A] flex items-center gap-2">
          <CheckCircle2 className="w-3.5 h-3.5 text-[#00D26A] shrink-0" />
          <span className="truncate">{statusMessage}</span>
        </div>
      )}

      {/* Real Hardware Locomotion D-Pad (Command 2) */}
      <div className="p-3.5 rounded-xl bg-[#1E1647] border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex flex-col gap-1.5 text-left">
          <div className="text-xs font-bold text-white flex items-center gap-1.5">
            <Footprints className="w-4 h-4 text-[#00D26A]" />
            <span>LOPEN &amp; DRAAIEN</span>
          </div>
          <p className="text-xs text-white/70">
            Laat Maatje voorwaarts lopen of draaien.
          </p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-white/70">Stappen:</span>
            {[1, 2, 3].map((num) => (
              <button
                key={num}
                onClick={() => setWalkSteps(num)}
                className={`px-2.5 py-0.5 rounded text-xs border transition-all ${
                  walkSteps === num
                    ? 'bg-[#00D26A] text-slate-950 font-bold border-[#00D26A]'
                    : 'bg-[#22167A] border-white/15 text-white/80 hover:text-white'
                }`}
              >
                {num} {num === 1 ? 'stap' : 'stappen'}
              </button>
            ))}
          </div>
        </div>

        {/* D-Pad Buttons */}
        <div className="grid grid-cols-3 gap-1.5 w-36 h-28 shrink-0">
          <div />
          <button
            onClick={() => triggerWalk('forward')}
            disabled={activeAction !== null}
            className="rounded bg-[#040A18] hover:bg-[#00D26A] hover:text-slate-950 border border-[#1A2952] text-[#00D26A] flex items-center justify-center transition-all disabled:opacity-40"
            title="Step Forward"
          >
            <ArrowUp className="w-5 h-5" />
          </button>
          <div />
          <button
            onClick={() => triggerWalk('left')}
            disabled={activeAction !== null}
            className="rounded bg-[#040A18] hover:bg-[#00D26A] hover:text-slate-950 border border-[#1A2952] text-[#00D26A] flex items-center justify-center transition-all disabled:opacity-40"
            title="Turn Left"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => triggerPreset('stand_up')}
            disabled={activeAction !== null}
            className="rounded bg-[#25167A] hover:bg-[#2C18A0] text-white border border-[#3E2BAA] font-mono text-[10px] font-bold flex items-center justify-center transition-all disabled:opacity-40 shadow-sm"
            title="Center Balance Pose"
          >
            CENTER
          </button>
          <button
            onClick={() => triggerWalk('right')}
            disabled={activeAction !== null}
            className="rounded bg-[#040A18] hover:bg-[#00D26A] hover:text-slate-950 border border-[#1A2952] text-[#00D26A] flex items-center justify-center transition-all disabled:opacity-40"
            title="Turn Right"
          >
            <ArrowRight className="w-5 h-5" />
          </button>
          <div />
          <button
            onClick={() => triggerWalk('backward')}
            disabled={activeAction !== null}
            className="rounded bg-[#040A18] hover:bg-[#00D26A] hover:text-slate-950 border border-[#1A2952] text-[#00D26A] flex items-center justify-center transition-all disabled:opacity-40"
            title="Step Backward"
          >
            <ArrowDown className="w-5 h-5" />
          </button>
          <div />
        </div>
      </div>

      {/* Head & Neck Expressive Controls */}
      <div>
        <div className="text-xs font-bold text-white/70 mb-2 flex items-center gap-1.5">
          <Smile className="w-3.5 h-3.5 text-[#00D26A]" />
          <span>HOOFD- &amp; NEKGEBAREN</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {HEAD_GESTURES.map((p) => {
            const isRunning = activeAction === p.key;
            return (
              <button
                key={p.key}
                onClick={() => triggerPreset(p.key)}
                disabled={activeAction !== null}
                className={`p-2 rounded-lg text-left text-xs border transition-all duration-150 flex items-center justify-between group ${
                  isRunning
                    ? 'bg-[#E15E7A] border-[#E15E7A] text-white font-bold shadow-md'
                    : 'bg-[#1E1647] border-white/10 text-white/90 hover:border-white/30 hover:text-white'
                }`}
              >
                <span className="truncate flex items-center gap-1.5">
                  <span>{p.icon}</span>
                  <span className="truncate">{p.label}</span>
                </span>
                <Play className={`w-3 h-3 text-[#00D26A] transition-transform ${isRunning ? 'animate-spin' : 'group-hover:translate-x-0.5'}`} />
              </button>
            );
          })}
        </div>
      </div>

      {/* Upper Body & Arms Gestures (Zero Fall Hazard) */}
      <div>
        <div className="text-xs font-bold text-white/70 mb-2 flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-[#00D26A]" />
          <span>ARMEN &amp; BOVENLICHAAM</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {UPPER_BODY_GESTURES.map((p) => {
            const isRunning = activeAction === p.key;
            return (
              <button
                key={p.key}
                onClick={() => triggerPreset(p.key)}
                disabled={activeAction !== null}
                className={`p-2 rounded-lg text-left text-xs border transition-all duration-150 flex items-center justify-between group ${
                  isRunning
                    ? 'bg-[#E15E7A] border-[#E15E7A] text-white font-bold shadow-md'
                    : 'bg-[#1E1647] border-white/10 text-white/90 hover:border-white/30 hover:text-white'
                }`}
              >
                <span className="truncate flex items-center gap-1.5">
                  <span>{p.icon}</span>
                  <span className="truncate">{p.label}</span>
                </span>
                <Play className={`w-3 h-3 text-[#00D26A] transition-transform ${isRunning ? 'animate-spin' : 'group-hover:translate-x-0.5'}`} />
              </button>
            );
          })}
        </div>
      </div>

      {/* Dutch Maatje Care & Interaction Routines */}
      <div>
        <div className="text-xs font-bold text-white/70 mb-2 flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5 text-[#E15E7A]" />
          <span>ZORG- &amp; ACTIVITEITEN ROUTINES</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {DUTCH_MAATJE_ROUTINES.map((p) => {
            const isRunning = activeAction === p.key;
            return (
              <button
                key={p.key}
                onClick={() => triggerPreset(p.key)}
                disabled={activeAction !== null}
                className={`p-2.5 rounded-lg text-left text-xs border transition-all duration-150 flex items-center justify-between group ${
                  isRunning
                    ? 'bg-[#E15E7A] border-[#E15E7A] text-white font-bold shadow-md'
                    : 'bg-[#1E1647] border-white/10 text-white/90 hover:border-white/30 hover:text-white'
                }`}
              >
                <span className="truncate flex items-center gap-2">
                  <span className="text-base">{p.icon}</span>
                  <span className="truncate font-semibold">{p.label}</span>
                </span>
                <Play className={`w-3 h-3 text-[#00D26A] transition-transform ${isRunning ? 'animate-spin' : 'group-hover:translate-x-0.5'}`} />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
