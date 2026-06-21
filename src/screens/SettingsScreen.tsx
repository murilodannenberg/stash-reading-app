import React, { useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { IconCheck, IconShieldCheck, IconBrandGithub, IconHeart, IconHighlight, IconChevronRight } from '@tabler/icons-react-native';
import { useAppThemeStore, getHomeColors } from '../stores/appThemeStore';
import {
  HOME_THEMES, HomeThemeKey,
  spacing, radius, typography,
} from '../theme/colors';
import { Colors } from '../theme/tokens';
import { RootStackParamList } from '../types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function SettingsScreen() {
  const { prefs, _hydrate, setHomeTheme } = useAppThemeStore();
  const colors = getHomeColors(prefs.homeTheme);
  const accent = prefs.accentColor;
  const navigation = useNavigation<Nav>();

  useEffect(() => { _hydrate(); }, [_hydrate]);

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Logo */}
      <View style={styles.logoSection}>
        <View style={[styles.logoMark, { backgroundColor: accent + '18', borderColor: accent + '40' }]}>
          <Text style={[styles.logoText, { color: accent }]}>S</Text>
        </View>
        <Text style={[styles.appName, { color: colors.text }]}>Stash</Text>
        <Text style={[styles.appVersion, { color: colors.textMuted }]}>v0.4.0</Text>
      </View>

      {/* Tema da interface */}
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
                    borderColor: isActive ? accent : t.border,
                    borderWidth: isActive ? 2 : 1,
                  },
                ]}
                onPress={() => setHomeTheme(key)}
              >
                {/* Miniatura de texto */}
                <View style={[styles.themeSwatch, { borderColor: t.border }]}>
                  <View style={[styles.themeSwatchLine, { backgroundColor: t.text, width: '70%' }]} />
                  <View style={[styles.themeSwatchLine, { backgroundColor: t.textMuted, width: '50%', marginTop: 3 }]} />
                </View>
                <Text style={[styles.themeBtnLabel, { color: t.text }]}>{t.label}</Text>
                {isActive && (
                  <View style={[styles.themeCheck, { backgroundColor: accent }]}>
                    <IconCheck size={10} color="#fff" strokeWidth={2.5} />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Conteúdo */}
      <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
        Conteúdo
      </Text>
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <TouchableOpacity
          style={styles.menuRow}
          onPress={() => navigation.navigate('Highlights')}
          activeOpacity={0.7}
        >
          <IconHighlight size={18} color={colors.textMuted} strokeWidth={1.5} />
          <Text style={[styles.menuText, { color: colors.textSecondary }]}>
            Meus destaques
          </Text>
          <IconChevronRight size={16} color={colors.textMuted} strokeWidth={1.5} />
        </TouchableOpacity>
      </View>

      {/* Sobre */}
      <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
        Sobre
      </Text>
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.aboutRow}>
          <IconShieldCheck size={18} color={colors.textMuted} strokeWidth={1.5} />
          <Text style={[styles.aboutText, { color: colors.textSecondary }]}>
            100% offline, sem rastreamento
          </Text>
        </View>
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <View style={styles.aboutRow}>
          <IconBrandGithub size={18} color={colors.textMuted} strokeWidth={1.5} />
          <Text style={[styles.aboutText, { color: colors.textSecondary }]}>
            Open source — stash-reading-app
          </Text>
        </View>
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <View style={styles.aboutRow}>
          <IconHeart size={18} color={Colors.ambar} strokeWidth={1.5} />
          <Text style={[styles.aboutText, { color: colors.textSecondary }]}>
            Feito com carinho, sem anúncios
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
  logoMark: {
    width: 72, height: 72, borderRadius: radius.xl,
    borderWidth: 1.5,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: spacing.md,
  },
  logoText: { fontSize: 34, fontWeight: '700', letterSpacing: -1 },
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

  // Theme buttons
  themeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  themeBtn: {
    flex: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
    position: 'relative',
  },
  themeSwatch: {
    width: '100%', height: 36,
    borderRadius: radius.sm,
    borderWidth: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.sm,
  },
  themeSwatchLine: {
    height: 3, borderRadius: 2,
  },
  themeBtnLabel: { fontSize: 12, fontWeight: '500' },
  themeCheck: {
    position: 'absolute', top: 6, right: 6,
    width: 16, height: 16, borderRadius: 8,
    justifyContent: 'center', alignItems: 'center',
  },

  // Menu rows
  menuRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: spacing.sm, paddingVertical: spacing.sm,
  },
  menuText: { ...typography.body, flex: 1 },

  // Divider
  divider: { height: 1, marginVertical: spacing.xs },

  // About
  aboutRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: spacing.sm, paddingVertical: spacing.sm,
  },
  aboutText: { ...typography.body, flex: 1 },
});
