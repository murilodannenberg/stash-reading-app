import { ReadingPreferences } from '../types';

// Temas de leitura (fundo do artigo)
export const READING_THEMES = {
  light: {
    label: 'Claro',
    backgroundColor: '#ffffff',
    textColor: '#111827',
  },
  sepia: {
    label: 'Sépia',
    backgroundColor: '#f5f0e8',
    textColor: '#3d2b1f',
  },
  dark: {
    label: 'Escuro',
    backgroundColor: '#1a1a2e',
    textColor: '#e2e8f0',
  },
  black: {
    label: 'Preto',
    backgroundColor: '#000000',
    textColor: '#e2e8f0',
  },
} as const;

export type ReadingThemeKey = keyof typeof READING_THEMES;

export const FONT_FAMILIES = {
  'System': '-apple-system, "Helvetica Neue", sans-serif',
  'Georgia': 'Georgia, serif',
  'Times New Roman': '"Times New Roman", Times, serif',
} as const;

export type FontFamilyKey = keyof typeof FONT_FAMILIES;

export const DEFAULT_READING_PREFS: ReadingPreferences = {
  fontSize: 17,
  fontFamily: 'System',
  backgroundColor: READING_THEMES.light.backgroundColor,
  textColor: READING_THEMES.light.textColor,
  lineHeight: 1.7,
};
