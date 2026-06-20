import { ReadingPreferences } from '../types';

// Temas de leitura — design system §10
// Valores derivados de ReadingThemes.ts; linkColor para tagsStyles.a
export const READING_THEMES = {
  papel: {
    label:           'Papel',
    backgroundColor: '#FAF8F5',
    textColor:       '#1C1917',
    linkColor:       '#C97B4B', // Âmbar
  },
  sepia: {
    label:           'Sépia',
    backgroundColor: '#F5ECD7',
    textColor:       '#3B2E1A',
    linkColor:       '#A0621A',
  },
  escuro: {
    label:           'Escuro',
    backgroundColor: '#1A1916',
    textColor:       '#E8E3DA',
    linkColor:       '#E09A6A',
  },
} as const;

export type ReadingThemeKey = keyof typeof READING_THEMES;

// Fontes disponíveis para o usuário no leitor
export const FONT_FAMILIES = {
  'Georgia':     'Georgia',
  'System':      'System',
  'Merriweather': 'Merriweather',
} as const;

export type FontFamilyKey = keyof typeof FONT_FAMILIES;

export const DEFAULT_READING_PREFS: ReadingPreferences = {
  fontSize:        17,
  fontFamily:      'Georgia',                              // serif como padrão — design system §3
  backgroundColor: READING_THEMES.papel.backgroundColor,
  textColor:       READING_THEMES.papel.textColor,
  lineHeight:      1.7,
};
