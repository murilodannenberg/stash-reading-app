// App palette — UI chrome (não confundir com temas de leitura)
export const palette = {
  // Brand
  primary: '#6366f1',   // indigo
  primaryLight: '#a5b4fc',
  primaryDark: '#4f46e5',
  accent: '#f59e0b',    // amber

  // Neutrals
  white: '#ffffff',
  black: '#000000',
  gray50:  '#f9fafb',
  gray100: '#f3f4f6',
  gray200: '#e5e7eb',
  gray300: '#d1d5db',
  gray400: '#9ca3af',
  gray500: '#6b7280',
  gray600: '#4b5563',
  gray700: '#374151',
  gray800: '#1f2937',
  gray900: '#111827',

  // Semantic
  danger:  '#ef4444',
  success: '#22c55e',
  warning: '#f59e0b',
} as const;

// Spacing scale (4px base)
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
} as const;

// Border radius
export const radius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  full: 9999,
} as const;

// Typography
export const typography = {
  title: { fontSize: 22, fontWeight: '700' as const, letterSpacing: -0.3 },
  heading: { fontSize: 18, fontWeight: '700' as const, letterSpacing: -0.2 },
  subheading: { fontSize: 15, fontWeight: '600' as const },
  body: { fontSize: 15, fontWeight: '400' as const },
  caption: { fontSize: 13, fontWeight: '400' as const },
  label: { fontSize: 12, fontWeight: '600' as const, textTransform: 'uppercase' as const, letterSpacing: 0.5 },
} as const;

// Light theme (app chrome)
export const lightTheme = {
  background: palette.white,
  surface: palette.gray50,
  border: palette.gray200,
  text: palette.gray900,
  textSecondary: palette.gray500,
  primary: palette.primary,
  tabBar: palette.white,
  header: palette.white,
} as const;

// Dark theme (app chrome)
export const darkTheme = {
  background: palette.gray900,
  surface: palette.gray800,
  border: palette.gray700,
  text: palette.white,
  textSecondary: palette.gray400,
  primary: palette.primary,
  tabBar: palette.gray900,
  header: palette.gray900,
} as const;

export type AppTheme = typeof lightTheme;

// Accent colors for user customization
export const ACCENT_COLORS = [
  '#6366f1', // indigo (default)
  '#3b82f6', // blue
  '#06b6d4', // cyan
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ef4444', // red
  '#ec4899', // pink
  '#8b5cf6', // violet
] as const;

// Home / app chrome themes
export const HOME_THEMES = {
  light: {
    label: 'Claro',
    background: '#f9fafb',
    surface: '#ffffff',
    text: '#111827',
    textSecondary: '#6b7280',
    textMuted: '#9ca3af',
    border: '#e5e7eb',
    inputBg: '#f3f4f6',
  },
  cream: {
    label: 'Creme',
    background: '#faf5ed',
    surface: '#fffdf8',
    text: '#3d2b1f',
    textSecondary: '#6b5d4f',
    textMuted: '#9c8e7f',
    border: '#e8ddd0',
    inputBg: '#f5efe5',
  },
  dark: {
    label: 'Escuro',
    background: '#1a1a2e',
    surface: '#252547',
    text: '#e2e8f0',
    textSecondary: '#94a3b8',
    textMuted: '#64748b',
    border: '#334155',
    inputBg: '#1e293b',
  },
  black: {
    label: 'Preto',
    background: '#000000',
    surface: '#111111',
    text: '#e2e8f0',
    textSecondary: '#94a3b8',
    textMuted: '#64748b',
    border: '#222222',
    inputBg: '#111111',
  },
} as const;

export type HomeThemeKey = keyof typeof HOME_THEMES;
export type HomeThemeColors = typeof HOME_THEMES[HomeThemeKey];
