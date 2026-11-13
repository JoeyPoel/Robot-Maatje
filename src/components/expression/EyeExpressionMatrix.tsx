'use client';

import React, { useState } from 'react';
import { Smile, Lightbulb, CheckCircle2 } from 'lucide-react';
import { EmotionType } from '@/types/robot';
import { STRINGS } from '@/config/strings';
import { THEME } from '@/config/theme';

const EMOTIONS: Array<{ key: EmotionType; label: string; iconText: string }> = [
  { key: 'happy', label: STRINGS.expression.emotions.happy, iconText: '😊' },
  { key: 'heart', label: STRINGS.expression.emotions.heart, iconText: '😍' },
  { key: 'wink', label: STRINGS.expression.emotions.wink, iconText: '😉' },
  { key: 'curious', label: STRINGS.expression.emotions.curious, iconText: '🧐' },
  { key: 'surprised', label: STRINGS.expression.emotions.surprised, iconText: '😮' },
  { key: 'sleepy', label: STRINGS.expression.emotions.sleepy, iconText: '😴' },
  { key: 'angry', label: STRINGS.expression.emotions.angry, iconText: '😠' },
  { key: 'boot', label: STRINGS.expression.emotions.boot, iconText: '🚀' },
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
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <Smile className="w-5 h-5 text-[#00D26A]" />
          <h2 className="text-sm font-bold tracking-wider text-white">
            OOGEXPRESSIES &amp; EMOTIES
          </h2>
        </div>

        {/* Global Turn Off Mouth Lamp */}
        {mouthLed ? (
          <button
            onClick={turnOffMouth}
            className="px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all bg-[#E15E7A] text-white"
          >
            <Lightbulb className="w-3.5 h-3.5 animate-pulse" />
            Lamp Uitzetten
          </button>
        ) : (
          <span className="text-xs text-white/50 flex items-center gap-1">
            <Lightbulb className="w-3.5 h-3.5 text-white/40" />
            Lamp Uit
          </span>
        )}
      </div>



      {/* Emotion Buttons Matrix */}
      <div>
        <div className="text-xs font-bold text-white/70 mb-2.5 flex items-center justify-between">
          <span>KIES EEN EMOTIE</span>
          {statusMessage && (
            <span className="text-[11px] text-[#00D26A] flex items-center gap-1">
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
                className={`p-2.5 rounded-lg text-left text-xs border transition-all duration-150 flex items-center gap-2.5 ${
                  isCurrent
                    ? 'bg-[#E15E7A] border-[#E15E7A] text-white shadow-md font-extrabold'
                    : 'bg-[#1E1647] border-white/10 text-white/90 hover:border-white/30 hover:text-white'
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
      <div className="border-t border-white/10 pt-3 flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs font-bold text-white/70">
          <span className="flex items-center gap-1.5">
            <Lightbulb className="w-3.5 h-3.5 text-[#00D26A]" />
            <span>MOND LED KLEUR</span>
          </span>
          {mouthLed && (
            <button
              onClick={turnOffMouth}
              className="px-2 py-0.5 rounded bg-[#E15E7A] text-white text-[10px] font-bold"
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
                className={`py-1.5 px-2.5 rounded-lg text-xs border transition-all text-left flex items-center justify-between ${
                  isSelected
                    ? 'bg-[#00D26A] text-slate-950 border-[#00D26A] font-bold shadow-sm'
                    : `bg-[#1E1647] border-white/10 text-white/80 hover:border-white/30 hover:text-white`
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
