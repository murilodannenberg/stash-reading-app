import React, { useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppThemeStore, getHomeColors } from '../stores/appThemeStore';
import {
  ACCENT_COLORS, HOME_THEMES, HomeThemeKey,
  spacing, radius, typography,
} from '../theme/colors';

export function SettingsScreen() {
  const { prefs, _hydrate, setAccentColor, setHomeTheme } = useAppThemeStore();
  const colors = getHomeColors(prefs.homeTheme);

  useEffect(() => { _hydrate(); }, [_hydrate]);

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Logo placeholder */}
      <View style={styles.logoSection}>
        <View style={[styles.logoCircle, { backgroundColor: prefs.accentColor }]}>
          <Text style={styles.logoText}>S</Text>
        </View>
        <Text style={[styles.appName, { color: colors.text }]}>Stash</Text>
        <Text style={[styles.appVersion, { color: colors.textMuted }]}>v0.2.0</Text>
      </View>

      {/* Accent color */}
      <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
        Cor de destaque
      </Text>
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.colorGrid}>
          {ACCENT_COLORS.map((c) => {
            const isActive = prefs.accentColor === c;
            return (
              <TouchableOpacity
                key={c}
                style={[
                  styles.colorSwatch,
                  { backgroundColor: c },
                  isActive && styles.colorSwatchActive,
                  isActive && { borderColor: c },
                ]}
                onPress={() => setAccentColor(c)}
              >
                {isActive && (
                  <Ionicons name="checkmark" size={18} color="#fff" />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Home theme */}
      <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
        Tema da interface
      </Text>
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.themeRow}>
          {(Object.keys(HOME_THEMES) as HomeThemeKey[]).map((key) => {
            const t = HOME_THEMES[key];
            const isActive = prefs.homeTheme === key;
            return (
              <TouchableOpacity
                key={key}
                style={[
                  styles.themeBtn,
                  {
                    backgroundColor: t.background,
                    borderColor: isActive ? prefs.accentColor : colors.border,
                    borderWidth: isActive ? 2.5 : 1,
                  },
                ]}
                onPress={() => setHomeTheme(key)}
              >
                <Text style={[styles.themeBtnText, { color: t.text }]}>
                  {t.label}
                </Text>
                {isActive && (
                  <Ionicons
                    name="checkmark-circle"
                    size={16}
                    color={prefs.accentColor}
                    style={{ marginLeft: 4 }}
                  />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* About */}
      <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
        Sobre
      </Text>
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.aboutRow}>
          <Ionicons name="shield-checkmark-outline" size={18} color={colors.textMuted} />
          <Text style={[styles.aboutText, { color: colors.textSecondary }]}>
            100% offline, sem rastreamento
          </Text>
        </View>
        <View style={styles.aboutRow}>
          <Ionicons name="logo-github" size={18} color={colors.textMuted} />
          <Text style={[styles.aboutText, { color: colors.textSecondary }]}>
            Open source — stash-reading-app
          </Text>
        </View>
        <View style={styles.aboutRow}>
          <Ionicons name="heart-outline" size={18} color={colors.textMuted} />
          <Text style={[styles.aboutText, { color: colors.textSecondary }]}>
            Feito com amor, sem anuncios
          </Text>
        </View>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  // Logo
  logoSection: { alignItems: 'center', paddingTop: spacing['3xl'], paddingBottom: spacing.xl },
  logoCircle: {
    width: 72, height: 72, borderRadius: 36,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: spacing.md,
  },
  logoText: { fontSize: 32, fontWeight: '800', color: '#fff', letterSpacing: -1 },
  appName: { ...typography.title, marginBottom: 2 },
  appVersion: { ...typography.caption },

  // Sections
  sectionLabel: {
    ...typography.label,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.xl,
  },

  // Card
  card: {
    marginHorizontal: spacing.lg,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
  },

  // Accent color grid
  colorGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    gap: spacing.md, justifyContent: 'center',
  },
  colorSwatch: {
    width: 44, height: 44, borderRadius: 22,
    justifyContent: 'center', alignItems: 'center',
  },
  colorSwatchActive: {
    borderWidth: 3, borderColor: '#fff',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2, shadowRadius: 4, elevation: 4,
  },

  // Theme buttons
  themeRow: {
    flexDirection: 'row', flexWrap: 'wrap',
    gap: spacing.sm,
  },
  themeBtn: {
    flex: 1, minWidth: 70,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  themeBtnText: { fontSize: 13, fontWeight: '600' },

  // About
  aboutRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: spacing.sm, paddingVertical: spacing.sm,
  },
  aboutText: { ...typography.body, flex: 1 },
});
