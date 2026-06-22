import React from 'react';
import { Text } from 'react-native';
import { useAppThemeStore } from '../stores/appThemeStore';
import { resolveFontFamily } from '../theme/fonts';

// Applies the chosen app-wide UI font by injecting a base fontFamily into every
// <Text>. It's a no-op while the default ('system') is selected, so default users
// are unaffected. Components that set an explicit fontFamily (e.g. Georgia headers)
// keep it, since the base style sits *under* the component's own style.

let installed = false;
let currentFamily: string | undefined;

export function installGlobalFont(): void {
  if (installed) return;
  installed = true;

  currentFamily = resolveFontFamily(useAppThemeStore.getState().prefs.appFont);
  useAppThemeStore.subscribe((state) => {
    currentFamily = resolveFontFamily(state.prefs.appFont);
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const TextAny = Text as any;
  const originalRender = TextAny.render;
  if (typeof originalRender !== 'function') return;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  TextAny.render = function patchedRender(...args: any[]) {
    const element = originalRender.apply(this, args);
    if (!currentFamily || !element) return element;
    return React.cloneElement(element, {
      style: [{ fontFamily: currentFamily }, element.props?.style],
    });
  };
}
