'use client';

import React, { useState } from 'react';
import { Smile, Lightbulb, CheckCircle2 } from 'lucide-react';
import { EmotionType } from '@/types/robot';
import { STRINGS } from '@/config/strings';
import { THEME } from '@/config/theme';

const EMOTIONS: Array<{ key: EmotionType; label: string; iconText: string }> = [
  { key: 'happy', label: STRINGS.expression.emotions.happy, iconText: '😊' },
  { key: 'curious', label: STRINGS.expression.emotions.curious, iconText: '🧐' },
  { key: 'surprised', label: STRINGS.expression.emotions.surprised, iconText: '😮' },
  { key: 'sleepy', label: STRINGS.expression.emotions.sleepy, iconText: '😴' },
  { key: 'angry', label: STRINGS.expression.emotions.angry, iconText: '😠' },
  { key: 'wink', label: STRINGS.expression.emotions.wink, iconText: '😉' },
  { key: 'boot', label: STRINGS.expression.emotions.boot, iconText: '🚀' },
  { key: 'tap_head', label: STRINGS.expression.emotions.tap_head, iconText: '👋' },
  { key: 'photograph', label: STRINGS.expression.emotions.photograph, iconText: '📸' },
];

interface MouthOption {
  label: string;
  color: number;
  mode: number;
  bgClass: string;
}

const MOUTH_OPTIONS: MouthOption[] = [
  { label: '🟢 Groen Ademen', color: 2, mode: 1, bgClass: 'hover:border-[#00D26A]' },
  { label: '🟢 Groen Continu', color: 2, mode: 0, bgClass: 'hover:border-[#00D26A]' },
  { label: '🔴 Rood Ademen', color: 1, mode: 1, bgClass: 'hover:border-[#FF3E83]' },
  { label: '🔴 Rood Continu', color: 1, mode: 0, bgClass: 'hover:border-[#FF3E83]' },
  { label: '⚪ Wit Ademen', color: 4, mode: 1, bgClass: 'hover:border-slate-300' },
  { label: '⚪ Wit Continu', color: 4, mode: 0, bgClass: 'hover:border-slate-300' },
];

