// App palette — UI chrome
// Fonte de verdade: docs/DESIGN_SYSTEM.md §2
// Não usar valores avulsos fora daqui; usar tokens.ts para valores semânticos.

export const palette = {
  // Acento único — Âmbar
  primary:      '#C97B4B',
  primaryLight: '#E09A6A',
  primaryDark:  '#A0621A',

  // Base
  white: '#ffffff',
  black: '#1C1917', // Nunca preto puro — usar Tinta

  // Escala neutra mapeada ao design system (tons quentes, não azul-cinza)
  gray50:  '#FAF8F5', // Papel
  gray100: '#F0ECE6',
  gray200: '#EDE9E3', // Pergaminho
  gray300: '#D5CFC8',
  gray400: '#9B9189', // Cinza-terra
  gray500: '#6B6560',
  gray600: '#4A4540',
  gray700: '#3A3530',
  gray800: '#2A2520',
  gray900: '#1C1917', // Tinta

  // Semântico
  danger:  '#ef4444',
  success: '#22c55e',
  warning: '#C97B4B',
} as const;

// Spacing scale (8pt base — design system §5)
export const spacing = {
  xs:   4,
  sm:   8,
  md:   12,
  lg:   16,
  xl:   24,
  '2xl': 32,
  '3xl': 40,
} as const;

// Border radius
export const radius = {
  xs:   4,
  sm:   8,
  md:   12,
  lg:   16,
  xl:   24,
  full: 9999,
} as const;

// Typography tokens
export const typography = {
  title:      { fontSize: 20, fontWeight: '600' as const, letterSpacing: -0.2 },
  heading:    { fontSize: 18, fontWeight: '600' as const, letterSpacing: -0.2 },
  subheading: { fontSize: 15, fontWeight: '500' as const },
  body:       { fontSize: 15, fontWeight: '400' as const },
  caption:    { fontSize: 13, fontWeight: '400' as const },
  label:      { fontSize: 12, fontWeight: '500' as const, textTransform: 'uppercase' as const, letterSpacing: 0.5 },
} as const;

// Acento padrão do app
export const ACCENT_COLOR = palette.primary;

// Mantido para compatibilidade com SettingsScreen (array de um item = acento único)
export const ACCENT_COLORS = [palette.primary] as const;

// Temas da interface — derivados da paleta do design system
export const HOME_THEMES = {
  papel: {
    label:         'Papel',
    background:    '#FAF8F5',
    surface:       '#FFFFFF',
    text:          '#1C1917',
    textSecondary: '#6B6560',
    textMuted:     '#9B9189',
    border:        '#EDE9E3',
    inputBg:       '#F0ECE6',
  },
  sepia: {
    label:         'Sépia',
    background:    '#F5ECD7',
    surface:       '#FBF5E8',
    text:          '#3B2E1A',
    textSecondary: '#6B5040',
    textMuted:     '#9B8070',
    border:        '#E2D5C0',
    inputBg:       '#EEE3CE',
  },
  escuro: {
    label:         'Escuro',
    background:    '#1A1916',
    surface:       '#252420',
    text:          '#E8E3DA',
    textSecondary: '#9B9189',
    textMuted:     '#6B6560',
    border:        '#2E2C28',
    inputBg:       '#201E1C',
  },
} as const;

export type HomeThemeKey = keyof typeof HOME_THEMES;
export type HomeThemeColors = typeof HOME_THEMES[HomeThemeKey];
