import React from 'react';
import { Text } from 'react-native';
import { useAppThemeStore } from '../stores/appThemeStore';
import { resolveFontFamily } from '../theme/fonts';

// Applies the chosen app-wide UI font by injecting a base fontFamily into every
// <Text>. RN 0.85's Text is a `component(...)` (not forwardRef), so we can't patch
// Text.render — instead we wrap the JSX factories that every <Text> goes through
// (automatic runtime jsx/jsxs, the dev runtime, and the classic createElement).
// The base style sits *under* the element's own style, so explicit fontFamily
// (e.g. Georgia headers) still wins. No-op while the default ('system') is chosen.

let installed = false;
let currentFamily: string | undefined;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function withFont(props: any): any {
  if (!currentFamily) return props;
  if (!props) return { style: { fontFamily: currentFamily } };
  return { ...props, style: [{ fontFamily: currentFamily }, props.style] };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function patchFactory(mod: any, keys: string[]): void {
  if (!mod) return;
  for (const key of keys) {
    const orig = mod[key];
    if (typeof orig !== 'function') continue;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const wrapped = function (this: unknown, type: any, props: any, ...rest: any[]) {
      return orig.call(this, type, type === Text ? withFont(props) : props, ...rest);
    };
    try {
      mod[key] = wrapped;
    } catch {
      try { Object.defineProperty(mod, key, { value: wrapped, configurable: true, writable: true }); } catch {}
    }
  }
}

export function installGlobalFont(): void {
  if (installed) return;
  installed = true;

  currentFamily = resolveFontFamily(useAppThemeStore.getState().prefs.appFont);
  useAppThemeStore.subscribe((state) => {
    currentFamily = resolveFontFamily(state.prefs.appFont);
  });

  // Automatic JSX runtime (what most app code compiles to).
  try { patchFactory(require('react/jsx-runtime'), ['jsx', 'jsxs']); } catch {}
  // Dev JSX runtime (dev builds).
  try { patchFactory(require('react/jsx-dev-runtime'), ['jsxDEV']); } catch {}

  // Classic runtime fallback (libraries still using React.createElement).
  const origCreateElement = React.createElement;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (React as any).createElement = function (type: any, props: any, ...children: any[]) {
    return origCreateElement.apply(React, [type, type === Text ? withFont(props) : props, ...children]);
  };
}
