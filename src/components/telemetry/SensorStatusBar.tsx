'use client';

import React from 'react';
import { Battery, Wifi, ShieldAlert, Cpu, Activity, Fingerprint } from 'lucide-react';
import { RobotTelemetry } from '@/types/robot';
import { STRINGS } from '@/config/strings';
import { THEME } from '@/config/theme';

interface SensorStatusBarProps {
  telemetry: RobotTelemetry | null;
  isPolling?: boolean;
}

export const SensorStatusBar: React.FC<SensorStatusBarProps> = ({ telemetry, isPolling }) => {
  const isConnected = telemetry?.connected ?? false;
  const batteryLevel = telemetry?.battery?.level ?? 0;
  const isCharging = telemetry?.battery?.usb_powered || telemetry?.battery?.status === 'charging';
  const isFallen = telemetry?.sensors?.is_fallen ?? false;
  const headTouched = telemetry?.sensors?.head_touched ?? false;
  const ip = telemetry?.wifi?.ip ?? 'N/A';

  return (
    <div
      className={`w-full rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 ${THEME.borders.panel}`}
      style={{ backgroundColor: THEME.colors.surface }}
    >
      {/* Connection & Bridge Status */}
      <div className="flex items-center gap-3">
        <div
          className="w-3.5 h-3.5 rounded-full animate-pulse"
          style={{ backgroundColor: isConnected ? THEME.colors.hvaFreshGreen : THEME.colors.error }}
        />
        <div>
          <div className="text-[10px] font-mono tracking-wider font-semibold text-slate-400">
            HOGESCHOOL VAN AMSTERDAM
          </div>
          <div className="text-sm font-bold flex items-center gap-2 text-white">
            {isConnected ? STRINGS.app.statusOnline : STRINGS.app.statusOffline}
            {isPolling && (
              <span className="text-[10px] px-2 py-0.5 rounded font-mono bg-[#25167A] text-white border border-[#3E2BAA]">
                LIVE SYNC
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Battery Status */}
      <div className="flex items-center gap-3 px-3.5 py-2 rounded-lg border border-[#1A2952] bg-[#040A18]/60">
        <Battery
          className="w-5 h-5"
          style={{
            color: batteryLevel > 20 ? (isCharging ? THEME.colors.hvaFreshGreen : THEME.colors.hvaFreshGreen) : THEME.colors.error,
          }}
        />
        <div>
          <div className="text-[10px] font-mono text-slate-400">{STRINGS.telemetry.battery}</div>
          <div className="text-sm font-bold font-mono text-white">
            {batteryLevel}% {isCharging && <span className="text-xs text-[#00D26A]">⚡</span>}
          </div>
        </div>
      </div>

      {/* Wi-Fi & IP */}
      <div className="flex items-center gap-3 px-3.5 py-2 rounded-lg border border-[#1A2952] bg-[#040A18]/60">
        <Wifi className="w-5 h-5 text-[#00D26A]" />
        <div>
          <div className="text-[10px] font-mono text-slate-400">{STRINGS.telemetry.ipAddress}</div>
          <div className="text-xs font-mono font-semibold text-slate-200">{ip}</div>
        </div>
      </div>

      {/* Posture & Gyro State */}
      <div className="flex items-center gap-3 px-3.5 py-2 rounded-lg border border-[#1A2952] bg-[#040A18]/60">
        {isFallen ? (
          <ShieldAlert className="w-5 h-5 text-[#FF3E83] animate-bounce" />
        ) : (
          <Activity className="w-5 h-5 text-[#00D26A]" />
        )}
        <div>
          <div className="text-[10px] font-mono text-slate-400">{STRINGS.telemetry.gyroTitle}</div>
          <div
            className="text-xs font-bold font-mono uppercase"
            style={{ color: isFallen ? THEME.colors.error : THEME.colors.hvaFreshGreen }}
          >
            {isFallen ? STRINGS.telemetry.fallDetected : STRINGS.telemetry.upright}
          </div>
        </div>
      </div>

      {/* Head Touch State */}
      <div className="flex items-center gap-3 px-3.5 py-2 rounded-lg border border-[#1A2952] bg-[#040A18]/60">
        <Fingerprint
          className="w-5 h-5"
          style={{ color: headTouched ? THEME.colors.hvaFreshGreen : THEME.colors.textMuted }}
        />
        <div>
          <div className="text-[10px] font-mono text-slate-400">{STRINGS.telemetry.headTouch}</div>
          <div className="text-xs font-bold font-mono" style={{ color: headTouched ? THEME.colors.hvaFreshGreen : THEME.colors.textSecondary }}>
            {headTouched ? STRINGS.telemetry.touchActive : STRINGS.telemetry.touchIdle}
          </div>
        </div>
      </div>

      {/* Device Hardware ID */}
      <div className="hidden lg:flex items-center gap-2 text-xs font-mono text-slate-400">
        <Cpu className="w-4 h-4 text-slate-500" />
        <span>SN: {telemetry?.device_id || 'X100'}</span>
      </div>
    </div>
  );
};
