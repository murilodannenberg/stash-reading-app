// App palette — UI chrome (não confundir com temas de leitura)
export const palette = {
  // Brand
  primary: '#6366f1',   // indigo
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
