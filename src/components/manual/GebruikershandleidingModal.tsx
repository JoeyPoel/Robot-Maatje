'use client';

import React, { useState } from 'react';
import { X, BookOpen, CheckCircle, AlertTriangle, Play, Volume2, Smile, Move, HeartHandshake, Sparkles, ChevronRight } from 'lucide-react';
import { HvaEmblem } from '@/components/ui/HvaLogo';

interface GebruikershandleidingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GebruikershandleidingModal: React.FC<GebruikershandleidingModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'starten' | 'bediening' | 'choreograaf' | 'troubleshoot'>('starten');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#22167A] border-2 border-white/20 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-white font-sans">
        {/* Header */}
        <div className="px-6 py-5 border-b border-white/15 bg-[#1E1647] flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <HvaEmblem className="w-8 h-8 text-white shrink-0" />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#E15E7A]">HvA Creating Tomorrow</span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white">
                Gebruikershandleiding Robot Maatje
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-[#E15E7A] text-white transition-colors"
            title="Sluiten"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-white/15 bg-[#1E1647]/50 px-6 gap-2 overflow-x-auto text-xs sm:text-sm font-bold">
          <button
            onClick={() => setActiveTab('starten')}
            className={`py-3 px-3.5 border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'starten'
                ? 'border-[#E15E7A] text-white font-black'
                : 'border-transparent text-white/70 hover:text-white'
            }`}
          >
            <span>🚀 1. Aanzetten &amp; Starten</span>
          </button>

          <button
            onClick={() => setActiveTab('bediening')}
            className={`py-3 px-3.5 border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'bediening'
                ? 'border-[#E15E7A] text-white font-black'
                : 'border-transparent text-white/70 hover:text-white'
            }`}
          >
            <span>🎛️ 2. Bedieningspaneel</span>
          </button>

          <button
            onClick={() => setActiveTab('choreograaf')}
            className={`py-3 px-3.5 border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'choreograaf'
                ? 'border-[#E15E7A] text-white font-black'
                : 'border-transparent text-white/70 hover:text-white'
            }`}
          >
            <span>🎭 3. Routine Choreograaf</span>
          </button>

          <button
            onClick={() => setActiveTab('troubleshoot')}
            className={`py-3 px-3.5 border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'troubleshoot'
                ? 'border-[#E15E7A] text-white font-black'
                : 'border-transparent text-white/70 hover:text-white'
            }`}
          >
            <span>❓ 4. Hulp &amp; Veiligheid</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm leading-relaxed text-white/90">
          {activeTab === 'starten' && (
            <div className="space-y-6">
              <div className="p-4 rounded-2xl bg-[#1E1647] border border-white/10 flex gap-4 items-start">
                <span className="text-3xl">🤖</span>
                <div>
                  <h3 className="font-extrabold text-base text-white">Wat is Robot Maatje?</h3>
                  <p className="text-white/80 mt-1 text-xs sm:text-sm">
                    Robot Maatje is een vriendelijke humanoïde zorg- en onderwijsrobot van de Hogeschool van Amsterdam. Hij beschikt over 14 motoren om soepel te bewegen, twee ronde digitale oogschermen voor levendige emoties, een camera in zijn voorhoofd en een ingebouwde luidspreker.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-[#E15E7A] text-white text-xs flex items-center justify-center font-bold">1</span>
                  Stap-voor-stap klaarmaken (binnen 2 minuten)
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="p-4 rounded-xl bg-[#1E1647] border border-white/10">
                    <div className="font-bold text-white mb-1 flex items-center gap-1.5">
                      <span>🔌 1. USB Kabel inpluggen</span>
                    </div>
                    <p className="text-xs text-white/75">
                      Steek de witte USB-kabel in de rug van Maatje en in de computer. Hierdoor krijgt hij stroom en kan de app direct met hem communiceren.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-[#1E1647] border border-white/10">
                    <div className="font-bold text-white mb-1 flex items-center gap-1.5">
                      <span>🔘 2. Knop 3 sec indrukken</span>
                    </div>
                    <p className="text-xs text-white/75">
                      Houd de ronde knop op zijn borst 3 seconden ingedrukt. Zijn ogen lichten op en hij gaat vanzelf rechtop staan op zijn beentjes.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-[#1E1647] border border-white/10">
                    <div className="font-bold text-white mb-1 flex items-center gap-1.5">
                      <span>💻 3. Bedieningspaneel openen</span>
                    </div>
                    <p className="text-xs text-white/75">
                      Open <strong className="text-white">http://localhost:3000</strong> in Google Chrome of Edge. Je ziet direct een groen lampje als Maatje online is.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#00D26A]/10 border border-[#00D26A]/30 text-white flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-[#00D26A] shrink-0 mt-0.5" />
                <div className="text-xs sm:text-sm">
                  <strong className="text-[#00D26A] block font-bold mb-0.5">Tip voor veilig neerzetten:</strong>
                  Zet Maatje altijd op een stevige, vlakke tafel op minstens 30 centimeter afstand van de rand.
                </div>
              </div>
            </div>
          )}

          {activeTab === 'bediening' && (
            <div className="space-y-4">
              <h3 className="text-lg font-black text-white">Overzicht van de bedieningsfuncties</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-[#1E1647] border border-white/10 space-y-1.5">
                  <div className="font-bold text-white flex items-center gap-2">
                    <Smile className="w-4 h-4 text-[#00D26A]" />
                    <span>👀 Oogexpressies &amp; Hartjes</span>
                  </div>
                  <p className="text-xs text-white/80">
                    Kies een emotie zoals <strong>Blij 😊</strong>, <strong>Hartjesogen 🥰</strong> of <strong>Knipoog 😉</strong>. Maatje toont deze expressie direct op zijn schermpjes.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[#1E1647] border border-white/10 space-y-1.5">
                  <div className="font-bold text-white flex items-center gap-2">
                    <Volume2 className="w-4 h-4 text-[#E15E7A]" />
                    <span>🗣️ Spraak &amp; Geluid</span>
                  </div>
                  <p className="text-xs text-white/80">
                    Typ een willekeurige zin in (bijvoorbeeld &quot;Goedemorgen allemaal!&quot;) en klik op <strong>Spreek Zin Uit</strong>. Maatje spreekt de zin direct hardop uit via zijn eigen luidspreker.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[#1E1647] border border-white/10 space-y-1.5">
                  <div className="font-bold text-white flex items-center gap-2">
                    <Move className="w-4 h-4 text-sky-400" />
                    <span>🤸 Bewegingen &amp; Oefeningen</span>
                  </div>
                  <p className="text-xs text-white/80">
                    Laat Maatje zwaaien, handklappen, een fysio-oefening doen, buigen of vrolijk dansen op muziek met één klik op de knop.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[#1E1647] border border-white/10 space-y-1.5">
                  <div className="font-bold text-white flex items-center gap-2">
                    <HeartHandshake className="w-4 h-4 text-amber-400" />
                    <span>🛑 Veiligheid &amp; Balans</span>
                  </div>
                  <p className="text-xs text-white/80">
                    Wankelt Maatje of moet hij direct stoppen? Klik op de roze knop <strong>NOODSTOP</strong> in de koptekst om alle motoren direct te ontspannen en tot stilstand te brengen.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'choreograaf' && (
            <div className="space-y-5">
              <div>
                <h3 className="text-lg font-black text-white">De Routine Choreograaf (Drag &amp; Drop)</h3>
                <p className="text-xs sm:text-sm text-white/80 mt-1">
                  Bouw eenvoudig je eigen actie-volgorde zonder code. Net als Lego-steentjes die na elkaar worden uitgevoerd:
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#1E1647] border border-white/15 flex flex-wrap items-center justify-center gap-2 text-xs font-bold text-center">
                <span className="px-3 py-1.5 rounded-lg bg-[#E15E7A] text-white">1. Blije Ogen 😊</span>
                <span className="text-white/50">&rarr;</span>
                <span className="px-3 py-1.5 rounded-lg bg-sky-600 text-white">2. Zeg &quot;Welkom op de HvA!&quot;</span>
                <span className="text-white/50">&rarr;</span>
                <span className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white">3. Zwaaien 👋</span>
                <span className="text-white/50">&rarr;</span>
                <span className="px-3 py-1.5 rounded-lg bg-purple-600 text-white">4. Dansje 💃</span>
              </div>

              <ol className="space-y-3 text-xs sm:text-sm">
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-[#E15E7A] text-white text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">1</span>
                  <div>
                    <strong className="text-white">Kies een bouwsteen</strong> in de linker bibliotheek (zoals Zwaaien, Spraak, Lopen of Pauze) en klik op het <strong>plusje (+)</strong> of sleep hem naar de tijdlijn.
                  </div>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-[#E15E7A] text-white text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">2</span>
                  <div>
                    <strong className="text-white">Pas de actie aan</strong>: typ bij spraak jouw eigen Nederlandse tekst in, of stel bij lopen de richting en het aantal stappen in.
                  </div>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-[#E15E7A] text-white text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">3</span>
                  <div>
                    <strong className="text-white">Verander de volgorde</strong> met de pijltjes (&uarr; en &darr;) of sleep blokjes omhoog en omlaag.
                  </div>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-[#00D26A] text-slate-950 text-[11px] font-black flex items-center justify-center shrink-0 mt-0.5">4</span>
                  <div>
                    <strong className="text-white">Klik op &quot;START ROUTINE&quot;</strong>: Maatje voert jouw hele routine automatisch uit!
                  </div>
                </li>
              </ol>
            </div>
          )}

          {activeTab === 'troubleshoot' && (
            <div className="space-y-4">
              <h3 className="text-lg font-black text-white">Veelgestelde Vragen &amp; Eerste Hulp</h3>

              <div className="space-y-3 text-xs sm:text-sm">
                <div className="p-4 rounded-xl bg-[#1E1647] border border-white/10">
                  <strong className="text-white block font-bold mb-1">
                    ❓ Maatje praat niet of het geluid komt uit de laptop:
                  </strong>
                  <p className="text-white/80">
                    Controleer of de bridge actief is en of Maatje verbonden is via USB. In de choreograaf staat standaard de fysieke robot ingeschakeld (groen label &quot;LIVE ROBOT&quot;).
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[#1E1647] border border-white/10">
                  <strong className="text-white block font-bold mb-1">
                    ❓ Maatje wankelt of valt bijna om:
                  </strong>
                  <p className="text-white/80">
                    Klik direct op <strong className="text-[#E15E7A]">Rechtop staan &amp; balans herstellen</strong> onderaan het scherm. Maatje zet zijn voeten direct recht en herstelt zijn zwaartepunt.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[#1E1647] border border-white/10">
                  <strong className="text-white block font-bold mb-1">
                    ❓ Wat als ik de robot even wil pauzeren?
                  </strong>
                  <p className="text-white/80">
                    Klik op <strong className="text-white">Gaan zitten / Ruststand</strong>. Maatje gaat rustig door zijn knieën zitten en ontspant zijn heupen en benen, waardoor hij veilig op tafel blijft zitten en batterij bespaart.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/15 bg-[#1E1647] flex items-center justify-between">
          <span className="text-xs text-white/60">
            Hogeschool van Amsterdam &bull; Robotica voor Zorg &amp; Onderwijs
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#E15E7A] hover:bg-[#D04E6A] font-extrabold text-xs text-white transition-all shadow-md active:scale-95"
          >
            Begrepen &amp; Sluiten
          </button>
        </div>
      </div>
    </div>
  );
};

