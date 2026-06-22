// App-wide UI font options. Uses platform-available families (no font assets to
// bundle): the default keeps the system sans, and the others map to native families.

export const APP_FONTS = {
  system: { label: 'Sistema', family: undefined as string | undefined },
  serif:  { label: 'Serifada', family: 'serif' },
  mono:   { label: 'Mono', family: 'monospace' },
} as const;

export type AppFontKey = keyof typeof APP_FONTS;

export const DEFAULT_APP_FONT: AppFontKey = 'system';

export function resolveFontFamily(key: string | undefined): string | undefined {
  return key && key in APP_FONTS ? APP_FONTS[key as AppFontKey].family : undefined;
}
