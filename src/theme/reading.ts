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

// Fontes disponíveis para o usuário no leitor.
// Usamos nomes genéricos do React Native ('serif', 'monospace') que funcionam
// no Android (Noto Serif, Droid Mono) e iOS (Georgia, Courier) sem precisar
// carregar fontes externas.
export const FONT_FAMILIES: Record<string, { label: string; value: string | undefined }> = {
  'System':  { label: 'Padrão',   value: undefined },   // Roboto (Android) / SF Pro (iOS)
  'Serif':   { label: 'Serifada', value: 'serif' },     // Noto Serif (Android) / Georgia (iOS)
  'Mono':    { label: 'Mono',     value: 'monospace' }, // Droid Mono (Android) / Courier (iOS)
};

export type FontFamilyKey = keyof typeof FONT_FAMILIES;

export const DEFAULT_READING_PREFS: ReadingPreferences = {
  fontSize:        17,
  fontFamily:      'Serif',                              // serif como padrão — design system §3
  backgroundColor: READING_THEMES.papel.backgroundColor,
  textColor:       READING_THEMES.papel.textColor,
  lineHeight:      1.7,
};
