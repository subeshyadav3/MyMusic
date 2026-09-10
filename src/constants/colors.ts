// Dynamic and Static Color palette for MyMusic

export interface ColorTheme {
  bg: string;
  bgCard: string;
  bgElevated: string;
  bgSurface: string;
  bgPopup: string;
  accent: string;
  accentLight: string;
  accentGlow: string;
  accentPink: string;
  accentGreen: string;
  accentBlue: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  borderLight: string;
  gradientPurple: readonly [string, string];
  gradientPink: readonly [string, string];
  gradientDark: readonly [string, string];
}

export const Colors: ColorTheme = {
  // Backgrounds
  bg: '#0A0A0F',
  bgCard: '#12121A',
  bgElevated: '#1A1A26',
  bgSurface: '#222235',
  bgPopup: '#16162080',

  // Accents
  accent: '#7C3AED',
  accentLight: '#A855F7',
  accentGlow: 'rgba(124, 58, 237, 0.25)',
  accentPink: '#EC4899',
  accentGreen: '#10B981',
  accentBlue: '#3B82F6',

  // Text
  textPrimary: '#F1F1F8',
  textSecondary: '#9898B0',
  textMuted: '#555570',

  // Borders
  border: '#252535',
  borderLight: '#30304A',

  // Gradients
  gradientPurple: ['#7C3AED', '#4C1D95'] as const,
  gradientPink: ['#EC4899', '#7C3AED'] as const,
  gradientDark: ['#1A1A26', '#0A0A0F'] as const,
};

export function updateGlobalTheme(
  accentColor?: string,
  themeMode?: 'dark' | 'amoled' | 'light' | 'system'
) {
  const isAmoled = themeMode === 'amoled';

  if (isAmoled) {
    Colors.bg = '#000000';
    Colors.bgCard = '#0A0A0E';
    Colors.bgElevated = '#14141A';
    Colors.bgSurface = '#1C1C24';
    Colors.border = '#1E1E28';
  } else {
    Colors.bg = '#0A0A0F';
    Colors.bgCard = '#12121A';
    Colors.bgElevated = '#1A1A26';
    Colors.bgSurface = '#222235';
    Colors.border = '#252535';
  }

  if (accentColor) {
    Colors.accent = accentColor;
    Colors.accentLight = getLighterShade(accentColor);
    Colors.accentGlow = `${accentColor}35`;
  }
}

export function getLighterShade(hex: string): string {
  switch (hex.toUpperCase()) {
    case '#3B82F6':
      return '#60A5FA';
    case '#10B981':
      return '#34D399';
    case '#F97316':
      return '#FB923C';
    case '#EC4899':
      return '#F472B6';
    case '#7C3AED':
    default:
      return '#A855F7';
  }
}
