import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity,
  ActivityIndicator, ScrollView, Alert,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { IconLink, IconEdit, IconCloudDownload } from '@tabler/icons-react-native';
import { createArticle } from '../database';
import { fetchAndParse } from '../services/articleParser';
import { downloadCoverImage } from '../services/imageStorage';
import { useAppThemeStore, getHomeColors } from '../stores/appThemeStore';
import { RootStackParamList } from '../types';
import { spacing, radius, typography } from '../theme/colors';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'AddArticle'>;

export function AddArticleScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const folderId = route.params?.folderId ?? null;
  const sharedUrl = route.params?.sharedUrl ?? null;

  const [url, setUrl] = useState(sharedUrl ?? '');
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const { prefs: appTheme } = useAppThemeStore();
  const colors = getHomeColors(appTheme.homeTheme);
  const accent = appTheme.accentColor;
  const [mode, setMode] = useState<'url' | 'manual'>('url');

  const handleSaveManual = useCallback(async () => {
    if (!title.trim()) {
      Alert.alert('Titulo obrigatorio', 'Informe um titulo para o artigo.');
      return;
    }
    setLoading(true);
    try {
      await createArticle({
        title: title.trim(),
        url: url.trim() || null,
        content_html: null,
        content_text: null,
        author: null,
        published_at: null,
        cover_image_path: null,
        reading_time_min: null,
        folder_id: folderId,
      });
      navigation.goBack();
    } catch {
      Alert.alert('Erro', 'Nao foi possivel salvar o artigo.');
    } finally {
      setLoading(false);
    }
  }, [title, url, folderId, navigation]);

  const doSaveUrl = useCallback(async (rawUrl: string) => {
    const trimmed = rawUrl.trim();
    if (!trimmed) {
      Alert.alert('URL obrigatoria', 'Informe uma URL valida.');
      return;
    }
    if (!/^https?:\/\/.+/i.test(trimmed)) {
      Alert.alert('URL invalida', 'A URL deve comecar com http:// ou https://');
      return;
    }
    setLoading(true);
    try {
      const parsed = await fetchAndParse(trimmed);
      const article = await createArticle({
        title: parsed.title,
        url: trimmed,
        content_html: parsed.content_html,
        content_text: parsed.content_text,
        author: parsed.author,
        published_at: null,
        cover_image_path: null,
        reading_time_min: parsed.reading_time_min,
        folder_id: folderId,
      });
      if (parsed.cover_image_url) {
        downloadCoverImage(parsed.cover_image_url, article.id).then((localPath) => {
          if (localPath) {
            import('../database').then(({ updateArticleCover }) => {
              updateArticleCover(article.id, localPath);
            });
          }
        });
      }
      navigation.goBack();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Erro desconhecido ao processar a URL.';
      Alert.alert('Erro ao salvar', msg);
    } finally {
      setLoading(false);
    }
  }, [folderId, navigation]);

  // Auto-salva quando a tela é aberta via share intent
  useEffect(() => {
    if (sharedUrl) doSaveUrl(sharedUrl);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSaveUrl = useCallback(() => doSaveUrl(url), [url, doSaveUrl]);

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} keyboardShouldPersistTaps="handled">
      {/* Mode toggle */}
      <View style={[styles.toggleRow, { backgroundColor: colors.inputBg }]}>
        <TouchableOpacity
          style={[styles.toggleBtn, mode === 'url' && [styles.toggleBtnActive, { backgroundColor: colors.surface }]]}
          onPress={() => setMode('url')}
          activeOpacity={0.7}
        >
          <IconLink
            size={16}
            color={mode === 'url' ? accent : colors.textMuted}
            strokeWidth={1.75}
            style={styles.toggleIcon}
          />
          <Text style={[styles.toggleText, { color: colors.textMuted }, mode === 'url' && { color: accent }]}>
            Por URL
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleBtn, mode === 'manual' && [styles.toggleBtnActive, { backgroundColor: colors.surface }]]}
          onPress={() => setMode('manual')}
          activeOpacity={0.7}
        >
          <IconEdit
            size={16}
            color={mode === 'manual' ? accent : colors.textMuted}
            strokeWidth={1.75}
            style={styles.toggleIcon}
          />
          <Text style={[styles.toggleText, { color: colors.textMuted }, mode === 'manual' && { color: accent }]}>
            Manual
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.form}>
        {mode === 'url' ? (
          <>
            <Text style={[styles.label, { color: colors.textSecondary }]}>URL do artigo</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
              placeholder="https://..."
              placeholderTextColor={colors.textMuted}
              value={url}
              onChangeText={setUrl}
              autoCapitalize="none"
              keyboardType="url"
              autoFocus
            />
            <View style={styles.hintRow}>
              <IconCloudDownload size={14} color={colors.textMuted} strokeWidth={1.5} />
              <Text style={[styles.hintText, { color: colors.textMuted }]}>
                O conteudo sera baixado e salvo localmente para leitura offline.
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.saveBtn, { backgroundColor: accent }, loading && styles.saveBtnDisabled]}
              onPress={handleSaveUrl}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <View style={styles.loadingRow}>
                  <ActivityIndicator color="#fff" size="small" />
                  <Text style={styles.saveBtnText}>  Baixando...</Text>
                </View>
              ) : (
                <Text style={styles.saveBtnText}>Salvar artigo</Text>
              )}
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Titulo *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
              placeholder="Titulo do artigo"
              placeholderTextColor={colors.textMuted}
              value={title}
              onChangeText={setTitle}
              autoFocus
            />
            <Text style={[styles.label, { color: colors.textSecondary }]}>URL (opcional)</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
              placeholder="https://..."
              placeholderTextColor={colors.textMuted}
              value={url}
              onChangeText={setUrl}
              autoCapitalize="none"
              keyboardType="url"
            />
            <TouchableOpacity
              style={[styles.saveBtn, { backgroundColor: accent }, loading && styles.saveBtnDisabled]}
              onPress={handleSaveManual}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.saveBtnText}>Salvar</Text>
              }
            </TouchableOpacity>
          </>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  toggleRow: {
    flexDirection: 'row', margin: spacing.lg, gap: spacing.xs,
    borderRadius: radius.md, padding: 3,
  },
  toggleBtn: {
    flex: 1, flexDirection: 'row',
    paddingVertical: 10, borderRadius: radius.sm,
    alignItems: 'center', justifyContent: 'center',
  },
  toggleBtnActive: { elevation: 1, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4 },
  toggleIcon: { marginRight: 6 },
  toggleText: { ...typography.subheading },
  form: { paddingHorizontal: spacing.lg },
  label: { ...typography.caption, fontWeight: '600', marginBottom: 6, marginTop: spacing.xs },
  input: {
    borderWidth: 1,
    borderRadius: radius.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
    fontSize: 15, marginBottom: spacing.lg,
  },
  hintRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: spacing.xl,
  },
  hintText: { ...typography.caption, flex: 1 },
  saveBtn: {
    borderRadius: radius.lg,
    paddingVertical: 14, alignItems: 'center', marginTop: spacing.sm,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  loadingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
});
