import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { IconCheck, IconShieldCheck, IconBrandGithub, IconHeart, IconTags, IconChevronRight, IconDatabaseExport, IconCloudDownload, IconTrash } from '@tabler/icons-react-native';
import { AppLogo } from '../components/AppLogo';
import { useAppThemeStore, getHomeColors } from '../stores/appThemeStore';
import { useArticleStore } from '../stores/articleStore';
import { getDownloadedCount } from '../database';
import {
  HOME_THEMES, HomeThemeKey,
  spacing, radius, typography,
} from '../theme/colors';
import { APP_FONTS, AppFontKey } from '../theme/fonts';
import { Colors } from '../theme/tokens';
import { RootStackParamList } from '../types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function SettingsScreen() {
  const { prefs, _hydrate, setHomeTheme, setAppFont } = useAppThemeStore();
  const colors = getHomeColors(prefs.homeTheme);
  const accent = prefs.accentColor;
  const navigation = useNavigation<Nav>();
  const { clearAllDownloads } = useArticleStore();
  const [downloadedCount, setDownloadedCount] = useState(0);

  useEffect(() => { _hydrate(); }, [_hydrate]);

  const refreshCount = useCallback(() => {
    getDownloadedCount().then(setDownloadedCount).catch(() => {});
  }, []);
  useFocusEffect(refreshCount);

  const handleClearDownloads = useCallback(() => {
    if (downloadedCount === 0) {
      Alert.alert('Nada para limpar', 'Você não tem artigos baixados para offline.');
      return;
    }
    Alert.alert(
      'Excluir todos os downloads',
      `As imagens offline de ${downloadedCount} ${downloadedCount === 1 ? 'artigo' : 'artigos'} serão removidas. O texto continua salvo.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => { await clearAllDownloads(); refreshCount(); },
        },
      ],
    );
  }, [downloadedCount, clearAllDownloads, refreshCount]);

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Logo */}
      <View style={styles.logoSection}>
        <AppLogo size={72} />
        <Text style={[styles.appName, { color: colors.text }]}>Stash</Text>
        <Text style={[styles.appVersion, { color: colors.textMuted }]}>v1.0.0</Text>
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

      {/* Fonte do app */}
      <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
        Fonte do app
      </Text>
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.fontRow}>
          {(Object.keys(APP_FONTS) as AppFontKey[]).map((key) => {
            const isActive = prefs.appFont === key;
            return (
              <TouchableOpacity
                key={key}
                style={[
                  styles.fontBtn,
                  { borderColor: isActive ? accent : colors.border, backgroundColor: isActive ? accent + '12' : 'transparent' },
                ]}
                onPress={() => setAppFont(key)}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.fontPreview,
                  { color: isActive ? accent : colors.text, fontFamily: APP_FONTS[key].family },
                ]}>
                  Aa
                </Text>
                <Text style={[styles.fontLabel, { color: isActive ? accent : colors.textMuted }]}>
                  {APP_FONTS[key].label}
                </Text>
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
          onPress={() => navigation.navigate('Tags')}
          activeOpacity={0.7}
        >
          <IconTags size={18} color={colors.textMuted} strokeWidth={1.5} />
          <Text style={[styles.menuText, { color: colors.textSecondary }]}>
            Gerenciar tags
          </Text>
          <IconChevronRight size={16} color={colors.textMuted} strokeWidth={1.5} />
        </TouchableOpacity>
      </View>

      {/* Downloads */}
      <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
        Downloads
      </Text>
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.menuRow}>
          <IconCloudDownload size={18} color={colors.textMuted} strokeWidth={1.5} />
          <Text style={[styles.menuText, { color: colors.textSecondary }]}>
            {downloadedCount > 0
              ? `${downloadedCount} ${downloadedCount === 1 ? 'artigo salvo' : 'artigos salvos'} para offline`
              : 'Nenhum artigo baixado'}
          </Text>
        </View>
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <TouchableOpacity
          style={styles.menuRow}
          onPress={handleClearDownloads}
          activeOpacity={0.7}
        >
          <IconTrash size={18} color={downloadedCount > 0 ? Colors.ambar : colors.textMuted} strokeWidth={1.5} />
          <Text style={[styles.menuText, { color: downloadedCount > 0 ? Colors.ambar : colors.textMuted }]}>
            Excluir todos os downloads
          </Text>
        </TouchableOpacity>
      </View>

      {/* Backup */}
      <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
        Dados
      </Text>
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <TouchableOpacity
          style={styles.menuRow}
          onPress={() => navigation.navigate('Backup')}
          activeOpacity={0.7}
        >
          <IconDatabaseExport size={18} color={colors.textMuted} strokeWidth={1.5} />
          <Text style={[styles.menuText, { color: colors.textSecondary }]}>
            Backup e restauração
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
  appName: { ...typography.title, marginBottom: 2, marginTop: spacing.md },
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

  // Font picker
  fontRow: { flexDirection: 'row', gap: spacing.sm },
  fontBtn: {
    flex: 1, borderRadius: radius.md, borderWidth: 1.5,
    paddingVertical: spacing.md, alignItems: 'center', gap: 2,
  },
  fontPreview: { fontSize: 22, fontWeight: '700' },
  fontLabel: { fontSize: 12, fontWeight: '500' },

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
