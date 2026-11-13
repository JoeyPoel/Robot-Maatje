'use client';

import React from 'react';
import { Battery, Wifi, ShieldAlert, Activity, Fingerprint, Usb } from 'lucide-react';
import { RobotTelemetry } from '@/types/robot';
import { THEME } from '@/config/theme';

interface SensorStatusBarProps {
  telemetry: RobotTelemetry | null;
  isPolling?: boolean;
}

export const SensorStatusBar: React.FC<SensorStatusBarProps> = ({ telemetry }) => {
  const isConnected = telemetry?.connected ?? false;
  const rawLevel = telemetry?.battery?.level;
  const hasValidBattery = typeof rawLevel === 'number' && rawLevel > 0;
  const isCharging = telemetry?.battery?.usb_powered || telemetry?.battery?.status === 'charging';
  const isFallen = telemetry?.sensors?.is_fallen ?? false;
  const headTouched = telemetry?.sensors?.head_touched ?? false;
  const ip = telemetry?.wifi?.ip && telemetry?.wifi?.ip !== 'N/A' ? telemetry.wifi.ip : null;

  return (
    <div
      className="w-full rounded-2xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 border border-white/15 shadow-xl transition-all"
      style={{ backgroundColor: THEME.colors.hvaDeepNavy }}
    >
      {/* 1. Connection Status */}
      <div className="flex items-center gap-3.5">
        <div
          className={`w-3.5 h-3.5 rounded-full ${
            isConnected ? 'bg-[#00D26A] shadow-[0_0_12px_#00D26A]' : 'bg-[#E15E7A]'
          }`}
        />
        <div>
          <div className="text-[11px] font-bold tracking-wider text-white/70 uppercase">
            Robot Status
          </div>
          <div className="text-sm font-extrabold text-white flex items-center gap-2">
            {isConnected ? 'Verbonden via USB' : 'Niet verbonden'}
            {isConnected ? (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#00D26A]/20 text-[#00D26A] border border-[#00D26A]/40">
                ONLINE
              </span>
            ) : (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#E15E7A]/20 text-[#E15E7A] border border-[#E15E7A]/40">
                OFFLINE
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 2. Battery Status (No fake percentages) */}
      <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-[#1E1647] border border-white/10">
        <Battery className="w-5 h-5 text-[#00D26A]" />
        <div>
          <div className="text-[11px] font-bold text-white/70">Batterij</div>
          <div className="text-sm font-extrabold text-white">
            {isConnected ? (
              hasValidBattery ? (
                <span>
                  {rawLevel}% {isCharging && <span className="text-[#00D26A]">⚡ (Aan lader)</span>}
                </span>
              ) : (
                <span className="text-xs text-white/90">Aan lader (USB)</span>
              )
            ) : (
              <span className="text-xs text-white/50">Niet beschikbaar</span>
            )}
          </div>
        </div>
      </div>

      {/* 3. Posture / Gyroscope */}
      <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-[#1E1647] border border-white/10">
        {isFallen ? (
          <ShieldAlert className="w-5 h-5 text-[#E15E7A] animate-bounce" />
        ) : (
          <Activity className="w-5 h-5 text-[#00D26A]" />
        )}
        <div>
          <div className="text-[11px] font-bold text-white/70">Houding</div>
          <div className="text-xs font-extrabold text-white">
            {isConnected ? (
              isFallen ? (
                <span className="text-[#E15E7A]">Omgevallen (Hulp nodig)</span>
              ) : (
                <span className="text-[#00D26A]">Rechtop staand</span>
              )
            ) : (
              <span className="text-white/50">Inactief</span>
            )}
          </div>
        </div>
      </div>

      {/* 4. Head Touch Sensor */}
      <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-[#1E1647] border border-white/10">
        <Fingerprint
          className={`w-5 h-5 ${headTouched ? 'text-[#00D26A]' : 'text-white/60'}`}
        />
        <div>
          <div className="text-[11px] font-bold text-white/70">Aanraaksensor</div>
          <div className="text-xs font-extrabold text-white">
            {isConnected ? (
              headTouched ? (
                <span className="text-[#00D26A]">Aanraking gedetecteerd!</span>
              ) : (
                <span className="text-white/80">Klaar voor aaien</span>
              )
            ) : (
              <span className="text-white/50">Offline</span>
            )}
          </div>
        </div>
      </div>

      {/* 5. Wi-Fi Connection */}
      <div className="hidden md:flex items-center gap-3 px-4 py-2.5 rounded-xl bg-[#1E1647] border border-white/10">
        <Wifi className="w-5 h-5 text-white/70" />
        <div>
          <div className="text-[11px] font-bold text-white/70">Netwerk</div>
          <div className="text-xs font-semibold text-white/90">
            {isConnected && ip ? ip : 'Lokaal verbonden'}
          </div>
        </div>
      </div>
    </div>
  );
};
