// Design System reading themes — source of truth: docs/design_system.md §10
// Estes temas controlam apenas a tela de leitura, não o chrome da UI.

export interface ReadingThemeConfig {
  label: string;
  backgroundColor: string;
  textColor: string;
  linkColor: string;
}

export const ReadingThemes: Record<string, ReadingThemeConfig> = {
  papel: {
    label: 'Papel',
    backgroundColor: '#FAF8F5',
    textColor: '#1C1917',
    linkColor: '#C97B4B',
  },
  sepia: {
    label: 'Sépia',
    backgroundColor: '#F5ECD7',
    textColor: '#3B2E1A',
    linkColor: '#A0621A',
  },
  escuro: {
    label: 'Escuro',
    backgroundColor: '#1A1916',
    textColor: '#E8E3DA',
    linkColor: '#E09A6A',
  },
} as const;

export type ReadingThemeKey = keyof typeof ReadingThemes;
