'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Play,
  Square,
  RotateCcw,
  Plus,
  Trash2,
  GripVertical,
  ArrowUp,
  ArrowDown,
  Volume2,
  Smile,
  Footprints,
  Clock,
  Sparkles,
  CheckCircle2,
  Copy,
  FolderOpen,
  Save,
  MessageSquare,
  Activity,
  Layers,
  ChevronRight,
  ListOrdered
} from 'lucide-react';
import { THEME } from '@/config/theme';
import {
  SequenceStep,
  StepType,
  MotionParams,
  GestureParams,
  SpeakParams,
  ExpressionParams,
  SoundParams,
  PauseParams,
  PresetRoutine
} from '@/types/sequence';
import { PresetActionName, EmotionType } from '@/types/robot';

/**
 * Palette item blueprint available to drag or click-add into the choreography timeline.
 */
interface PaletteItem {
  type: StepType;
  title: string;
  description: string;
  icon: string;
  color: string;
  defaultParams: any;
}

const PALETTE_ITEMS: PaletteItem[] = [
  // 1. Movement & Walking
  {
    type: 'motion',
    title: 'Stap Vooruit',
    description: 'Loop 1 of meer stappen voorwaarts',
    icon: '🚶',
    color: '#00D26A',
    defaultParams: { direction: 'forward', steps: 1 } as MotionParams,
  },
  {
    type: 'motion',
    title: 'Draai Links',
    description: 'Draai lichaam naar links',
    icon: '↩️',
    color: '#00D26A',
    defaultParams: { direction: 'left', steps: 1 } as MotionParams,
  },
  {
    type: 'motion',
    title: 'Draai Rechts',
    description: 'Draai lichaam naar rechts',
    icon: '↪️',
    color: '#00D26A',
    defaultParams: { direction: 'right', steps: 1 } as MotionParams,
  },
  {
    type: 'motion',
    title: 'Stap Achteruit',
    description: 'Loop voorzichtig achterwaarts',
    icon: '🔙',
    color: '#00D26A',
    defaultParams: { direction: 'backward', steps: 1 } as MotionParams,
  },

  // 2. Gestures & Body Language
  {
    type: 'gesture',
    title: 'Zwaaien (Hallo)',
    description: 'Vriendelijk handzwaaien',
    icon: '👋',
    color: '#3B82F6',
    defaultParams: { action: 'say_hello_avatar' } as GestureParams,
  },
  {
    type: 'gesture',
    title: 'Dansen op Muziek',
    description: 'Swingt met armen en benen',
    icon: '💃',
    color: '#3B82F6',
    defaultParams: { action: 'dance_0001en' } as GestureParams,
  },
  {
    type: 'gesture',
    title: 'Klappen in Handen',
    description: 'Applaudisseert enthousiast',
    icon: '👏',
    color: '#3B82F6',
    defaultParams: { action: 'klappen' } as GestureParams,
  },
  {
    type: 'gesture',
    title: 'Beleefde Buiging',
    description: 'Traditionele buiging',
    icon: '🙇',
    color: '#3B82F6',
    defaultParams: { action: 'bow' } as GestureParams,
  },
  {
    type: 'gesture',
    title: 'Fysio Oefening 1',
    description: 'Armen synchroon heffen',
    icon: '🧘',
    color: '#3B82F6',
    defaultParams: { action: 'fysio1' } as GestureParams,
  },
  {
    type: 'gesture',
    title: 'Grappig Scheetje',
    description: 'Bukken met geluidseffect',
    icon: '💨',
    color: '#3B82F6',
    defaultParams: { action: 'scheet' } as GestureParams,
  },

  // 3. Speech & TTS
  {
    type: 'speak',
    title: 'Zeg Tekst (TTS)',
    description: 'Spreekt getypte tekst uit',
    icon: '🗣️',
    color: '#F59E0B',
    defaultParams: { text: 'Hallo allemaal, leuk jullie te zien!', language: 'nl-NL' } as SpeakParams,
  },

  // 4. Expressions & Facial LCD
  {
    type: 'expression',
    title: 'Blije Ogen',
    description: 'Lachende ogen op het scherm',
    icon: '😊',
    color: '#EC4899',
    defaultParams: { emotion: 'happy' } as ExpressionParams,
  },
  {
    type: 'expression',
    title: 'Knipoog',
    description: 'Speelse knipoog animatie',
    icon: '😉',
    color: '#EC4899',
    defaultParams: { emotion: 'wink' } as ExpressionParams,
  },
  {
    type: 'expression',
    title: 'Hartjes Ogen',
    description: 'Liefdevolle hartjes in de ogen',
    icon: '🥰',
    color: '#EC4899',
    defaultParams: { emotion: 'heart' } as ExpressionParams,
  },
  {
    type: 'expression',
    title: 'Verbaasd',
    description: 'Grote verbaasde ogen',
    icon: '😮',
    color: '#EC4899',
    defaultParams: { emotion: 'surprised' } as ExpressionParams,
  },

  // 5. Sound Effects
  {
    type: 'sound',
    title: 'Vrolijk Deuntje',
    description: 'Opwekkende jingle',
    icon: '🎵',
    color: '#8B5CF6',
    defaultParams: { file: 'BCM_happy.mp3', name: 'Happy Melody' } as SoundParams,
  },
  {
    type: 'sound',
    title: 'Toeter (Auto)',
    description: 'Grappige autotoeter',
    icon: '🚗',
    color: '#8B5CF6',
    defaultParams: { file: 'horn.mp3', name: 'Car Horn' } as SoundParams,
  },
  {
    type: 'sound',
    title: 'Aftellen (3, 2, 1)',
    description: 'Stem telt af naar start',
    icon: '⏱️',
    color: '#8B5CF6',
    defaultParams: { file: 'photograph_001.mp3', name: 'Countdown' } as SoundParams,
  },

  // 6. Timed Delay
  {
    type: 'pause',
    title: 'Wacht Pauze',
    description: 'Wacht aantal seconden voor volgende actie',
    icon: '⏳',
    color: '#94A3B8',
    defaultParams: { durationMs: 2000 } as PauseParams,
  },
];

