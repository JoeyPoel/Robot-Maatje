'use client';

import React, { useState } from 'react';
import { Volume2, VolumeX, Mic, Send, Music, Sparkles, CheckCircle2 } from 'lucide-react';
import { STRINGS } from '@/config/strings';
import { THEME } from '@/config/theme';

const ROBOT_SOUND_EFFECTS = [
  { name: 'Countdown (3, 2, 1)', file: '003_photograph_v' },
  { name: 'Happy Melody', file: 'BCM_happy.mp3' },
  { name: 'Surprise Chime', file: 'BCM_surprise.mp3' },
  { name: 'Car Horn', file: 'horn.mp3' },
  { name: 'Police Siren', file: 'police_car.mp3' },
  { name: 'Dance Song', file: 'dance_0001en.mp3' },
];

export const SpeechAndAudioPanel: React.FC = () => {
  const [text, setText] = useState('');
  const [language, setLanguage] = useState<'nl-NL' | 'en-US'>('nl-NL');
  const [volume, setVolume] = useState(75);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleSpeak = async (phraseToSpeak?: string) => {
    const toSpeak = (phraseToSpeak ?? text).trim();
    if (!toSpeak) return;

    setIsSpeaking(true);
    setStatusMessage(`Versturen naar robot luidspreker: "${toSpeak}"...`);

    try {
      const res = await fetch('/api/robot/speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'speak', text: toSpeak, language }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setStatusMessage(`Robot spreekt live uit fysieke luidspreker: "${toSpeak}"`);
        if (!phraseToSpeak) setText('');
      } else {
        setStatusMessage(`Speech error: ${data.error || 'Failed'}`);
      }
    } catch (err: unknown) {
      setStatusMessage(`Error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsSpeaking(false);
    }
  };

  const handlePlaySoundEffect = async (soundFile: string) => {
    setStatusMessage(`Afspelen geluidseffect: ${soundFile}...`);
    try {
      if (soundFile.includes('photograph') || soundFile.includes('dance')) {
        await fetch('/api/robot/motion', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'preset', action: soundFile.includes('dance') ? 'dance_0001en' : 'w_head_001' }),
        });
      }
      setStatusMessage(`Geluidseffect gestart: ${soundFile}`);
    } catch (err: unknown) {
      setStatusMessage(`Error: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const handleVolumeCommit = async (newVol: number) => {
    try {
      await fetch('/api/robot/speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'volume', level: newVol }),
      });
      setStatusMessage(`Volume aangepast naar ${newVol}%`);
    } catch {
      // Squelch
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
          <Mic className="w-5 h-5 text-[#00D26A]" />
          <h2 className="text-sm font-mono font-bold tracking-wider text-white">
            SPRAAKSYNTHESE & LUIDSPREKER
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as any)}
            aria-label={STRINGS.speech.languageSelect}
            className="bg-[#040A18] border border-[#1A2952] text-xs font-mono text-[#00D26A] rounded px-2.5 py-1 outline-none focus:border-[#00D26A]"
          >
            <option value="nl-NL">{STRINGS.speech.langNL}</option>
            <option value="en-US">{STRINGS.speech.langEN}</option>
          </select>
        </div>
      </div>

      {/* Text-to-Speech Input Box */}
      <div className="flex flex-col gap-2">
        <div className="flex gap-2">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSpeak()}
            placeholder="Typ een zin voor Robot Maatje om uit te spreken..."
            className="flex-1 px-4 py-2.5 rounded-lg bg-[#040A18] border border-[#1A2952] text-sm font-sans text-white placeholder-slate-500 focus:outline-none focus:border-[#00D26A] font-normal transition-colors"
          />
          {/* HvA Paars Send Button */}
          <button
            onClick={() => handleSpeak()}
            disabled={isSpeaking || !text.trim()}
            className="px-5 py-2.5 rounded-lg font-mono font-bold text-xs flex items-center gap-2 transition-all bg-[#25167A] hover:bg-[#2C18A0] text-white border border-[#3E2BAA] disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-[#25167A]/25 active:scale-95"
          >
            <Send className="w-4 h-4 text-[#00D26A]" />
            <span>{isSpeaking ? 'SPREEKT...' : 'SPREEK UIT'}</span>
          </button>
        </div>
        {statusMessage && (
          <div className="text-xs font-mono text-[#00D26A] flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#00D26A] shrink-0" />
            <span className="truncate">{statusMessage}</span>
          </div>
        )}
      </div>

      {/* Quick Phrases */}
      <div>
        <div className="text-xs font-mono font-semibold text-slate-400 mb-2 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-[#00D26A]" />
          <span>SNELLE ZINNEN VOOR INTERACTIE</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {STRINGS.speech.quickPhrases.map((phrase, i) => (
            <button
              key={i}
              onClick={() => handleSpeak(phrase)}
              disabled={isSpeaking}
              className="text-xs font-sans px-3 py-1.5 rounded-lg bg-[#040A18]/70 border border-[#1A2952] text-slate-300 hover:text-white hover:border-[#00D26A]/50 transition-colors text-left"
            >
              {phrase}
            </button>
          ))}
        </div>
      </div>

      {/* Built-in Robot Sound Clips */}
      <div>
        <div className="text-xs font-mono font-semibold text-slate-400 mb-2 flex items-center gap-1.5">
          <Music className="w-3.5 h-3.5 text-[#00D26A]" />
          <span>ROBOT GELUIDSEFFECTEN</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {ROBOT_SOUND_EFFECTS.map((sound) => (
            <button
              key={sound.name}
              onClick={() => handlePlaySoundEffect(sound.file)}
              className="text-xs font-mono px-2.5 py-1.5 rounded-lg bg-[#040A18]/70 border border-[#1A2952] text-slate-300 hover:text-white hover:border-[#25167A] hover:bg-[#25167A]/30 transition-colors text-left truncate"
            >
              🔊 {sound.name}
            </button>
          ))}
        </div>
      </div>

      {/* Robot Speaker Volume Slider */}
      <div className="pt-2 border-t border-[#1A2952] flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="text-slate-400 flex items-center gap-1.5">
            {volume > 0 ? <Volume2 className="w-4 h-4 text-[#00D26A]" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
            <span>ROBOT MASTER VOLUME</span>
          </span>
          <span className="font-bold text-[#00D26A]">{volume}%</span>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          value={volume}
          onChange={(e) => setVolume(parseInt(e.target.value, 10))}
          onPointerUp={(e) => handleVolumeCommit(parseInt((e.target as HTMLInputElement).value, 10))}
          onKeyUp={(e) => handleVolumeCommit(parseInt((e.target as HTMLInputElement).value, 10))}
          className="w-full accent-[#00D26A] h-1.5 bg-[#040A18] rounded-lg cursor-pointer"
        />
      </div>
    </div>
  );
};
