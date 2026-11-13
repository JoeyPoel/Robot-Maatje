/**
 * HvA (Hogeschool van Amsterdam) Corporate Design System & Brand Tokens
 * Source: https://www.hva.nl/over-de-hva
 * Official Colors: HvA Paars (#25167A), HvA Fresh Green (#00D26A), HvA Navy (#00163A), Sweet Pink (#FF3E83)
 */

export const THEME = {
  colors: {
    // HvA Corporate Identity
    hvaPurple: '#25167A',
    hvaPurpleHover: '#2C18A0',
    hvaPurpleLight: '#ECE9F8',
    hvaFreshGreen: '#00D26A',
    hvaFreshGreenHover: '#00B85C',
    hvaSweetPink: '#FF3E83',
    hvaNavy: '#00163A',
    hvaOcean: '#0084FF',

    // Surfaces & Canvas (Dark HvA Modern Editorial Palette)
    background: '#040A18',
    surface: '#0A1329',
    surfaceElevated: '#101C3D',
    surfaceBorder: '#1A2952',

    // Accents mapped to HvA Brand
    primary: '#25167A',
    primaryHover: '#2C18A0',
    secondary: '#00D26A',
    secondaryHover: '#00B85C',
    telemetry: '#FFB800',
    success: '#00D26A',
    error: '#FF3E83',

    // Typography
    textPrimary: '#FFFFFF',
    textSecondary: '#A0AEC0',
    textMuted: '#64748B',
    textAccent: '#00D26A',
  },
  borders: {
    panel: 'border border-[#1A2952]',
    hvaPurple: 'border border-[#25167A]/60',
    hvaGreen: 'border border-[#00D26A]/50',
    hvaPink: 'border border-[#FF3E83]/50',
  },
  shadows: {
    glowPurple: '0 0 24px rgba(37, 22, 122, 0.35)',
    glowGreen: '0 0 20px rgba(0, 210, 106, 0.25)',
    glowPink: '0 0 20px rgba(255, 62, 131, 0.25)',
  },
  typography: {
    fontMono: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
    fontSans: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
};
