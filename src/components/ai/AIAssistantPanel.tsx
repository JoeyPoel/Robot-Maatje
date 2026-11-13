'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  Send,
  Mic,
  MicOff,
  Sparkles,
  Camera,
  Play,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Volume2,
} from 'lucide-react';
import { THEME } from '@/config/theme';

interface Message {
  id: string;
  sender: 'user' | 'maatje';
  text: string;
  actions?: Array<{ tool: string; args: Record<string, unknown> }>;
  timestamp: string;
}

const QUICK_PROMPTS = [
  'Zwaai naar me en zeg hallo 👋',
  'Geef me hartjesogen 🥰',
  'Doe een vrolijk dansje! 💃',
  'Wat zie je door je camera? 📸',
  'Ga even rustig zitten 🪑',
  'Vertel een korte grap en knipoog 😉',
];

export const AIAssistantPanel: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'maatje',
      text: 'Hallo! Ik ben Robot Maatje. Je kunt met me praten via de microfoon of typ een vraag. Vraag me om te zwaaien, dansen, lopen, hartjesogen te tonen of te kijken wat er voor me staat!',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isAnalyzingVision, setIsAnalyzingVision] = useState(false);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Auto-scroll ONLY inside the chat container (page window never bounces)
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  // Initialize SpeechRecognition if available in browser
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.lang = 'nl-NL';
        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          if (transcript) {
            setInputText(transcript);
            handleSubmit(transcript);
          }
        };

        recognition.onerror = (event: any) => {
          console.warn('[SpeechRecognition error]:', event.error);
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      }
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert('Spraakherkenning wordt niet ondersteund in deze browser. Gebruik Google Chrome of Edge.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        setErrorStatus(null);
        recognitionRef.current.start();
        setIsListening(true);
      } catch (e) {
        console.warn('Speech start error:', e);
        setIsListening(false);
      }
    }
  };

  const handleSubmit = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || isLoading) return;

    setInputText('');
    setErrorStatus(null);

    const userMsg: Message = {
      id: `usr_${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      // Build conversation history format for LLM proxy
      const history = messages.slice(-6).map((m) => ({
        role: (m.sender === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
        content: m.text,
      }));

      const res = await fetch('/api/robot/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Er is een fout opgetreden bij de AI server.');
      }

      const botMsg: Message = {
        id: `bot_${Date.now()}`,
        sender: 'maatje',
        text: data.reply || 'Ik heb je gehoord!',
        actions: data.executedActions || [],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      setErrorStatus(errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  // Inspect what the camera sees via multimodal vision LLM
  const handleInspectVision = async () => {
    setIsAnalyzingVision(true);
    setErrorStatus(null);
    try {
      const res = await fetch('/api/robot/vision/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: 'Kijk naar de camera. Benoem kort in het Nederlands wat of wie je ziet en reageer vriendelijk.',
        }),
      });

      const data = await res.json();
      if (data.success) {
        const botMsg: Message = {
          id: `bot_vis_${Date.now()}`,
          sender: 'maatje',
          text: `📸 Wat ik zie: ${data.description}`,
          actions: [{ tool: 'inspect_camera_view', args: { result: data.description } }],
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, botMsg]);
      } else {
        throw new Error(data.error || 'Kon beeld niet analyseren');
      }
    } catch (err: unknown) {
      setErrorStatus(err instanceof Error ? err.message : String(err));
    } finally {
      setIsAnalyzingVision(false);
    }
  };

  return (
    <div
      className={`rounded-2xl p-5 flex flex-col gap-4 ${THEME.borders.panel} shadow-xl`}
      style={{ backgroundColor: THEME.colors.surface }}
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between border-b border-white/10 pb-3 gap-2">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-[#E15E7A] text-white">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold tracking-wider text-white flex items-center gap-2">
              <span>AI ASSISTENT &amp; BREIN</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#00D26A]/20 border border-[#00D26A]/40 text-[#00D26A] font-mono">
                UvA/HvA LiteLLM
              </span>
            </h2>
            <p className="text-[11px] text-white/60">
              Praat met Maatje: beweegt, kijkt, toont emoties en spreekt via hardware.
            </p>
          </div>
        </div>

        {/* Quick Vision Inspect Button */}
        <button
          onClick={handleInspectVision}
          disabled={isAnalyzingVision || isLoading}
          className="px-3 py-1.5 rounded-lg bg-[#1E1647] hover:bg-[#2B1C94] border border-white/20 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm disabled:opacity-50"
          title="Vraag Maatje wat hij ziet door zijn voorhoofdcamera"
        >
          <Camera className={`w-3.5 h-3.5 text-[#00D26A] ${isAnalyzingVision ? 'animate-pulse' : ''}`} />
          <span>{isAnalyzingVision ? 'Analyseren...' : 'Wat zie je? (Vision)'}</span>
        </button>
      </div>

      {/* Conversation Stream (Scroll contained locally) */}
      <div
        ref={chatContainerRef}
        className="flex-1 min-h-[260px] max-h-[360px] overflow-y-auto space-y-3 p-3 rounded-xl bg-[#1E1647] border border-white/10"
      >
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs sm:text-sm leading-relaxed ${
                  isUser
                    ? 'bg-[#3220B0] text-white border border-white/20 rounded-br-sm'
                    : 'bg-[#22167A] text-white border border-white/10 rounded-bl-sm shadow-md'
                }`}
              >
                {!isUser && (
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#E15E7A] mb-1 uppercase tracking-wider">
                    <Sparkles className="w-3 h-3" />
                    <span>Robot Maatje</span>
                  </div>
                )}
                <p className="whitespace-pre-wrap">{msg.text}</p>

                {/* Executed Action Chips */}
                {msg.actions && msg.actions.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-white/10 flex flex-wrap gap-1.5">
                    {msg.actions.map((act, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#00D26A]/20 border border-[#00D26A]/40 text-[#00D26A] text-[10px] font-mono font-bold"
                      >
                        <CheckCircle2 className="w-3 h-3 shrink-0" />
                        <span>
                          {act.tool === 'speak_text' && `🗣️ Spraak: "${String(act.args?.text || '').slice(0, 20)}..."`}
                          {act.tool === 'show_emotion' && `👀 Emotie: ${act.args?.emotion}`}
                          {act.tool === 'play_gesture' && `🤸 Gebaar: ${act.args?.gesture}`}
                          {act.tool === 'move_robot' && `🚶 Stap: ${act.args?.direction}`}
                          {act.tool === 'inspect_camera_view' && `📸 Camera Scan`}
                          {!['speak_text', 'show_emotion', 'play_gesture', 'move_robot', 'inspect_camera_view'].includes(act.tool) && act.tool}
                        </span>
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <span className="text-[10px] text-white/40 mt-1 px-1">{msg.timestamp}</span>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-center gap-2 text-xs text-white/60 p-2">
            <Loader2 className="w-4 h-4 animate-spin text-[#E15E7A]" />
            <span>Maatje denkt na en stuurt motoren aan...</span>
          </div>
        )}
      </div>

      {/* Quick Action Pills */}
      <div className="flex flex-wrap gap-1.5">
        {QUICK_PROMPTS.map((prompt, idx) => (
          <button
            key={idx}
            type="button"
            onClick={(e) => {
              e.preventDefault();
              handleSubmit(prompt);
            }}
            disabled={isLoading}
            className="px-2.5 py-1 rounded-lg bg-[#1E1647] hover:bg-white/10 border border-white/10 text-white/80 hover:text-white text-[11px] font-medium transition-colors disabled:opacity-50"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Input Box & Mic Button */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
        className="flex items-center gap-2 pt-1"
      >
        {/* Microphone Button */}
        <button
          type="button"
          onClick={toggleListening}
          className={`p-3 rounded-xl transition-all shadow-md flex items-center justify-center shrink-0 ${
            isListening
              ? 'bg-red-500 text-white animate-pulse shadow-red-500/50'
              : 'bg-[#1E1647] hover:bg-white/10 border border-white/20 text-white/90'
          }`}
          title={isListening ? 'Aan het luisteren... Klik om te stoppen' : 'Klik om in te spreken'}
        >
          {isListening ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4 text-white/60" />}
        </button>

        {/* Text Input Field */}
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={
            isListening
              ? 'Spreek nu in het Nederlands...'
              : 'Typ een vraag of opdracht voor Robot Maatje...'
          }
          disabled={isLoading}
          className="flex-1 px-4 py-2.5 rounded-xl bg-[#1E1647] border border-white/20 text-xs sm:text-sm text-white placeholder-white/40 focus:outline-none focus:border-[#E15E7A] transition-colors"
        />

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading || !inputText.trim()}
          className="px-4 py-2.5 rounded-xl bg-[#E15E7A] hover:bg-[#D04E6A] text-white font-extrabold text-xs flex items-center gap-1.5 transition-all shadow-md disabled:opacity-40 active:scale-95"
        >
          <Send className="w-4 h-4" />
          <span className="hidden sm:inline">Verstuur</span>
        </button>
      </form>

      {/* Error status display */}
      {errorStatus && (
        <div className="p-2.5 rounded-lg bg-red-500/20 border border-red-500/40 text-red-200 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
          <span>{errorStatus}</span>
        </div>
      )}
    </div>
  );
};

