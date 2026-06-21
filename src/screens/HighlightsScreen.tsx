import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { IconHighlight } from '@tabler/icons-react-native';
import { useAppThemeStore, getHomeColors } from '../stores/appThemeStore';
import { spacing, typography } from '../theme/colors';

export function HighlightsScreen() {
  const { prefs } = useAppThemeStore();
  const colors = getHomeColors(prefs.homeTheme);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.empty}>
        <IconHighlight size={52} color={colors.border} strokeWidth={1.5} />
        <Text style={[styles.title, { color: colors.textSecondary }]}>Destaques</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>
          Marque trechos enquanto lê.{'\n'}Eles aparecerão aqui.
        </Text>
        <Text style={[styles.badge, { color: colors.textMuted, borderColor: colors.border }]}>
          Em breve — v0.4
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  empty: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  title: { ...typography.heading, marginTop: spacing.lg },
  subtitle: {
    ...typography.body, textAlign: 'center',
    marginTop: spacing.sm, lineHeight: 22,
  },
  badge: {
    marginTop: spacing.xl,
    fontSize: 12, fontWeight: '500',
    paddingHorizontal: spacing.md, paddingVertical: 4,
    borderRadius: 99, borderWidth: 1,
  },
});
