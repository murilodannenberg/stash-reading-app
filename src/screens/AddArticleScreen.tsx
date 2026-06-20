import React, { useState, useCallback } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity,
  ActivityIndicator, ScrollView, Alert,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { createArticle } from '../database';
import { fetchAndParse } from '../services/articleParser';
import { RootStackParamList } from '../types';
import { palette } from '../theme/colors';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'AddArticle'>;

export function AddArticleScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const folderId = route.params?.folderId ?? null;

  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'url' | 'manual'>('url');

  const handleSaveManual = useCallback(async () => {
    if (!title.trim()) {
      Alert.alert('Título obrigatório', 'Informe um título para o artigo.');
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
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível salvar o artigo.');
    } finally {
      setLoading(false);
    }
  }, [title, url, folderId, navigation]);

  const handleSaveUrl = useCallback(async () => {
    const trimmed = url.trim();
    if (!trimmed) {
      Alert.alert('URL obrigatória', 'Informe uma URL válida.');
      return;
    }
    if (!/^https?:\/\/.+/i.test(trimmed)) {
      Alert.alert('URL inválida', 'A URL deve começar com http:// ou https://');
      return;
    }
    setLoading(true);
    try {
      const parsed = await fetchAndParse(trimmed);
      await createArticle({
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
      navigation.goBack();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Erro desconhecido ao processar a URL.';
      Alert.alert('Erro ao salvar', msg);
    } finally {
      setLoading(false);
    }
  }, [url, folderId, navigation]);

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.modeRow}>
        <TouchableOpacity
          style={[styles.modeBtn, mode === 'url' && styles.modeBtnActive]}
          onPress={() => setMode('url')}
        >
          <Text style={[styles.modeBtnText, mode === 'url' && styles.modeBtnTextActive]}>
            Por URL
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.modeBtn, mode === 'manual' && styles.modeBtnActive]}
          onPress={() => setMode('manual')}
        >
          <Text style={[styles.modeBtnText, mode === 'manual' && styles.modeBtnTextActive]}>
            Manual
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.form}>
        {mode === 'url' ? (
          <>
            <Text style={styles.label}>URL do artigo</Text>
            <TextInput
              style={styles.input}
              placeholder="https://..."
              value={url}
              onChangeText={setUrl}
              autoCapitalize="none"
              keyboardType="url"
              autoFocus
            />
            <Text style={styles.hint}>
              O conteúdo será baixado e salvo localmente para leitura offline.
            </Text>
            <TouchableOpacity
              style={[styles.saveBtn, loading && styles.saveBtnDisabled]}
              onPress={handleSaveUrl}
              disabled={loading}
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.saveBtnText}>Salvar artigo</Text>
              }
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.label}>Título *</Text>
            <TextInput
              style={styles.input}
              placeholder="Título do artigo"
              value={title}
              onChangeText={setTitle}
              autoFocus
            />
            <Text style={styles.label}>URL (opcional)</Text>
            <TextInput
              style={styles.input}
              placeholder="https://..."
              value={url}
              onChangeText={setUrl}
              autoCapitalize="none"
              keyboardType="url"
            />
            <TouchableOpacity
              style={[styles.saveBtn, loading && styles.saveBtnDisabled]}
              onPress={handleSaveManual}
              disabled={loading}
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
  container: { flex: 1, backgroundColor: '#f9fafb' },
  modeRow: {
    flexDirection: 'row', margin: 16, gap: 8,
    backgroundColor: '#e5e7eb', borderRadius: 10, padding: 3,
  },
  modeBtn: {
    flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center',
  },
  modeBtnActive: { backgroundColor: '#fff' },
  modeBtnText: { fontSize: 14, fontWeight: '500', color: '#6b7280' },
  modeBtnTextActive: { color: '#111827' },
  form: { paddingHorizontal: 16 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6, marginTop: 4 },
  input: {
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb',
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, color: '#111827', marginBottom: 16,
  },
  hint: { fontSize: 13, color: '#6b7280', marginBottom: 20, lineHeight: 18 },
  saveBtn: {
    backgroundColor: palette.primary, borderRadius: 12,
    paddingVertical: 14, alignItems: 'center', marginTop: 8,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
