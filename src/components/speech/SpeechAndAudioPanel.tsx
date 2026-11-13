'use client';

import React, { useState } from 'react';
import { Volume2, VolumeX, Mic, Send, Music, Sparkles, CheckCircle2 } from 'lucide-react';
import { STRINGS } from '@/config/strings';
import { THEME } from '@/config/theme';

const ROBOT_SOUND_EFFECTS = [
  { name: 'Countdown (3, 2, 1)', file: 'photograph_001.mp3' },
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
      const res = await fetch('/api/robot/speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'sound', file: soundFile }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setStatusMessage(`Geluidseffect speelt af: ${soundFile}`);
      } else {
        setStatusMessage(`Fout bij afspelen geluidseffect: ${data.error || 'Mislukt'}`);
      }
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
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <Mic className="w-5 h-5 text-[#00D26A]" />
          <h2 className="text-sm font-bold tracking-wider text-white">
            SPRAAK &amp; LUIDSPREKER
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as any)}
            aria-label={STRINGS.speech.languageSelect}
            className="bg-[#1E1647] border border-white/20 text-xs text-white font-bold rounded px-2.5 py-1 outline-none focus:border-[#E15E7A]"
          >
            <option value="nl-NL">🇳🇱 Nederlands</option>
            <option value="en-US">🇬🇧 English</option>
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
            className="flex-1 px-4 py-2.5 rounded-lg bg-[#1E1647] border border-white/10 text-sm font-sans text-white placeholder-white/40 focus:outline-none focus:border-[#E15E7A] transition-colors"
          />
          {/* HvA Coral Pink Send Button */}
          <button
            onClick={() => handleSpeak()}
            disabled={isSpeaking || !text.trim()}
            className="px-5 py-2.5 rounded-lg font-bold text-xs flex items-center gap-2 transition-all bg-[#E15E7A] hover:bg-[#D04E6A] text-white disabled:opacity-50 disabled:cursor-not-allowed shadow-md active:scale-95"
          >
            <Send className="w-4 h-4 text-white" />
            <span>{isSpeaking ? 'SPREEKT...' : 'SPREEK UIT'}</span>
          </button>
        </div>
        {statusMessage && (
          <div className="text-xs text-[#00D26A] flex items-center gap-1.5 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#00D26A] shrink-0" />
            <span className="truncate">{statusMessage}</span>
          </div>
        )}
      </div>

      {/* Quick Phrases */}
      <div>
        <div className="text-xs font-bold text-white/70 mb-2 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-[#E15E7A]" />
          <span>SNELLE ZINNEN VOOR INTERACTIE</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {STRINGS.speech.quickPhrases.map((phrase, i) => (
            <button
              key={i}
              onClick={() => handleSpeak(phrase)}
              disabled={isSpeaking}
              className="text-xs font-sans px-3 py-1.5 rounded-lg bg-[#1E1647] border border-white/10 text-white/90 hover:text-white hover:border-white/30 transition-colors text-left"
            >
              {phrase}
            </button>
          ))}
        </div>
      </div>

      {/* Built-in Robot Sound Clips */}
      <div>
        <div className="text-xs font-bold text-white/70 mb-2 flex items-center gap-1.5">
          <Music className="w-3.5 h-3.5 text-[#00D26A]" />
          <span>GELUIDSEFFECTEN</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {ROBOT_SOUND_EFFECTS.map((sound) => (
            <button
              key={sound.name}
              onClick={() => handlePlaySoundEffect(sound.file)}
              className="text-xs px-2.5 py-1.5 rounded-lg bg-[#1E1647] border border-white/10 text-white/90 hover:text-white hover:border-white/30 transition-colors text-left truncate"
            >
              🔊 {sound.name}
            </button>
          ))}
        </div>
      </div>

      {/* Robot Speaker Volume Slider */}
      <div className="pt-2 border-t border-white/10 flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-white/70 flex items-center gap-1.5 font-bold">
            {volume > 0 ? <Volume2 className="w-4 h-4 text-[#00D26A]" /> : <VolumeX className="w-4 h-4 text-white/40" />}
            <span>VOLUME LUIDSPREKER</span>
          </span>
          <span className="font-extrabold text-[#00D26A]">{volume}%</span>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          value={volume}
          onChange={(e) => setVolume(parseInt(e.target.value, 10))}
          onPointerUp={(e) => handleVolumeCommit(parseInt((e.target as HTMLInputElement).value, 10))}
          onKeyUp={(e) => handleVolumeCommit(parseInt((e.target as HTMLInputElement).value, 10))}
          className="w-full accent-[#E15E7A] h-2 bg-[#1E1647] rounded-lg cursor-pointer"
        />
      </div>
    </div>
  );
};
