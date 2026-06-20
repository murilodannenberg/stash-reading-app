import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  ActivityIndicator, TouchableOpacity, useWindowDimensions, Modal, Share,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import RenderHtml from 'react-native-render-html';
import { getArticleById, markAsRead } from '../database';
import { Article, RootStackParamList } from '../types';
import { useReadingPrefsStore } from '../stores/readingPrefsStore';
import { useAppThemeStore } from '../stores/appThemeStore';
import { READING_THEMES, ReadingThemeKey, FONT_FAMILIES, FontFamilyKey } from '../theme/reading';
import { palette, spacing, radius } from '../theme/colors';

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

  const { prefs, setFontSize, setFontFamily, setTheme, setLineHeight, _hydrate } = useReadingPrefsStore();
  const accent = useAppThemeStore((s) => s.prefs.accentColor);

  useEffect(() => { _hydrate(); }, [_hydrate]);

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

  const handleShare = useCallback(() => {
    if (!article) return;
    Share.share({
      message: article.url
        ? `${article.title}\n${article.url}`
        : article.title,
      title: article.title,
    });
  }, [article]);

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={headerStyles.row}>
          <TouchableOpacity onPress={handleShare} style={headerStyles.btn}>
            <Ionicons name="share-outline" size={20} color={accent} />
          </TouchableOpacity>
          <TouchableOpacity onPress={toggleSettings} style={headerStyles.btn}>
            <Ionicons name="text-outline" size={20} color={accent} />
          </TouchableOpacity>
        </View>
      ),
    });
  }, [navigation, toggleSettings, handleShare, accent]);

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
        <Ionicons name="alert-circle-outline" size={40} color={palette.gray300} />
        <Text style={styles.errorText}>Artigo nao encontrado.</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backLink}>Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const htmlSource = article.content_html ? { html: article.content_html } : null;

  const fontFamilyValue = prefs.fontFamily === 'System' ? undefined : prefs.fontFamily;

  const tagsStyles = {
    body: {
      color: prefs.textColor,
      fontSize: prefs.fontSize,
      lineHeight: prefs.fontSize * prefs.lineHeight,
      fontFamily: fontFamilyValue,
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

  const isDark = prefs.backgroundColor !== '#ffffff' && prefs.backgroundColor !== '#f5f0e8';

  return (
    <View style={[styles.container, { backgroundColor: prefs.backgroundColor }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.title, { color: prefs.textColor, fontSize: prefs.fontSize * 1.5, fontFamily: fontFamilyValue }]}>
          {article.title}
        </Text>
        {(article.author != null || article.reading_time_min != null) && (
          <View style={styles.metaRow}>
            {article.author != null && (
              <Text style={[styles.meta, { color: prefs.textColor, opacity: 0.5 }]}>
                {article.author}
              </Text>
            )}
            {article.reading_time_min != null && (
              <Text style={[styles.meta, { color: prefs.textColor, opacity: 0.4 }]}>
                {article.author ? ' · ' : ''}{article.reading_time_min} min de leitura
              </Text>
            )}
          </View>
        )}
        <View style={[styles.divider, { backgroundColor: prefs.textColor, opacity: 0.1 }]} />

        {htmlSource ? (
          <RenderHtml
            contentWidth={width - 40}
            source={htmlSource}
            tagsStyles={tagsStyles}
            enableExperimentalMarginCollapsing
          />
        ) : article.content_text ? (
          <Text style={{
            color: prefs.textColor,
            fontSize: prefs.fontSize,
            lineHeight: prefs.fontSize * prefs.lineHeight,
            fontFamily: fontFamilyValue,
          }}>
            {article.content_text}
          </Text>
        ) : (
          <View style={styles.emptyContent}>
            <Ionicons name="document-text-outline" size={40} color={isDark ? 'rgba(255,255,255,0.3)' : palette.gray300} />
            <Text style={[styles.emptyText, { color: prefs.textColor, opacity: 0.5 }]}>
              Este artigo foi salvo sem conteudo.
            </Text>
            {article.url != null && (
              <Text style={[styles.urlText, { color: palette.primary }]}>URL: {article.url}</Text>
            )}
          </View>
        )}
      </ScrollView>

      {/* Reading settings panel */}
      <Modal visible={showSettings} transparent animationType="slide" onRequestClose={toggleSettings}>
        <TouchableOpacity style={settingsStyles.overlay} activeOpacity={1} onPress={toggleSettings}>
          <View style={settingsStyles.panel}>
            <View style={settingsStyles.handle} />

            {/* Font size */}
            <Text style={settingsStyles.heading}>Tamanho</Text>
            <View style={settingsStyles.sizeRow}>
              <TouchableOpacity
                style={settingsStyles.sizeControl}
                onPress={() => {
                  const idx = FONT_SIZES.indexOf(prefs.fontSize);
                  if (idx > 0) setFontSize(FONT_SIZES[idx - 1]);
                }}
              >
                <Ionicons name="remove" size={20} color={palette.gray600} />
              </TouchableOpacity>
              <Text style={settingsStyles.sizeValue}>{prefs.fontSize}px</Text>
              <TouchableOpacity
                style={settingsStyles.sizeControl}
                onPress={() => {
                  const idx = FONT_SIZES.indexOf(prefs.fontSize);
                  if (idx < FONT_SIZES.length - 1) setFontSize(FONT_SIZES[idx + 1]);
                }}
              >
                <Ionicons name="add" size={20} color={palette.gray600} />
              </TouchableOpacity>
            </View>

            {/* Font family */}
            <Text style={settingsStyles.heading}>Fonte</Text>
            <View style={settingsStyles.row}>
              {(Object.keys(FONT_FAMILIES) as FontFamilyKey[]).map((key) => {
                const isActive = prefs.fontFamily === key;
                return (
                  <TouchableOpacity
                    key={key}
                    style={[settingsStyles.fontBtn, isActive && settingsStyles.fontBtnActive]}
                    onPress={() => setFontFamily(key)}
                  >
                    <Text style={[
                      settingsStyles.fontBtnText,
                      { fontFamily: key === 'System' ? undefined : key },
                      isActive && settingsStyles.fontBtnTextActive,
                    ]}>
                      {key === 'System' ? 'Padrao' : key}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Line height */}
            <Text style={settingsStyles.heading}>Espacamento</Text>
            <View style={settingsStyles.row}>
              {[1.4, 1.6, 1.8, 2.0].map((lh) => {
                const isActive = Math.abs(prefs.lineHeight - lh) < 0.05;
                return (
                  <TouchableOpacity
                    key={lh}
                    style={[settingsStyles.lhBtn, isActive && settingsStyles.lhBtnActive]}
                    onPress={() => setLineHeight(lh)}
                  >
                    <Ionicons name="reorder-three-outline" size={18} color={isActive ? palette.primary : palette.gray400} />
                    <Text style={[settingsStyles.lhText, isActive && settingsStyles.lhTextActive]}>
                      {lh.toFixed(1)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Theme */}
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
                      {
                        backgroundColor: t.backgroundColor,
                        borderColor: isActive ? palette.primary : palette.gray200,
                      },
                    ]}
                    onPress={() => setTheme(key)}
                  >
                    <Text style={[settingsStyles.themeBtnText, { color: t.textColor }]}>
                      {t.label}
                    </Text>
                    {isActive && (
                      <Ionicons name="checkmark" size={14} color={palette.primary} style={{ marginLeft: 4 }} />
                    )}
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
  row: { flexDirection: 'row', alignItems: 'center' },
  btn: { paddingHorizontal: 10, paddingVertical: 6 },
});

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.xl, paddingBottom: 60 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontWeight: '700', lineHeight: 36, marginBottom: spacing.md },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap' },
  meta: { fontSize: 13, marginBottom: 4 },
  divider: { height: 1, marginVertical: spacing.lg },
  emptyContent: { alignItems: 'center', marginTop: 60 },
  emptyText: { textAlign: 'center', fontSize: 15, lineHeight: 22, marginTop: spacing.md },
  urlText: { fontSize: 13, marginTop: spacing.sm },
  errorText: { fontSize: 16, color: palette.gray500, marginTop: spacing.md, marginBottom: spacing.lg },
  backLink: { color: palette.primary, fontSize: 16, fontWeight: '600' },
});

const settingsStyles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.35)' },
  panel: {
    backgroundColor: palette.white, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing.xl, paddingBottom: 40, paddingTop: spacing.md,
  },
  handle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: palette.gray300, alignSelf: 'center', marginBottom: spacing.lg,
  },
  heading: {
    fontSize: 13, fontWeight: '600', color: palette.gray500,
    marginBottom: spacing.sm, marginTop: spacing.md,
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.sm },

  // Font size stepper
  sizeRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.xl, marginBottom: spacing.md,
  },
  sizeControl: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: palette.gray100, justifyContent: 'center', alignItems: 'center',
  },
  sizeValue: { fontSize: 18, fontWeight: '700', color: palette.gray900, minWidth: 50, textAlign: 'center' },

  // Font buttons
  fontBtn: {
    flex: 1, minWidth: 80, paddingVertical: 10, borderRadius: radius.md,
    borderWidth: 1.5, borderColor: palette.gray200, alignItems: 'center',
  },
  fontBtnActive: { borderColor: palette.primary, backgroundColor: palette.primary + '10' },
  fontBtnText: { fontSize: 14, color: palette.gray600 },
  fontBtnTextActive: { color: palette.primary, fontWeight: '600' },

  // Line height
  lhBtn: {
    flex: 1, paddingVertical: 8, borderRadius: radius.md,
    borderWidth: 1.5, borderColor: palette.gray200, alignItems: 'center',
    flexDirection: 'row', justifyContent: 'center', gap: 4,
  },
  lhBtnActive: { borderColor: palette.primary, backgroundColor: palette.primary + '10' },
  lhText: { fontSize: 13, color: palette.gray500 },
  lhTextActive: { color: palette.primary, fontWeight: '600' },

  // Theme
  themeBtn: {
    flex: 1, minWidth: 65, paddingVertical: 10, borderRadius: radius.md,
    borderWidth: 2, alignItems: 'center', flexDirection: 'row', justifyContent: 'center',
  },
  themeBtnText: { fontSize: 13, fontWeight: '500' },
});
