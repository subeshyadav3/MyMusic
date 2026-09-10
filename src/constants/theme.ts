import { useMemo } from 'react';
import { useMusicStore } from '../store/useMusicStore';
import { ColorTheme, Colors, getLighterShade } from './colors';

export function getThemeColors(accentColor = '#7C3AED', themeMode: string = 'dark'): ColorTheme {
  const isAmoled = themeMode === 'amoled';
  return {
    ...Colors,
    bg: isAmoled ? '#000000' : '#0A0A0F',
    bgCard: isAmoled ? '#0A0A0E' : '#12121A',
    bgElevated: isAmoled ? '#14141A' : '#1A1A26',
    bgSurface: isAmoled ? '#1C1C24' : '#222235',
    border: isAmoled ? '#1E1E28' : '#252535',
    accent: accentColor,
    accentLight: getLighterShade(accentColor),
    accentGlow: `${accentColor}35`,
  };
}

/** Reactive theme hook — subscribes to settings so accent/AMOLED apply instantly. */
export function useThemeColors(): ColorTheme {
  const accentColor = useMusicStore(s => s.settings.accentColor);
  const themeMode = useMusicStore(s => s.settings.themeMode);
  return useMemo(() => getThemeColors(accentColor, themeMode), [accentColor, themeMode]);
}