const PRESET_ROUTINES: PresetRoutine[] = [
  {
    id: 'welcome',
    title: '👋 Welkom & Introductie',
    description: 'Knipoog, begroetingszwaai en vriendelijke welkomstboodschap.',
    badge: 'Populair',
    steps: [
      {
        type: 'expression',
        title: 'Blije Ogen',
        description: 'Lachende ogen op het scherm',
        icon: '😊',
        color: '#EC4899',
        params: { emotion: 'happy' } as ExpressionParams,
      },
      {
        type: 'speak',
        title: 'Zeg Tekst (TTS)',
        description: 'Spreekt getypte tekst uit',
        icon: '🗣️',
        color: '#F59E0B',
        params: { text: 'Hallo! Welkom bij de Hogeschool van Amsterdam.', language: 'nl-NL' } as SpeakParams,
      },
      {
        type: 'gesture',
        title: 'Zwaaien (Hallo)',
        description: 'Vriendelijk handzwaaien',
        icon: '👋',
        color: '#3B82F6',
        params: { action: 'say_hello_avatar' } as GestureParams,
      },
      {
        type: 'expression',
        title: 'Knipoog',
        description: 'Speelse knipoog animatie',
        icon: '😉',
        color: '#EC4899',
        params: { emotion: 'wink' } as ExpressionParams,
      },
      {
        type: 'speak',
        title: 'Zeg Tekst (TTS)',
        description: 'Spreekt getypte tekst uit',
        icon: '🗣️',
        color: '#F59E0B',
        params: { text: 'Mijn naam is Maatje. Hoe kan ik je vandaag helpen?', language: 'nl-NL' } as SpeakParams,
      },
    ],
  },
  {
    id: 'party_dance',
    title: '💃 Dans & Feestje',
    description: 'Aftellen, muziek starten, dansen en afsluiten met applaus.',
    badge: 'Muziek',
    steps: [
      {
        type: 'sound',
        title: 'Aftellen (3, 2, 1)',
        description: 'Stem telt af naar start',
        icon: '⏱️',
        color: '#8B5CF6',
        params: { file: 'photograph_001.mp3', name: 'Countdown' } as SoundParams,
      },
      {
        type: 'pause',
        title: 'Wacht Pauze',
        description: 'Wacht 2.5 seconden',
        icon: '⏳',
        color: '#94A3B8',
        params: { durationMs: 2500 } as PauseParams,
      },
      {
        type: 'expression',
        title: 'Hartjes Ogen',
        description: 'Liefdevolle hartjes in de ogen',
        icon: '🥰',
        color: '#EC4899',
        params: { emotion: 'heart' } as ExpressionParams,
      },
      {
        type: 'gesture',
        title: 'Dansen op Muziek',
        description: 'Swingt met armen en benen',
        icon: '💃',
        color: '#3B82F6',
        params: { action: 'dance_0001en' } as GestureParams,
      },
      {
        type: 'gesture',
        title: 'Klappen in Handen',
        description: 'Applaudisseert enthousiast',
        icon: '👏',
        color: '#3B82F6',
        params: { action: 'klappen' } as GestureParams,
      },
      {
        type: 'speak',
        title: 'Zeg Tekst (TTS)',
        description: 'Spreekt getypte tekst uit',
        icon: '🗣️',
        color: '#F59E0B',
        params: { text: 'Dat was een heerlijk dansje! Dankjewel voor het kijken!', language: 'nl-NL' } as SpeakParams,
      },
    ],
  },
  {
    id: 'fysio_session',
    title: '🧘 Fysio & Bewegen',
    description: 'Motiverende beweegles met oefeningen en aanmoedigingen.',
    badge: 'Zorg',
    steps: [
      {
        type: 'speak',
        title: 'Zeg Tekst (TTS)',
        description: 'Spreekt getypte tekst uit',
        icon: '🗣️',
        color: '#F59E0B',
        params: { text: 'Kom op allemaal, we gaan even lekker bewegen!', language: 'nl-NL' } as SpeakParams,
      },
      {
        type: 'gesture',
        title: 'Fysio Oefening 1',
        description: 'Armen synchroon heffen',
        icon: '🧘',
        color: '#3B82F6',
        params: { action: 'fysio1' } as GestureParams,
      },
      {
        type: 'pause',
        title: 'Wacht Pauze',
        description: 'Wacht 1.5s',
        icon: '⏳',
        color: '#94A3B8',
        params: { durationMs: 1500 } as PauseParams,
      },
      {
        type: 'gesture',
        title: 'Klappen in Handen',
        description: 'Applaudisseert enthousiast',
        icon: '👏',
        color: '#3B82F6',
        params: { action: 'klappen' } as GestureParams,
      },
      {
        type: 'speak',
        title: 'Zeg Tekst (TTS)',
        description: 'Spreekt getypte tekst uit',
        icon: '🗣️',
        color: '#F59E0B',
        params: { text: 'Super goed gedaan! Neem gerust even een slokje water.', language: 'nl-NL' } as SpeakParams,
      },
    ],
  },
  {
    id: 'funny_sketch',
    title: '🎭 Grappige Maatje Sketch',
    description: 'Nieuwsgierig naar voren stappen, scheetje laten en geschrokken reageren.',
    badge: 'Humor',
    steps: [
      {
        type: 'expression',
        title: 'Nieuwsgierig',
        description: 'Kijkt rond',
        icon: '🧐',
        color: '#EC4899',
        params: { emotion: 'curious' } as ExpressionParams,
      },
      {
        type: 'motion',
        title: 'Stap Vooruit',
        description: 'Loop 1 stap',
        icon: '🚶',
        color: '#00D26A',
        params: { direction: 'forward', steps: 1 } as MotionParams,
      },
      {
        type: 'gesture',
        title: 'Grappig Scheetje',
        description: 'Bukken met effect',
        icon: '💨',
        color: '#3B82F6',
        params: { action: 'scheet' } as GestureParams,
      },
      {
        type: 'expression',
        title: 'Verbaasd',
        description: 'Grote verbaasde ogen',
        icon: '😮',
        color: '#EC4899',
        params: { emotion: 'surprised' } as ExpressionParams,
      },
      {
        type: 'speak',
        title: 'Zeg Tekst (TTS)',
        description: 'Spreekt getypte tekst uit',
        icon: '🗣️',
        color: '#F59E0B',
        params: { text: 'Oepsie! Wie liet die nou? Ik was het in ieder geval niet!', language: 'nl-NL' } as SpeakParams,
      },
    ],
  },
];

