/** Shared X_App color palette and layout tokens. */

import '@/global.css';
import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#171717',
    background: '#F5F5F5',
    backgroundElement: '#FFFFFF',
    backgroundSelected: '#FFE2CF',
    textSecondary: '#666666',
  },
  dark: {
    text: '#F5F5F5',
    background: '#090909',
    backgroundElement: '#171717',
    backgroundSelected: '#332014',
    textSecondary: '#929292',
  },
} as const;

export const BrandColors = {
  background: '#090909',
  surface: '#171717',
  orange: '#FF7417',
  orangeSoft: '#FF9A52',
  white: '#F5F5F5',
  muted: '#929292',
  border: '#71350F',
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
