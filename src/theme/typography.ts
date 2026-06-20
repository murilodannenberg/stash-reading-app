// Design System typography — source of truth: docs/design_system.md §3
import { TextStyle } from 'react-native';
import { FontSize, FontWeight } from './tokens';

// Famílias: serif nativo (Georgia) para display/body leitura,
// sans-serif nativo (System) para UI.

export const Type: Record<string, TextStyle> = {
  display: {
    fontFamily: 'Georgia',
    fontSize: FontSize.display,
    fontWeight: FontWeight.bold,
    lineHeight: FontSize.display * 1.2,
  },
  title: {
    fontSize: FontSize.title,
    fontWeight: FontWeight.semibold,
    lineHeight: FontSize.title * 1.3,
  },
  subtitle: {
    fontSize: FontSize.subtitle,
    fontWeight: FontWeight.medium,
    lineHeight: FontSize.subtitle * 1.4,
  },
  body: {
    fontFamily: 'Georgia',
    fontSize: FontSize.body,
    fontWeight: FontWeight.regular,
    lineHeight: FontSize.body * 1.7,
  },
  bodyUi: {
    fontSize: FontSize.body,
    fontWeight: FontWeight.regular,
    lineHeight: FontSize.body * 1.6,
  },
  caption: {
    fontSize: FontSize.caption,
    fontWeight: FontWeight.regular,
    lineHeight: FontSize.caption * 1.4,
  },
  label: {
    fontSize: 12,
    fontWeight: FontWeight.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    lineHeight: 16,
  },
  micro: {
    fontSize: FontSize.micro,
    fontWeight: FontWeight.regular,
    lineHeight: FontSize.micro * 1.3,
  },
} as const;