/**
 * Custom Drag & Drop Sequencer Component.
 * Enables visual, linear programming of Robot Maatje with inline tuners and live step tracking.
 */
export const ActionSequencerPanel: React.FC = () => {
  const [steps, setSteps] = useState<SequenceStep[]>(() => {
    // Default initial sequence with a welcoming routine
    return PRESET_ROUTINES[0].steps.map((s, idx) => ({
      ...s,
      id: `step_${Date.now()}_${idx}`,
    }));
  });

  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [currentStepIndex, setCurrentStepIndex] = useState<number | null>(null);
  const [statusLog, setStatusLog] = useState<string>('Gereed om routine af te spelen.');
  const [isLooping, setIsLooping] = useState<boolean>(false);
  const [isSimulationMode, setIsSimulationMode] = useState<boolean>(false); // Default to Live Robot
  const [isRobotConnected, setIsRobotConnected] = useState<boolean>(true);

  // Drag & drop state
  const [draggedPaletteItem, setDraggedPaletteItem] = useState<PaletteItem | null>(null);
  const [draggedStepIndex, setDraggedStepIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Abort controller ref for stopping running sequence
  const abortExecutionRef = useRef<boolean>(false);

  // Poll connection status to dynamically inform user
  useEffect(() => {
    let mounted = true;
    const checkConnection = async () => {
      try {
        const res = await fetch('/api/robot/telemetry', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (mounted) {
            const connected = Boolean(data.connected);
            setIsRobotConnected(connected);
            if (connected) {
              setIsSimulationMode(false);
            }
          }
        }
      } catch {
        if (mounted) {
          setIsRobotConnected(false);
        }
      }
    };
    checkConnection();
    const interval = setInterval(checkConnection, 4000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  // Load custom saved routine from localStorage if present
  useEffect(() => {
    try {
      const saved = localStorage.getItem('maatje_custom_routine');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSteps(parsed);
        }
      }
    } catch {}
  }, []);

  const saveToLocalStorage = () => {
    try {
      localStorage.setItem('maatje_custom_routine', JSON.stringify(steps));
      setStatusLog('Routine succesvol opgeslagen in browser geheugen!');
      setTimeout(() => setStatusLog('Gereed om routine af te spelen.'), 3000);
    } catch (e: any) {
      setStatusLog(`Fout bij opslaan: ${e.message}`);
    }
  };

  const addStepFromPalette = (paletteItem: PaletteItem, targetIndex?: number) => {
    const newStep: SequenceStep = {
      id: `step_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      type: paletteItem.type,
      title: paletteItem.title,
      description: paletteItem.description,
      icon: paletteItem.icon,
      color: paletteItem.color,
      params: JSON.parse(JSON.stringify(paletteItem.defaultParams)),
    };

    setSteps((prev) => {
      const updated = [...prev];
      if (typeof targetIndex === 'number' && targetIndex >= 0 && targetIndex <= updated.length) {
        updated.splice(targetIndex, 0, newStep);
      } else {
        updated.push(newStep);
      }
      return updated;
    });

    setStatusLog(`Toegevoegd aan routine: ${paletteItem.title}`);
  };

  const removeStep = (id: string) => {
    setSteps((prev) => prev.filter((s) => s.id !== id));
  };

  const duplicateStep = (index: number) => {
    setSteps((prev) => {
      const target = prev[index];
      if (!target) return prev;
      const copy: SequenceStep = {
        ...target,
        id: `step_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        params: JSON.parse(JSON.stringify(target.params)),
      };
      const updated = [...prev];
      updated.splice(index + 1, 0, copy);
      return updated;
    });
  };

  const moveStep = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= steps.length) return;
    setSteps((prev) => {
      const updated = [...prev];
      const [movedItem] = updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, movedItem);
      return updated;
    });
  };

  const updateStepParams = (id: string, newParams: any) => {
    setSteps((prev) =>
      prev.map((step) => {
        if (step.id === id) {
          return { ...step, params: { ...step.params, ...newParams } };
        }
        return step;
      })
    );
  };

  const loadPreset = (preset: PresetRoutine) => {
    if (isRunning) return;
    const mapped = preset.steps.map((s, idx) => ({
      ...s,
      id: `step_${Date.now()}_${idx}`,
    }));
    setSteps(mapped);
    setStatusLog(`Preset geladen: "${preset.title}" (${mapped.length} acties)`);
  };

  const stopSequence = async () => {
    abortExecutionRef.current = true;
    setIsRunning(false);
    setCurrentStepIndex(null);
    setStatusLog('Routine gestopt door gebruiker.');

    // Fire emergency stop to bridge
    try {
      await fetch('/api/robot/motion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'stop' }),
      });
    } catch {}
  };

  const executeSingleStep = async (step: SequenceStep): Promise<void> => {
    if (abortExecutionRef.current) return;

    // Browser audio synthesis helper for simulation / offline preview
    const speakInBrowser = (text: string, lang = 'nl-NL'): Promise<void> => {
      return new Promise((resolve) => {
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.lang = lang;
          utterance.rate = 1.0;
          utterance.onend = () => resolve();
          utterance.onerror = () => resolve();
          window.speechSynthesis.speak(utterance);
        } else {
          resolve();
        }
      });
    };

    if (isSimulationMode) {
      // --- VIRTUELE SIMULATIE MODUS (Geen robot verbinding vereist) ---
      if (step.type === 'motion') {
        const params = step.params as MotionParams;
        const dirDutch = { forward: 'vooruit', backward: 'achteruit', left: 'linksom', right: 'rechtsom' }[params.direction];
        setStatusLog(`[Simulatie] Maatje loopt ${params.steps} stap(pen) ${dirDutch}... 🚶`);
        await new Promise((r) => setTimeout(r, Math.max(1200, (params.steps || 1) * 1500)));
      } else if (step.type === 'gesture') {
        const params = step.params as GestureParams;
        setStatusLog(`[Simulatie] Maatje voert gebaar uit: ${step.title}... ✨`);
        const duration = ['dance_0001en', 'fysio1', 'fysio2', 'scheet', 'pushups'].includes(params.action) ? 3500 : 2000;
        await new Promise((r) => setTimeout(r, duration));
      } else if (step.type === 'speak') {
        const params = step.params as SpeakParams;
        setStatusLog(`[Simulatie] Maatje spreekt: "${params.text}"... 🗣️`);
        await Promise.race([
          speakInBrowser(params.text, params.language),
          new Promise((r) => setTimeout(r, Math.max(2500, params.text.length * 85))),
        ]);
      } else if (step.type === 'expression') {
        const params = step.params as ExpressionParams;
        setStatusLog(`[Simulatie] Ogen tonen emotie: ${params.emotion}... 😊`);
        await new Promise((r) => setTimeout(r, 1200));
      } else if (step.type === 'sound') {
        const params = step.params as SoundParams;
        setStatusLog(`[Simulatie] Geluidseffect: ${params.name || params.file}... 🔊`);
        await new Promise((r) => setTimeout(r, 1800));
      } else if (step.type === 'pause') {
        const params = step.params as PauseParams;
        setStatusLog(`[Simulatie] Pauze ${(params.durationMs / 1000).toFixed(1)}s... ⏳`);
        await new Promise((r) => setTimeout(r, params.durationMs || 1000));
      }
      return;
    }

    // --- LIVE ROBOT HARDWARE UITVOERING ---
    try {
      if (step.type === 'motion') {
        const params = step.params as MotionParams;
        await fetch('/api/robot/motion', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'walk',
            direction: params.direction,
            steps: params.steps || 1,
          }),
        });
        await new Promise((r) => setTimeout(r, (params.steps || 1) * 2200));
      } else if (step.type === 'gesture') {
        const params = step.params as GestureParams;
        await fetch('/api/robot/motion', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'preset', action: params.action }),
        });
        const longGestures = ['dance_0001en', 'fysio1', 'fysio2', 'scheet', 'pushups'];
        const waitTime = longGestures.includes(params.action) ? 4500 : 2500;
        await new Promise((r) => setTimeout(r, waitTime));
      } else if (step.type === 'speak') {
        const params = step.params as SpeakParams;
        await fetch('/api/robot/speech', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'speak', text: params.text, language: params.language }),
        });
        const speechDurationMs = Math.max(2000, params.text.length * 85);
        await new Promise((r) => setTimeout(r, speechDurationMs));
      } else if (step.type === 'expression') {
        const params = step.params as ExpressionParams;
        await fetch('/api/robot/expression', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'emotion', emotion: params.emotion }),
        });
        await new Promise((r) => setTimeout(r, 1200));
      } else if (step.type === 'sound') {
        const params = step.params as SoundParams;
        await fetch('/api/robot/speech', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'sound', file: params.file }),
        });
        await new Promise((r) => setTimeout(r, 2200));
      } else if (step.type === 'pause') {
        const params = step.params as PauseParams;
        await new Promise((r) => setTimeout(r, params.durationMs || 1000));
      }
    } catch (err: any) {
      console.warn('[Sequencer] Hardware command failed:', err.message);
      setStatusLog(`Fout bij hardware-stap (${step.title}): ${err.message}`);
      await new Promise((r) => setTimeout(r, 1500));
    }
  };

  const runSequence = async () => {
    if (steps.length === 0 || isRunning) return;

    abortExecutionRef.current = false;
    setIsRunning(true);

    do {
      for (let i = 0; i < steps.length; i++) {
        if (abortExecutionRef.current) break;

        setCurrentStepIndex(i);
        const step = steps[i];
        setStatusLog(`[Stap ${i + 1}/${steps.length}] Uitvoeren: ${step.title}...`);

        try {
          await executeSingleStep(step);
        } catch (err: any) {
          setStatusLog(`Fout bij stap ${i + 1} (${step.title}): ${err.message}`);
          await new Promise((r) => setTimeout(r, 1000));
        }

        if (abortExecutionRef.current) break;
      }

      if (isLooping && !abortExecutionRef.current) {
        setStatusLog('Loop geactiveerd: routine start opnieuw over 2 seconden...');
        await new Promise((r) => setTimeout(r, 2000));
      }
    } while (isLooping && !abortExecutionRef.current);

    setIsRunning(false);
    setCurrentStepIndex(null);
    if (!abortExecutionRef.current) {
      setStatusLog('Routine succesvol voltooid! ✨');
    }
  };

  // Drag & drop handlers
  const handleDragStartPalette = (e: React.DragEvent, item: PaletteItem) => {
    setDraggedPaletteItem(item);
    setDraggedStepIndex(null);
    e.dataTransfer.setData('text/plain', item.title);
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleDragStartStep = (e: React.DragEvent, index: number) => {
    setDraggedStepIndex(index);
    setDraggedPaletteItem(null);
    e.dataTransfer.setData('text/plain', String(index));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = draggedPaletteItem ? 'copy' : 'move';
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    setDragOverIndex(null);

    // Dropped from palette -> create new step at target index
    if (draggedPaletteItem) {
      addStepFromPalette(draggedPaletteItem, targetIndex);
      setDraggedPaletteItem(null);
      return;
    }

    // Reordered existing step
    if (draggedStepIndex !== null && draggedStepIndex !== targetIndex) {
      moveStep(draggedStepIndex, targetIndex);
      setDraggedStepIndex(null);
    }
  };

  const handleDragEnd = () => {
    setDraggedPaletteItem(null);
    setDraggedStepIndex(null);
    setDragOverIndex(null);
  };

  return (
    <section
      className="rounded-3xl p-6 sm:p-8 flex flex-col gap-6 border border-white/15 shadow-2xl relative overflow-hidden"
      style={{ backgroundColor: THEME.colors.hvaDeepNavy }}
    >
      {/* Top Header: Title, Live Status & Execution Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center bg-[#1E1647] border border-white/15 text-white shadow-lg">
            <ListOrdered className="w-6 h-6 text-[#00D26A]" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-lg sm:text-xl font-extrabold tracking-tight text-white">
                Choreografie Studio
              </h2>
              <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-[#00D26A]/20 text-[#00D26A] border border-[#00D26A]/40">
                DRAG &amp; DROP
              </span>
            </div>
            <p className="text-xs text-white/70 mt-0.5 font-medium">
              Sleep acties in de gewenste volgorde: lopen, praten, dansen en emoties &bull; {steps.length} actie{steps.length === 1 ? '' : 's'} in routine
            </p>
          </div>
        </div>

        {/* Global Controls: Play, Stop, Loop, Mode, Save */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setIsSimulationMode(!isSimulationMode)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 border transition-all shadow-sm ${
              !isSimulationMode
                ? 'bg-[#00D26A] text-slate-950 border-[#00D26A] shadow-md'
                : 'bg-[#1E1647] border-white/20 text-white/90 hover:text-white'
            }`}
            title="Klik om te schakelen tussen fysieke robot en laptop simulatie"
          >
            <span
              className={`w-2 h-2 rounded-full ${
                !isSimulationMode ? 'bg-slate-950' : 'bg-[#E15E7A]'
              }`}
            />
            <span>
              {!isSimulationMode ? '🤖 LIVE ROBOT (ACTIEF)' : '🎮 LAPTOP PREVIEW'}
            </span>
          </button>

          <button
            onClick={() => setIsLooping(!isLooping)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all ${
              isLooping
                ? 'bg-[#00D26A]/20 border-[#00D26A] text-[#00D26A]'
                : 'bg-[#1E1647] border-white/10 text-white/80 hover:text-white'
            }`}
            title="Herhaal routine continu"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isLooping ? 'animate-spin' : ''}`} />
            <span>Herhaal: {isLooping ? 'AAN' : 'UIT'}</span>
          </button>

          <button
            onClick={saveToLocalStorage}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-[#1E1647] border border-white/10 hover:border-white/30 text-white flex items-center gap-1.5 transition-all shadow-sm"
            title="Sla huidige routine op in je browser"
          >
            <Save className="w-3.5 h-3.5 text-blue-300" />
            <span>Opslaan</span>
          </button>

          <button
            onClick={() => setSteps([])}
            disabled={isRunning || steps.length === 0}
            className="px-3 py-2 rounded-xl text-xs font-bold bg-[#1E1647] border border-white/10 hover:border-[#E15E7A] text-white/70 hover:text-[#E15E7A] flex items-center gap-1.5 transition-all disabled:opacity-30"
            title="Wis alle acties uit de routine"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Wissen</span>
          </button>

          {isRunning ? (
            <button
              onClick={stopSequence}
              className="px-5 py-2.5 rounded-xl text-xs font-extrabold bg-[#E15E7A] hover:bg-[#D04E6A] text-white flex items-center gap-2 shadow-lg transition-all active:scale-95 animate-pulse"
            >
              <Square className="w-4 h-4 fill-white" />
              <span>STOP ROUTINE</span>
            </button>
          ) : (
            <button
              onClick={runSequence}
              disabled={steps.length === 0}
              className="px-6 py-2.5 rounded-xl text-xs font-extrabold bg-[#00D26A] hover:bg-[#00B85C] text-slate-950 flex items-center gap-2 shadow-lg shadow-[#00D26A]/25 transition-all active:scale-95 disabled:opacity-50"
            >
              <Play className="w-4 h-4 fill-slate-950" />
              <span>START ROUTINE</span>
            </button>
          )}
        </div>
      </div>

      {/* Preset Fast-Loader Bar */}
      <div className="flex flex-wrap items-center gap-2 pt-1 pb-1">
        <span className="text-xs font-bold text-white/70 flex items-center gap-1.5 mr-1">
          <Sparkles className="w-3.5 h-3.5 text-[#E15E7A]" />
          Kant-en-klare voorbeelden:
        </span>
        {PRESET_ROUTINES.map((preset) => (
          <button
            key={preset.id}
            onClick={() => loadPreset(preset)}
            disabled={isRunning}
            className="px-3 py-1.5 rounded-xl text-xs font-medium bg-[#1E1647] border border-white/10 hover:border-white/30 text-white flex items-center gap-2 transition-all disabled:opacity-40"
          >
            <span>{preset.title}</span>
            {preset.badge && (
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-[#00D26A]/20 text-[#00D26A] border border-[#00D26A]/30">
                {preset.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Main Studio Grid: Left Action Library Palette | Right Sequence Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Action Block Palette (4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-3 bg-[#1E1647] border border-white/10 rounded-2xl p-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-[#00D26A]" />
              ACTIE BIBLIOTHEEK (SLEEP OF KLIK)
            </span>
            <span className="text-[11px] text-white/60">
              {PALETTE_ITEMS.length} bouwstenen
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2 max-h-[580px] overflow-y-auto pr-1">
            {PALETTE_ITEMS.map((item, idx) => (
              <div
                key={idx}
                draggable
                onDragStart={(e) => handleDragStartPalette(e, item)}
                onClick={() => addStepFromPalette(item)}
                className="group p-2.5 rounded-xl border border-white/10 bg-[#22167A] hover:bg-[#3220B0] hover:border-white/30 transition-all cursor-grab active:cursor-grabbing flex items-center justify-between gap-3 shadow-sm select-none"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0"
                    style={{ backgroundColor: `${item.color}25`, border: `1px solid ${item.color}50` }}
                  >
                    <span>{item.icon}</span>
                  </div>
                  <div className="truncate">
                    <div className="text-xs font-bold text-white group-hover:text-white transition-colors truncate">
                      {item.title}
                    </div>
                    <div className="text-[11px] text-white/70 truncate">
                      {item.description}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  className="w-6 h-6 rounded-lg flex items-center justify-center bg-[#1E1647] group-hover:bg-[#00D26A] group-hover:text-black text-white/70 shrink-0 transition-colors"
                  title="Voeg toe aan routine"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Ordered Choreography Timeline (8 cols) */}
        <div className="lg:col-span-8 flex flex-col gap-3 bg-[#1E1647] border border-white/10 rounded-2xl p-4 min-h-[460px]">
          <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-[#00D26A]" />
              CHOREOGRAFIE TIJDLIJN (IN VOLGORDE)
            </span>
            <span className="text-xs text-[#00D26A] font-bold">
              {isRunning && currentStepIndex !== null
                ? `● ACTIEF: STAP ${currentStepIndex + 1}/${steps.length}`
                : `${steps.length} STAPPEN`}
            </span>
          </div>

          {/* Timeline Drop Target Canvas */}
          <div
            onDragOver={(e) => handleDragOver(e, steps.length)}
            onDrop={(e) => handleDrop(e, steps.length)}
            className="flex flex-col gap-3 max-h-[580px] overflow-y-auto pr-1"
          >
            {steps.length === 0 ? (
              <div
                onDragOver={(e) => handleDragOver(e, 0)}
                onDrop={(e) => handleDrop(e, 0)}
                className="py-16 px-4 border-2 border-dashed border-slate-800 rounded-xl flex flex-col items-center justify-center gap-3 text-center"
              >
                <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center text-slate-400 text-xl">
                  ✨
                </div>
                <div>
                  <h4 className="text-sm font-mono font-bold text-slate-300">Geen acties in de routine</h4>
                  <p className="text-xs text-slate-500 max-w-sm mt-1">
                    Sleep actieblokken vanuit de linker bibliotheek hiernaartoe, of kies een kant-en-klare preset hierboven.
                  </p>
                </div>
              </div>
            ) : (
              steps.map((step, idx) => {
                const isActive = isRunning && currentStepIndex === idx;
                const isPassed = isRunning && currentStepIndex !== null && currentStepIndex > idx;
                const isDragTarget = dragOverIndex === idx;

                return (
                  <div
                    key={step.id}
                    draggable={!isRunning}
                    onDragStart={(e) => handleDragStartStep(e, idx)}
                    onDragOver={(e) => handleDragOver(e, idx)}
                    onDrop={(e) => handleDrop(e, idx)}
                    onDragEnd={handleDragEnd}
                    className={`rounded-2xl border p-4 transition-all flex flex-col gap-3 relative ${
                      isActive
                        ? 'border-[#E15E7A] bg-[#E15E7A]/20 shadow-lg shadow-[#E15E7A]/30 ring-2 ring-[#E15E7A]'
                        : isPassed
                        ? 'border-white/10 bg-[#1E1647]/60 opacity-75'
                        : isDragTarget
                        ? 'border-white bg-white/15 scale-[1.01]'
                        : 'border-white/10 bg-[#22167A] hover:border-white/30'
                    }`}
                  >
                    {/* Header Row: Step Number, Drag Handle, Icon, Title & Quick Actions */}
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        {/* Drag Handle */}
                        <div
                          className="cursor-grab active:cursor-grabbing text-slate-500 hover:text-slate-300 p-0.5"
                          title="Sleep om volgorde te wijzigen"
                        >
                          <GripVertical className="w-4 h-4" />
                        </div>

                        {/* Step Number Badge */}
                        <div
                          className={`w-6 h-6 rounded-md flex items-center justify-center font-mono font-bold text-xs ${
                            isActive
                              ? 'bg-[#00D26A] text-slate-950 animate-pulse'
                              : isPassed
                              ? 'bg-slate-800 text-[#00D26A]'
                              : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {isPassed ? '✓' : idx + 1}
                        </div>

                        {/* Icon & Title */}
                        <span className="text-base">{step.icon}</span>
                        <div>
                          <div className="text-xs font-mono font-bold text-white flex items-center gap-2">
                            <span>{step.title}</span>
                            {isActive && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded font-mono font-bold bg-[#00D26A] text-slate-950">
                                BEZIG...
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right Action Buttons: Move Up, Move Down, Duplicate, Delete */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => moveStep(idx, idx - 1)}
                          disabled={idx === 0 || isRunning}
                          className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-20"
                          title="Verplaats omhoog"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => moveStep(idx, idx + 1)}
                          disabled={idx === steps.length - 1 || isRunning}
                          className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-20"
                          title="Verplaats omlaag"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => duplicateStep(idx)}
                          disabled={isRunning}
                          className="p-1 rounded text-slate-400 hover:text-blue-300 hover:bg-slate-800 disabled:opacity-20"
                          title="Dupliceer actie"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => removeStep(step.id)}
                          disabled={isRunning}
                          className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-800 disabled:opacity-20"
                          title="Verwijder actie"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Inline Parameter Tuning Section */}
                    <div className="pl-9 pr-1 pt-1 border-t border-slate-800/60 flex flex-wrap items-center gap-3">
                      {/* Movement Tuner */}
                      {step.type === 'motion' && (
                        <div className="flex flex-wrap items-center gap-3 w-full">
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-mono text-slate-400">Richting:</span>
                            <select
                              value={(step.params as MotionParams).direction}
                              onChange={(e) =>
                                updateStepParams(step.id, {
                                  direction: e.target.value as any,
                                })
                              }
                              disabled={isRunning}
                              className="px-2.5 py-1 rounded bg-[#1E1647] border border-white/20 text-xs text-white focus:outline-none focus:border-[#E15E7A]"
                            >
                              <option value="forward">Vooruit ⬆️</option>
                              <option value="backward">Achteruit ⬇️</option>
                              <option value="left">Linksaf Draaien ⬅️</option>
                              <option value="right">Rechtsaf Draaien ➡️</option>
                            </select>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-mono text-slate-400">Stappen:</span>
                            <div className="flex items-center gap-1 bg-slate-950 border border-slate-700 rounded p-0.5">
                              {[1, 2, 3, 4, 5].map((num) => (
                                <button
                                  key={num}
                                  type="button"
                                  onClick={() => updateStepParams(step.id, { steps: num })}
                                  disabled={isRunning}
                                  className={`px-2 py-0.5 rounded text-xs font-mono font-bold transition-all ${
                                    (step.params as MotionParams).steps === num
                                      ? 'bg-[#00D26A] text-slate-950'
                                      : 'text-slate-400 hover:text-white'
                                  }`}
                                >
                                  {num}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Gesture Tuner */}
                      {step.type === 'gesture' && (
                        <div className="flex items-center gap-2 w-full">
                          <span className="text-[11px] font-mono text-slate-400">Gebaar:</span>
                          <select
                            value={(step.params as GestureParams).action}
                            onChange={(e) =>
                              updateStepParams(step.id, {
                                action: e.target.value as PresetActionName,
                              })
                            }
                            disabled={isRunning}
                            className="flex-1 px-2.5 py-1 rounded bg-[#1E1647] border border-white/20 text-xs text-white focus:outline-none focus:border-[#E15E7A]"
                          >
                            <option value="say_hello_avatar">Zwaaien 👋</option>
                            <option value="dance_0001en">Dansen op Muziek 💃</option>
                            <option value="klappen">Klappen in Handen 👏</option>
                            <option value="bow">Beleefde Buiging 🙇</option>
                            <option value="handshake_avatar">Hand Schudden 🤝</option>
                            <option value="act_cute_avatar">Schattige Pose 🥰</option>
                            <option value="hug_avatar">Knuffel 🤗</option>
                            <option value="air_kiss_avatar">Luchtkus 😘</option>
                            <option value="pushups">Opdrukken (Push-ups) 💪</option>
                            <option value="fysio1">Fysio Oefening 1 (Armen op) 🧘</option>
                            <option value="fysio2">Fysio Oefening 2 (Zijwaarts) 🤸</option>
                            <option value="zitten">Gaan Zitten / Rust 🧎</option>
                            <option value="scheet">Grapje / Scheetje 💨</option>
                            <option value="nod">Knikken (Ja) 🙆</option>
                            <option value="shake_head">Schudden (Nee) 🙅</option>
                          </select>
                        </div>
                      )}

                      {/* Speech Tuner */}
                      {step.type === 'speak' && (
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full">
                          <div className="flex-1 flex items-center gap-2">
                            <span className="text-[11px] font-mono text-slate-400 shrink-0">Tekst:</span>
                            <input
                              type="text"
                              value={(step.params as SpeakParams).text}
                              onChange={(e) => updateStepParams(step.id, { text: e.target.value })}
                              disabled={isRunning}
                              placeholder="Typ wat Maatje moet zeggen..."
                              className="flex-1 px-3 py-1 rounded bg-[#1E1647] border border-white/20 text-xs text-white focus:outline-none focus:border-[#E15E7A]"
                            />
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="text-[11px] font-mono text-slate-400">Taal:</span>
                            <button
                              type="button"
                              onClick={() => updateStepParams(step.id, { language: 'nl-NL' })}
                              disabled={isRunning}
                              className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold ${
                                (step.params as SpeakParams).language === 'nl-NL'
                                  ? 'bg-[#25167A] text-white border border-[#3E2BAA]'
                                  : 'text-slate-400 hover:text-white'
                              }`}
                            >
                              🇳🇱 NL
                            </button>
                            <button
                              type="button"
                              onClick={() => updateStepParams(step.id, { language: 'en-US' })}
                              disabled={isRunning}
                              className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold ${
                                (step.params as SpeakParams).language === 'en-US'
                                  ? 'bg-[#25167A] text-white border border-[#3E2BAA]'
                                  : 'text-slate-400 hover:text-white'
                              }`}
                            >
                              🇬🇧 EN
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Expression Tuner */}
                      {step.type === 'expression' && (
                        <div className="flex items-center gap-2 w-full">
                          <span className="text-[11px] font-mono text-slate-400">Emotie:</span>
                          <select
                            value={(step.params as ExpressionParams).emotion}
                            onChange={(e) =>
                              updateStepParams(step.id, {
                                emotion: e.target.value as EmotionType,
                              })
                            }
                            disabled={isRunning}
                            className="flex-1 px-2.5 py-1 rounded bg-[#1E1647] border border-white/20 text-xs text-white focus:outline-none focus:border-[#E15E7A]"
                          >
                            <option value="happy">Blije Lachende Ogen 😊</option>
                            <option value="heart">Hartjes Ogen (Liefde) 🥰</option>
                            <option value="wink">Speelse Knipoog 😉</option>
                            <option value="curious">Nieuwsgierig Rondkijken 🧐</option>
                            <option value="surprised">Grote Verbaasde Ogen 😮</option>
                            <option value="sleepy">Slaperig Inzakkend 😴</option>
                            <option value="angry">Vastberaden / Boos 😠</option>
                            <option value="boot">Opstarten & Wakker Worden 🚀</option>
                          </select>
                        </div>
                      )}

                      {/* Sound Effect Tuner */}
                      {step.type === 'sound' && (
                        <div className="flex items-center gap-2 w-full">
                          <span className="text-[11px] font-mono text-slate-400">Geluid:</span>
                          <select
                            value={(step.params as SoundParams).file}
                            onChange={(e) => {
                              const file = e.target.value;
                              const nameMap: Record<string, string> = {
                                'BCM_happy.mp3': 'Happy Melody',
                                'horn.mp3': 'Car Horn',
                                'police_car.mp3': 'Police Siren',
                                'photograph_001.mp3': 'Countdown',
                                'dance_0001en.mp3': 'Dance Song',
                                'BCM_surprise.mp3': 'Surprise Chime',
                              };
                              updateStepParams(step.id, { file, name: nameMap[file] || file });
                            }}
                            disabled={isRunning}
                            className="flex-1 px-2.5 py-1 rounded bg-[#1E1647] border border-white/20 text-xs text-white focus:outline-none focus:border-[#E15E7A]"
                          >
                            <option value="BCM_happy.mp3">Vrolijk Deuntje (BCM Happy)</option>
                            <option value="horn.mp3">Toeter (Horn)</option>
                            <option value="photograph_001.mp3">Aftellen (3, 2, 1)</option>
                            <option value="police_car.mp3">Politie Sirene</option>
                            <option value="BCM_surprise.mp3">Verrassings Jingle</option>
                            <option value="dance_0001en.mp3">Dans Muziek Track</option>
                          </select>
                        </div>
                      )}

                      {/* Pause Tuner */}
                      {step.type === 'pause' && (
                        <div className="flex items-center gap-3 w-full">
                          <span className="text-[11px] font-mono text-slate-400">Wachttijd:</span>
                          <div className="flex items-center gap-1.5 flex-1">
                            <input
                              type="range"
                              min="500"
                              max="10000"
                              step="500"
                              value={(step.params as PauseParams).durationMs}
                              onChange={(e) =>
                                updateStepParams(step.id, { durationMs: Number(e.target.value) })
                              }
                              disabled={isRunning}
                              className="flex-1 accent-[#00D26A] cursor-pointer"
                            />
                            <span className="text-xs font-mono font-bold text-white min-w-[50px] text-right">
                              {((step.params as PauseParams).durationMs / 1000).toFixed(1)}s
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Footer Console Log */}
      <div className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl bg-[#1E1647] border border-white/10 text-xs">
        <div className="flex items-center gap-2 text-white/80">
          <span className="inline-block w-2 h-2 rounded-full bg-[#00D26A]" />
          <span className="font-bold text-white">STATUS:</span>
          <span className="text-[#00D26A] font-semibold">{statusLog}</span>
        </div>
        <div className="text-white/60 hidden sm:block font-medium">
          Hogeschool van Amsterdam &bull; Robot Maatje Choreograaf
        </div>
      </div>
    </section>
  );
};

