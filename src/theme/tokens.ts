// Design System tokens — source of truth: docs/design_system.md §13
// Toda cor, espaçamento e raio deve vir daqui. Não usar valores avulsos.

export const Colors = {
  papel:       '#FAF8F5',
  pergaminho:  '#EDE9E3',
  cinzaTerra:  '#9B9189',
  tinta:       '#1C1917',
  ambar:       '#C97B4B',
  musgo:       '#3B6D11',
  // highlight backgrounds
  hlAmarelo:   '#FEF3C7',
  hlCoral:     '#FDE8DF',
  hlVerde:     '#E0F2EE',
  hlRoxo:      '#EEEDFE',
} as const;

export const TagColors = {
  ambarClaro:  { bg: '#FDF0E0', text: '#A0621A' },
  tealClaro:   { bg: '#E0F2EE', text: '#0F7B5C' },
  coralClaro:  { bg: '#FAEAE5', text: '#B84B25' },
  neutro:      { bg: '#EDE9E3', text: '#6B6560' },
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const Radius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

export const FontSize = {
  micro: 11,
  caption: 13,
  body: 15,
  subtitle: 15,
  title: 20,
  display: 28,
} as const;

export const FontWeight = {
  regular: '400' as const,
  medium:  '500' as const,
  semibold:'600' as const,
  bold:    '700' as const,
};
