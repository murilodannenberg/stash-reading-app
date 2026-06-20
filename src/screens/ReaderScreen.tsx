import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  ActivityIndicator, TouchableOpacity, useWindowDimensions, Modal,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import RenderHtml from 'react-native-render-html';
import { getArticleById, markAsRead } from '../database';
import { Article, RootStackParamList } from '../types';
import { useReadingPrefsStore } from '../stores/readingPrefsStore';
import { READING_THEMES, ReadingThemeKey } from '../theme/reading';
import { palette } from '../theme/colors';

type Route = RouteProp<RootStackParamList, 'Reader'>;

const FONT_SIZES = [14, 15, 16, 17, 18, 20, 22, 24];

export function ReaderScreen() {
  const route = useRoute<Route>();
  const navigation = useNavigation();
  const { articleId } = route.params;
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const { width } = useWindowDimensions();

  const { prefs, setFontSize, setTheme, _hydrate } = useReadingPrefsStore();

  useEffect(() => {
    _hydrate();
  }, [_hydrate]);

  useEffect(() => {
    getArticleById(articleId).then((a) => {
      setArticle(a);
      setLoading(false);
      if (a && !a.is_read) {
        markAsRead(articleId, true);
      }
    });
  }, [articleId]);

  const toggleSettings = useCallback(() => {
    setShowSettings((v) => !v);
  }, []);

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={toggleSettings} style={headerStyles.btn}>
          <Text style={headerStyles.btnText}>Aa</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation, toggleSettings]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={palette.primary} />
      </View>
    );
  }

  if (!article) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Artigo não encontrado.</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backLink}>Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const htmlSource = article.content_html
    ? { html: article.content_html }
    : null;

  const tagsStyles = {
    body: {
      color: prefs.textColor,
      fontSize: prefs.fontSize,
      lineHeight: prefs.fontSize * prefs.lineHeight,
      fontFamily: prefs.fontFamily === 'System' ? undefined : prefs.fontFamily,
    },
    a: { color: palette.primary },
    img: { marginVertical: 12 },
    p: { marginBottom: 12 },
    h1: { fontSize: prefs.fontSize * 1.4, fontWeight: '700' as const, marginBottom: 8 },
    h2: { fontSize: prefs.fontSize * 1.25, fontWeight: '700' as const, marginBottom: 8 },
    h3: { fontSize: prefs.fontSize * 1.1, fontWeight: '600' as const, marginBottom: 6 },
    blockquote: {
      borderLeftWidth: 3,
      borderLeftColor: '#d1d5db',
      paddingLeft: 14,
      marginLeft: 0,
      fontStyle: 'italic' as const,
      color: '#6b7280',
    },
    pre: {
      backgroundColor: prefs.backgroundColor === '#ffffff' ? '#f3f4f6' : 'rgba(255,255,255,0.08)',
      padding: 12,
      borderRadius: 8,
      overflow: 'hidden' as const,
    },
    code: { fontSize: prefs.fontSize - 2 },
  };

  return (
    <View style={[styles.container, { backgroundColor: prefs.backgroundColor }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.title, { color: prefs.textColor, fontSize: prefs.fontSize * 1.5 }]}>
          {article.title}
        </Text>
        {article.author != null && (
          <Text style={[styles.meta, { color: prefs.textColor, opacity: 0.6 }]}>
            {article.author}
          </Text>
        )}
        {article.reading_time_min != null && (
          <Text style={[styles.meta, { color: prefs.textColor, opacity: 0.5 }]}>
            {article.reading_time_min} min de leitura
          </Text>
        )}
        <View style={[styles.divider, { backgroundColor: prefs.textColor, opacity: 0.15 }]} />

        {htmlSource ? (
          <RenderHtml
            contentWidth={width - 40}
            source={htmlSource}
            tagsStyles={tagsStyles}
            enableExperimentalMarginCollapsing
          />
        ) : article.content_text ? (
          <Text style={[styles.body, { color: prefs.textColor, fontSize: prefs.fontSize, lineHeight: prefs.fontSize * prefs.lineHeight }]}>
            {article.content_text}
          </Text>
        ) : (
          <View style={styles.emptyContent}>
            <Text style={[styles.emptyText, { color: prefs.textColor }]}>
              Este artigo foi salvo sem conteúdo.
            </Text>
            {article.url != null && (
              <Text style={styles.urlText}>URL: {article.url}</Text>
            )}
          </View>
        )}
      </ScrollView>

      <Modal
        visible={showSettings}
        transparent
        animationType="slide"
        onRequestClose={toggleSettings}
      >
        <TouchableOpacity style={settingsStyles.overlay} activeOpacity={1} onPress={toggleSettings}>
          <View style={settingsStyles.panel}>
            <Text style={settingsStyles.heading}>Tamanho da fonte</Text>
            <View style={settingsStyles.row}>
              {FONT_SIZES.map((size) => (
                <TouchableOpacity
                  key={size}
                  style={[
                    settingsStyles.sizeBtn,
                    prefs.fontSize === size && settingsStyles.sizeBtnActive,
                  ]}
                  onPress={() => setFontSize(size)}
                >
                  <Text style={[
                    settingsStyles.sizeBtnText,
                    prefs.fontSize === size && settingsStyles.sizeBtnTextActive,
                  ]}>
                    {size}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={settingsStyles.heading}>Tema</Text>
            <View style={settingsStyles.row}>
              {(Object.keys(READING_THEMES) as ReadingThemeKey[]).map((key) => {
                const t = READING_THEMES[key];
                const isActive = prefs.backgroundColor === t.backgroundColor;
                return (
                  <TouchableOpacity
                    key={key}
                    style={[
                      settingsStyles.themeBtn,
                      { backgroundColor: t.backgroundColor, borderColor: isActive ? palette.primary : '#d1d5db' },
                    ]}
                    onPress={() => setTheme(key)}
                  >
                    <Text style={[settingsStyles.themeBtnText, { color: t.textColor }]}>
                      {t.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const headerStyles = StyleSheet.create({
  btn: { paddingHorizontal: 12, paddingVertical: 6 },
  btnText: { fontSize: 17, fontWeight: '600', color: palette.primary },
});

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 60 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontWeight: '700', lineHeight: 36, marginBottom: 12 },
  meta: { fontSize: 13, marginBottom: 4 },
  divider: { height: 1, marginVertical: 16 },
  body: {},
  emptyContent: { alignItems: 'center', marginTop: 40 },
  emptyText: { textAlign: 'center', fontSize: 15, lineHeight: 22, marginBottom: 16 },
  urlText: { fontSize: 13, color: palette.primary },
  errorText: { fontSize: 16, color: '#6b7280', marginBottom: 16 },
  backLink: { color: palette.primary, fontSize: 16 },
});

const settingsStyles = StyleSheet.create({
  overlay: {
    flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)',
  },
  panel: {
    backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 20, paddingBottom: 40,
  },
  heading: {
    fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 10, marginTop: 8,
  },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  sizeBtn: {
    width: 40, height: 40, borderRadius: 8, borderWidth: 1, borderColor: '#e5e7eb',
    alignItems: 'center', justifyContent: 'center',
  },
  sizeBtnActive: { borderColor: palette.primary, backgroundColor: palette.primary + '15' },
  sizeBtnText: { fontSize: 14, color: '#6b7280' },
  sizeBtnTextActive: { color: palette.primary, fontWeight: '600' },
  themeBtn: {
    flex: 1, minWidth: 70, paddingVertical: 10, borderRadius: 10,
    borderWidth: 2, alignItems: 'center',
  },
  themeBtnText: { fontSize: 13, fontWeight: '500' },
});