export const EyeExpressionMatrix: React.FC = () => {
  const [activeEmotion, setActiveEmotion] = useState<EmotionType>('happy');
  const [mouthLed, setMouthLed] = useState(false);
  const [activeMouthPreset, setActiveMouthPreset] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleSelectEmotion = async (emotion: EmotionType) => {
    setActiveEmotion(emotion);
    setIsUpdating(true);
    setStatusMessage(`Triggering ${emotion} expression...`);
    try {
      const res = await fetch('/api/robot/expression', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'emotion', emotion }),
      });
      const data = await res.json();
      if (data.success) {
        setStatusMessage(`Emotion ${emotion} rendered`);
      } else {
        setStatusMessage(`Failed: ${data.error}`);
      }
    } catch (err: unknown) {
      setStatusMessage(`Error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleMouthPreset = async (option: MouthOption) => {
    setActiveMouthPreset(option.label);
    setMouthLed(true);
    setStatusMessage(`Setting mouth LED: ${option.label}...`);
    try {
      const res = await fetch('/api/robot/expression', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'mouth_lamp',
          enable: true,
          color: option.color,
          mode: option.mode,
          duration: option.mode === 0 ? 5000 : 10000,
          breathDuration: 1200,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setStatusMessage(`Mouth lamp active: ${option.label}`);
      }
    } catch (err: unknown) {
      setStatusMessage(`Error: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const turnOffMouth = async () => {
    setMouthLed(false);
    setActiveMouthPreset(null);
    try {
      await fetch('/api/robot/expression', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'mouth_lamp',
          enable: false,
        }),
      });
      setStatusMessage('Mouth LED off');
    } catch (err: unknown) {
      setStatusMessage(`Error: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  return (
    <div
      className={`rounded-xl p-5 flex flex-col gap-5 ${THEME.borders.panel}`}
      style={{ backgroundColor: THEME.colors.surface }}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#1A2952] pb-3">
        <div className="flex items-center gap-2">
          <Smile className="w-5 h-5 text-[#00D26A]" />
          <h2 className="text-sm font-mono font-bold tracking-wider text-white">
            {STRINGS.expression.title}
          </h2>
        </div>

        {/* Global Turn Off Mouth Lamp */}
        {mouthLed ? (
          <button
            onClick={turnOffMouth}
            className="px-3 py-1.5 rounded-lg font-mono font-bold text-xs flex items-center gap-1.5 transition-all border bg-[#FF3E83]/20 border-[#FF3E83] text-[#FFA8C8]"
          >
            <Lightbulb className="w-3.5 h-3.5 text-[#FF3E83] animate-pulse" />
            Lamp Uitzetten
          </button>
        ) : (
          <span className="text-xs font-mono text-slate-500 flex items-center gap-1">
            <Lightbulb className="w-3.5 h-3.5 text-slate-600" />
            Lamp Uit
          </span>
        )}
      </div>

      {/* Dual Eye LCD Graphic Simulation in HvA Colors */}
      <div className="flex items-center justify-center gap-6 py-4 px-6 rounded-lg bg-black border border-[#1A2952]">
        <div className="w-24 h-24 rounded-full border-2 border-[#25167A] bg-[#040A18] flex items-center justify-center transition-all duration-300 shadow-lg shadow-[#25167A]/30">
          <div className="w-16 h-16 rounded-full bg-[#25167A]/30 border border-[#3E2BAA] flex items-center justify-center animate-pulse">
            <div className="w-8 h-8 rounded-full bg-[#00D26A] shadow-lg shadow-[#00D26A]/50" />
          </div>
        </div>

        <div className="w-24 h-24 rounded-full border-2 border-[#25167A] bg-[#040A18] flex items-center justify-center transition-all duration-300 shadow-lg shadow-[#25167A]/30">
          <div className="w-16 h-16 rounded-full bg-[#25167A]/30 border border-[#3E2BAA] flex items-center justify-center animate-pulse">
            <div className="w-8 h-8 rounded-full bg-[#00D26A] shadow-lg shadow-[#00D26A]/50" />
          </div>
        </div>
      </div>

      {/* Emotion Buttons Matrix */}
      <div>
        <div className="text-xs font-mono font-semibold text-slate-400 mb-2.5 flex items-center justify-between">
          <span>{STRINGS.expression.selectEmotion}</span>
          {statusMessage && (
            <span className="text-[11px] text-[#00D26A] flex items-center gap-1 font-mono">
              <CheckCircle2 className="w-3 h-3" />
              {statusMessage}
            </span>
          )}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {EMOTIONS.map((e) => {
            const isCurrent = activeEmotion === e.key;
            return (
              <button
                key={e.key}
                onClick={() => handleSelectEmotion(e.key)}
                disabled={isUpdating}
                className={`p-2.5 rounded-lg text-left font-mono text-xs border transition-all duration-200 flex items-center gap-2.5 ${
                  isCurrent
                    ? 'bg-[#25167A] border-[#3E2BAA] text-white shadow-md shadow-[#25167A]/30 font-bold'
                    : 'bg-[#040A18]/70 border-[#1A2952] text-slate-300 hover:border-[#25167A] hover:text-white'
                }`}
              >
                <span className="text-base">{e.iconText}</span>
                <span className="truncate">{e.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Mouth LED Lamp Buttons */}
      <div className="border-t border-[#1A2952] pt-3 flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs font-mono font-semibold text-slate-400">
          <span className="flex items-center gap-1.5">
            <Lightbulb className="w-3.5 h-3.5 text-[#00D26A]" />
            <span>MOND LED KLEUR & ADEM MODUS</span>
          </span>
          {mouthLed && (
            <button
              onClick={turnOffMouth}
              className="px-2 py-0.5 rounded bg-[#FF3E83]/20 border border-[#FF3E83]/60 text-[#FFA8C8] hover:text-white font-mono text-[10px]"
            >
              Lamp Uitzetten
            </button>
          )}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {MOUTH_OPTIONS.map((opt) => {
            const isSelected = activeMouthPreset === opt.label && mouthLed;
            return (
              <button
                key={opt.label}
                onClick={() => handleMouthPreset(opt)}
                className={`py-1.5 px-2.5 rounded-lg text-xs font-mono border transition-all text-left flex items-center justify-between ${
                  isSelected
                    ? 'bg-[#25167A] border-[#3E2BAA] text-white shadow-sm font-semibold'
                    : `bg-[#040A18]/70 border-[#1A2952] text-slate-300 ${opt.bgClass} hover:text-white`
                }`}
              >
                <span>{opt.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
