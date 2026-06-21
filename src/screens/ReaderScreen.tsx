import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  ActivityIndicator, TouchableOpacity, useWindowDimensions, Modal, Share,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import {
  IconShare2, IconTextSize, IconAlertCircle,
  IconFileText, IconMinus, IconPlus, IconLineHeight, IconCheck,
} from '@tabler/icons-react-native';
import RenderHtml from 'react-native-render-html';
import { getArticleById, markAsRead } from '../database';
import { Article, RootStackParamList } from '../types';
import { useReadingPrefsStore } from '../stores/readingPrefsStore';
import { useAppThemeStore } from '../stores/appThemeStore';
import { READING_THEMES, ReadingThemeKey, FONT_FAMILIES, FontFamilyKey } from '../theme/reading';
import { palette, spacing, radius } from '../theme/colors';

type Route = RouteProp<RootStackParamList, 'Reader'>;

const FONT_SIZES = [14, 15, 16, 17, 18, 20, 22, 24];

// Detecta tema escuro comparando com o background do tema escuro
const DARK_BG = READING_THEMES.escuro.backgroundColor;

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
            <IconShare2 size={20} color={accent} strokeWidth={1.75} />
          </TouchableOpacity>
          <TouchableOpacity onPress={toggleSettings} style={headerStyles.btn}>
            <IconTextSize size={20} color={accent} strokeWidth={1.75} />
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
        <IconAlertCircle size={40} color={palette.gray300} strokeWidth={1.25} />
        <Text style={styles.errorText}>Artigo não encontrado.</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={[styles.backLink, { color: palette.primary }]}>Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isDark = prefs.backgroundColor === DARK_BG;
  const fontFamilyValue = prefs.fontFamily === 'System' ? undefined : prefs.fontFamily;

  // Determina o linkColor do tema ativo
  const activeLinkColor = Object.values(READING_THEMES).find(
    (t) => t.backgroundColor === prefs.backgroundColor
  )?.linkColor ?? palette.primary;

  const tagsStyles = {
    body: {
      color: prefs.textColor,
      fontSize: prefs.fontSize,
      lineHeight: prefs.fontSize * prefs.lineHeight,
      fontFamily: fontFamilyValue,
    },
    a: { color: activeLinkColor },
    img: { marginVertical: 12 },
    p: { marginBottom: 12 },
    h1: { fontSize: prefs.fontSize * 1.4, fontWeight: '700' as const, marginBottom: 8 },
    h2: { fontSize: prefs.fontSize * 1.25, fontWeight: '700' as const, marginBottom: 8 },
    h3: { fontSize: prefs.fontSize * 1.1, fontWeight: '600' as const, marginBottom: 6 },
    blockquote: {
      borderLeftWidth: 3,
      borderLeftColor: isDark ? palette.gray600 : palette.gray200,
      paddingLeft: 14,
      marginLeft: 0,
      fontStyle: 'italic' as const,
      color: isDark ? palette.gray400 : palette.gray500,
    },
    pre: {
      backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : palette.gray100,
      padding: 12,
      borderRadius: 8,
      overflow: 'hidden' as const,
    },
    code: { fontSize: prefs.fontSize - 2 },
  };

  return (
    <View style={[styles.container, { backgroundColor: prefs.backgroundColor }]}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Título em Georgia — design system §3 (display / corpo de leitura usa serif) */}
        <Text style={[styles.title, {
          color: prefs.textColor,
          fontSize: prefs.fontSize * 1.5,
          fontFamily: 'Georgia',
        }]}>
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
        <View style={[styles.divider, { backgroundColor: activeLinkColor, opacity: 0.25 }]} />

        {article.content_html ? (
          <RenderHtml
            contentWidth={width - 40}
            source={{ html: article.content_html }}
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
            <IconFileText
              size={40}
              color={isDark ? 'rgba(255,255,255,0.25)' : palette.gray300}
              strokeWidth={1.25}
            />
            <Text style={[styles.emptyText, { color: prefs.textColor, opacity: 0.5 }]}>
              Este artigo foi salvo sem conteúdo.
            </Text>
            {article.url != null && (
              <Text style={[styles.urlText, { color: palette.primary }]}>URL: {article.url}</Text>
            )}
          </View>
        )}
      </ScrollView>

      {/* Painel de preferências de leitura */}
      <Modal visible={showSettings} transparent animationType="slide" onRequestClose={toggleSettings}>
        <TouchableOpacity style={settingsStyles.overlay} activeOpacity={1} onPress={toggleSettings}>
          <View style={settingsStyles.panel}>
            <View style={settingsStyles.handle} />

            {/* Tamanho da fonte */}
            <Text style={settingsStyles.heading}>Tamanho</Text>
            <View style={settingsStyles.sizeRow}>
              <TouchableOpacity
                style={settingsStyles.sizeControl}
                onPress={() => {
                  const idx = FONT_SIZES.indexOf(prefs.fontSize);
                  if (idx > 0) setFontSize(FONT_SIZES[idx - 1]);
                }}
              >
                <IconMinus size={20} color={palette.gray500} strokeWidth={1.75} />
              </TouchableOpacity>
              <Text style={settingsStyles.sizeValue}>{prefs.fontSize}px</Text>
              <TouchableOpacity
                style={settingsStyles.sizeControl}
                onPress={() => {
                  const idx = FONT_SIZES.indexOf(prefs.fontSize);
                  if (idx < FONT_SIZES.length - 1) setFontSize(FONT_SIZES[idx + 1]);
                }}
              >
                <IconPlus size={20} color={palette.gray500} strokeWidth={1.75} />
              </TouchableOpacity>
            </View>

            {/* Família de fonte */}
            <Text style={settingsStyles.heading}>Fonte</Text>
            <View style={settingsStyles.row}>
              {(Object.keys(FONT_FAMILIES) as FontFamilyKey[]).map((key) => {
                const isActive = prefs.fontFamily === key;
                return (
                  <TouchableOpacity
                    key={key}
                    style={[
                      settingsStyles.fontBtn,
                      isActive && { borderColor: accent, backgroundColor: accent + '12' },
                    ]}
                    onPress={() => setFontFamily(key)}
                  >
                    <Text style={[
                      settingsStyles.fontBtnText,
                      { fontFamily: key === 'System' ? undefined : key },
                      isActive && { color: accent, fontWeight: '600' },
                    ]}>
                      {key}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Espaçamento entre linhas */}
            <Text style={settingsStyles.heading}>Espaçamento</Text>
            <View style={settingsStyles.row}>
              {[1.4, 1.6, 1.8, 2.0].map((lh) => {
                const isActive = Math.abs(prefs.lineHeight - lh) < 0.05;
                return (
                  <TouchableOpacity
                    key={lh}
                    style={[
                      settingsStyles.lhBtn,
                      isActive && { borderColor: accent, backgroundColor: accent + '12' },
                    ]}
                    onPress={() => setLineHeight(lh)}
                  >
                    <IconLineHeight size={18} color={isActive ? accent : palette.gray400} strokeWidth={1.75} />
                    <Text style={[
                      settingsStyles.lhText,
                      isActive && { color: accent, fontWeight: '600' },
                    ]}>
                      {lh.toFixed(1)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Tema de leitura */}
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
                      { backgroundColor: t.backgroundColor },
                      isActive
                        ? { borderColor: accent, borderWidth: 2 }
                        : { borderColor: palette.gray200, borderWidth: 1.5 },
                    ]}
                    onPress={() => setTheme(key)}
                  >
                    <Text style={[settingsStyles.themeBtnText, { color: t.textColor }]}>
                      {t.label}
                    </Text>
                    {isActive && (
                      <IconCheck size={14} color={accent} strokeWidth={2.5} style={{ marginLeft: 4 }} />
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
  title: {
    fontWeight: '700',
    lineHeight: 36,
    marginBottom: spacing.sm,
    letterSpacing: -0.3,
  },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: spacing.sm },
  meta: { fontSize: 13, marginBottom: 4 },
  divider: { height: 1, marginVertical: spacing.lg },
  emptyContent: { alignItems: 'center', marginTop: 60 },
  emptyText: { textAlign: 'center', fontSize: 15, lineHeight: 22, marginTop: spacing.md },
  urlText: { fontSize: 13, marginTop: spacing.sm },
  errorText: { fontSize: 16, color: palette.gray500, marginTop: spacing.md, marginBottom: spacing.lg },
  backLink: { fontSize: 16, fontWeight: '600' },
});

const settingsStyles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  panel: {
    // Papel como fundo do painel — design system §2
    backgroundColor: palette.gray50,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing.xl,
    paddingBottom: 40,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderColor: palette.gray200,
  },
  handle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: palette.gray300, alignSelf: 'center', marginBottom: spacing.lg,
  },
  heading: {
    fontSize: 12,
    fontWeight: '500',
    color: palette.gray500,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.sm },

  // Stepper de tamanho
  sizeRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.xl, marginBottom: spacing.md,
  },
  sizeControl: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: palette.gray100,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: palette.gray200,
  },
  sizeValue: {
    fontSize: 18, fontWeight: '700',
    color: palette.gray900,
    minWidth: 50, textAlign: 'center',
  },

  // Fonte
  fontBtn: {
    flex: 1, minWidth: 80, paddingVertical: 10,
    borderRadius: radius.md, borderWidth: 1.5,
    borderColor: palette.gray200, alignItems: 'center',
    backgroundColor: palette.white,
  },
  fontBtnText: { fontSize: 14, color: palette.gray600 },

  // Espaçamento
  lhBtn: {
    flex: 1, paddingVertical: 8, borderRadius: radius.md,
    borderWidth: 1.5, borderColor: palette.gray200,
    alignItems: 'center', flexDirection: 'row',
    justifyContent: 'center', gap: 4,
    backgroundColor: palette.white,
  },
  lhText: { fontSize: 13, color: palette.gray500 },

  // Tema
  themeBtn: {
    flex: 1, minWidth: 65, paddingVertical: 10,
    borderRadius: radius.md, alignItems: 'center',
    flexDirection: 'row', justifyContent: 'center',
  },
  themeBtnText: { fontSize: 13, fontWeight: '500' },
});
