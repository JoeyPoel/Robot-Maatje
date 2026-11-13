/**
 * Official Hogeschool van Amsterdam (HvA) Corporate Design System & Brand Tokens
 * Sampled directly from the official HvA web styleguide (hva.nl).
 *
 * Primary Colors:
 * - HvA Royal Blue:  #3220B0 (Signature vibrant blue canvas background)
 * - HvA Deep Navy:   #22167A (Elevated content cards and modules)
 * - HvA Midnight:    #1E1647 (Dark contrasting container blocks)
 * - HvA Coral Pink:  #E15E7A (Action accents, primary highlights and featured cards)
 * - HvA Fresh Green: #00D26A (Status indicators, success, active sensors)
 * - Pure White:      #FFFFFF (Clean editorial typography)
 */

export const THEME = {
  colors: {
    // Official HvA Brand Colors
    hvaRoyalBlue: '#3220B0',
    hvaDeepNavy: '#22167A',
    hvaMidnight: '#1E1647',
    hvaCoralPink: '#E15E7A',
    hvaCoralPinkHover: '#D04E6A',
    hvaFreshGreen: '#00D26A',
    hvaFreshGreenHover: '#00B85C',
    hvaWhite: '#FFFFFF',

    // Surfaces & Canvas
    background: '#3220B0',
    surface: '#22167A',
    surfaceElevated: '#1E1647',
    surfaceBorder: 'rgba(255, 255, 255, 0.12)',
    surfaceBorderHover: 'rgba(255, 255, 255, 0.28)',

    // Accents mapped to HvA Brand
    primary: '#E15E7A',
    primaryHover: '#D04E6A',
    secondary: '#00D26A',
    secondaryHover: '#00B85C',
    telemetry: '#FFB800',
    success: '#00D26A',
    error: '#E15E7A',

    // Typography
    textPrimary: '#FFFFFF',
    textSecondary: 'rgba(255, 255, 255, 0.85)',
    textMuted: 'rgba(255, 255, 255, 0.65)',
    textAccent: '#E15E7A',
  },
  borders: {
    panel: 'border border-white/10',
    hvaNavy: 'border border-[#22167A]',
    hvaPink: 'border border-[#E15E7A]',
    hvaGreen: 'border border-[#00D26A]',
  },
  shadows: {
    card: '0 8px 30px rgba(15, 8, 70, 0.35)',
    glowPink: '0 0 20px rgba(225, 94, 122, 0.35)',
    glowGreen: '0 0 20px rgba(0, 210, 106, 0.30)',
  },
  typography: {
    fontSans: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    fontMono: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
  },
};
