import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import {
  View, Text, StyleSheet,
  ActivityIndicator, TouchableOpacity, Modal, Share,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import {
  IconShare2, IconTextSize, IconAlertCircle,
  IconMinus, IconPlus, IconLineHeight, IconCheck,
  IconHighlight, IconBookmark, IconBookmarkFilled,
} from '@tabler/icons-react-native';
import WebView from 'react-native-webview';
import type { WebViewMessageEvent } from 'react-native-webview';
import { getArticleById, markAsRead } from '../database';
import { Article, ReadingPreferences, RootStackParamList } from '../types';
import { useReadingPrefsStore } from '../stores/readingPrefsStore';
import { useAppThemeStore } from '../stores/appThemeStore';
import { useHighlightStore } from '../stores/highlightStore';
import { useArticleStore } from '../stores/articleStore';
import { READING_THEMES, ReadingThemeKey, FONT_FAMILIES, FontFamilyKey } from '../theme/reading';
import { palette, spacing, radius } from '../theme/colors';

type Route = RouteProp<RootStackParamList, 'Reader'>;

const FONT_SIZES = [14, 15, 16, 17, 18, 20, 22, 24];

function escHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildArticleHtml(article: Article, prefs: ReadingPreferences, accent: string): string {
  const fontCss = FONT_FAMILIES[prefs.fontFamily]?.value ?? 'sans-serif';
  const content = article.content_html
    || (article.content_text
        ? article.content_text.split('\n').filter(Boolean).map((l) => `<p>${l}</p>`).join('')
        : '<p style="opacity:.5">Sem conteúdo.</p>');
  const meta = [
    article.author,
    article.reading_time_min != null ? `${article.reading_time_min} min` : null,
  ].filter(Boolean).join(' · ');

  return `<!DOCTYPE html>
<html><head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=4">
<style>
:root{
  --fs:${prefs.fontSize}px;--tc:${prefs.textColor};--bg:${prefs.backgroundColor};
  --lh:${prefs.lineHeight};--ff:${fontCss};--ac:${accent};
  --fs-t:${prefs.fontSize * 1.5}px;--fs-2:${prefs.fontSize * 1.25}px;
  --fs-3:${prefs.fontSize * 1.1}px;--fs-s:${Math.max(prefs.fontSize - 2, 10)}px;
}
*,*::before,*::after{box-sizing:border-box}
html{background:var(--bg)}
body{margin:0;padding:20px 20px 100px;background:var(--bg);color:var(--tc);
  font-size:var(--fs);font-family:var(--ff);line-height:var(--lh);
  -webkit-text-size-adjust:none;text-size-adjust:none;
  overflow-wrap:break-word;word-break:break-word}
.title{font-size:var(--fs-t);font-weight:700;line-height:1.3;margin:0 0 8px;letter-spacing:-.3px}
.meta{font-size:13px;opacity:.5;margin-bottom:16px;font-family:sans-serif}
hr{border:none;border-top:1px solid currentColor;opacity:.15;margin:0 0 20px}
p{margin:0 0 12px}
h2{font-size:var(--fs-2);font-weight:700;margin:20px 0 8px}
h3{font-size:var(--fs-3);font-weight:600;margin:16px 0 6px}
h4,h5,h6{font-size:var(--fs);font-weight:600;margin:12px 0 4px}
a{color:var(--ac);text-decoration:underline}
img{max-width:100%;height:auto;display:block;margin:12px auto;border-radius:6px}
figure{margin:12px 0}
figcaption{font-size:var(--fs-s);opacity:.6;margin-top:4px}
blockquote{border-left:3px solid currentColor;opacity:.7;padding-left:14px;margin:12px 0;font-style:italic}
pre{background:rgba(128,128,128,.12);padding:12px;border-radius:8px;overflow-x:auto;
  font-size:var(--fs-s);white-space:pre-wrap}
code{font-size:var(--fs-s);font-family:monospace}
pre code{font-size:inherit}
table{width:100%;border-collapse:collapse;margin:12px 0;font-size:var(--fs-s)}
th,td{border:1px solid rgba(128,128,128,.3);padding:6px 8px;text-align:left}
th{font-weight:600}
ul,ol{margin:0 0 12px;padding-left:24px}
li{margin-bottom:4px}
#sb{position:fixed;bottom:20px;left:16px;right:16px;background:var(--ac);color:#fff;
  padding:13px 20px;border-radius:16px;font-size:15px;font-weight:600;
  display:none;text-align:center;font-family:sans-serif;
  box-shadow:0 4px 20px rgba(0,0,0,.25);z-index:9999;
  user-select:none;-webkit-user-select:none;cursor:pointer}
</style>
</head><body>
<h1 class="title">${escHtml(article.title)}</h1>
${meta ? `<p class="meta">${meta}</p>` : ''}
<hr>
${content}
<div id="sb">✦ Salvar destaque</div>
<script>
(function(){
  var sb=document.getElementById('sb'),t=null,last='';
  function show(){clearTimeout(t);sb.style.display='block';}
  function hide(){t=setTimeout(function(){sb.style.display='none';},250);}
  document.addEventListener('selectionchange',function(){
    var s=window.getSelection(),tx=s?s.toString().trim():'';
    last=tx;if(tx.length>1){show();}else{hide();}
  });
  function send(e){
    e.preventDefault();e.stopPropagation();
    var s=window.getSelection(),tx=s?s.toString().trim():last;
    if(tx.length>0){
      window.ReactNativeWebView.postMessage(JSON.stringify({type:'highlight',text:tx}));
      sb.style.display='none';
      if(s&&s.removeAllRanges)s.removeAllRanges();
      last='';
    }
  }
  sb.addEventListener('touchstart',send,{passive:false});
  sb.addEventListener('mousedown',send);
})();
</script>
</body></html>`;
}

export function ReaderScreen() {
  const route = useRoute<Route>();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const navigation = useNavigation<any>();
  const { articleId } = route.params;

  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [savedFeedback, setSavedFeedback] = useState(false);
  const [webViewReady, setWebViewReady] = useState(false);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const webViewRef = useRef<any>(null);

  const { prefs, setFontSize, setFontFamily, setTheme, setLineHeight, _hydrate } = useReadingPrefsStore();
  const accent = useAppThemeStore((s) => s.prefs.accentColor);
  const { articleHighlights, loadArticleHighlights, addHighlight } = useHighlightStore();
  const { toggleFavorite } = useArticleStore();

  useEffect(() => { _hydrate(); }, [_hydrate]);

  useEffect(() => {
    getArticleById(articleId).then((a) => {
      setArticle(a);
      setLoading(false);
      if (a) {
        setIsFavorite(a.is_favorite);
        if (!a.is_read) markAsRead(articleId, true);
      }
    });
    loadArticleHighlights(articleId);
  }, [articleId, loadArticleHighlights]);

  // HTML é construído uma vez por artigo; mudanças de prefs são injetadas via JS
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const articleSource = useMemo(
    () => (article ? { html: buildArticleHtml(article, prefs, accent) } : null),
    [article], // prefs e accent excluídos intencionalmente — atualizados via injectJavaScript
  );

  // Atualiza CSS vars no WebView quando preferências mudam (sem recarregar a página)
  useEffect(() => {
    if (!webViewReady || !webViewRef.current) return;
    const ff = FONT_FAMILIES[prefs.fontFamily]?.value ?? 'sans-serif';
    webViewRef.current.injectJavaScript(`(function(){
      var r=document.documentElement;
      r.style.setProperty('--fs','${prefs.fontSize}px');
      r.style.setProperty('--tc','${prefs.textColor}');
      r.style.setProperty('--bg','${prefs.backgroundColor}');
      r.style.setProperty('--lh','${prefs.lineHeight}');
      r.style.setProperty('--ff','${ff}');
      r.style.setProperty('--fs-t','${prefs.fontSize * 1.5}px');
      r.style.setProperty('--fs-2','${prefs.fontSize * 1.25}px');
      r.style.setProperty('--fs-3','${prefs.fontSize * 1.1}px');
      r.style.setProperty('--fs-s','${Math.max(prefs.fontSize - 2, 10)}px');
      document.body.style.backgroundColor='${prefs.backgroundColor}';
      document.documentElement.style.backgroundColor='${prefs.backgroundColor}';
      true;
    })();`);
  }, [prefs.fontSize, prefs.textColor, prefs.backgroundColor, prefs.lineHeight, prefs.fontFamily, webViewReady]);

  const handleToggleFavorite = useCallback(() => {
    if (!article) return;
    toggleFavorite(article.id);
    setIsFavorite((v) => !v);
  }, [article, toggleFavorite]);

  const handleShare = useCallback(() => {
    if (!article) return;
    Share.share({
      message: article.url ? `${article.title}\n${article.url}` : article.title,
      title: article.title,
    });
  }, [article]);

  const handleMessage = useCallback(async (event: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(event.nativeEvent.data) as { type: string; text: string };
      if (data.type !== 'highlight' || !article) return;
      const text = data.text.trim();
      if (!text) return;
      const plain = article.content_text ?? '';
      const idx = plain.toLowerCase().indexOf(text.toLowerCase());
      await addHighlight({
        article_id: article.id,
        selected_text: text,
        start_offset: idx >= 0 ? idx : 0,
        end_offset: idx >= 0 ? idx + text.length : text.length,
      });
      setSavedFeedback(true);
      setTimeout(() => setSavedFeedback(false), 2000);
    } catch { /* ignore parse/save errors */ }
  }, [article, addHighlight]);

  const toggleSettings = useCallback(() => setShowSettings((v) => !v), []);

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={headerStyles.row}>
          <TouchableOpacity onPress={handleShare} style={headerStyles.btn}>
            <IconShare2 size={20} color={accent} strokeWidth={1.75} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleToggleFavorite} style={headerStyles.btn}>
            {isFavorite
              ? <IconBookmarkFilled size={20} color={accent} />
              : <IconBookmark size={20} color={accent} strokeWidth={1.75} />
            }
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.navigate('Highlights')}
            style={headerStyles.btn}
          >
            <View>
              <IconHighlight size={20} color={accent} strokeWidth={1.75} />
              {articleHighlights.length > 0 && (
                <View style={[headerStyles.badge, { backgroundColor: accent }]}>
                  <Text style={headerStyles.badgeText}>{articleHighlights.length}</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
          <TouchableOpacity onPress={toggleSettings} style={headerStyles.btn}>
            <IconTextSize size={20} color={accent} strokeWidth={1.75} />
          </TouchableOpacity>
        </View>
      ),
    });
  }, [navigation, toggleSettings, handleShare, handleToggleFavorite, accent, articleHighlights.length, isFavorite]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={palette.primary} />
      </View>
    );
  }

  if (!article || !articleSource) {
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

  return (
    <View style={[styles.container, { backgroundColor: prefs.backgroundColor }]}>
      {/* @ts-ignore — tsc resolve para o stub web; Metro usa WebView.android.tsx corretamente */}
      <WebView
        ref={webViewRef}
        source={articleSource}
        style={styles.webView}
        onLoad={() => setWebViewReady(true)}
        onMessage={handleMessage}
        javaScriptEnabled
        scrollEnabled
        showsVerticalScrollIndicator={false}
        originWhitelist={['*']}
        mixedContentMode="always"
      />

      {savedFeedback && (
        <View style={[styles.toast, { backgroundColor: accent }]}>
          <IconCheck size={14} color="#fff" strokeWidth={2.5} />
          <Text style={styles.toastText}>Destaque salvo</Text>
        </View>
      )}

      <Modal visible={showSettings} transparent animationType="slide" onRequestClose={toggleSettings}>
        <TouchableOpacity style={settingsStyles.overlay} activeOpacity={1} onPress={toggleSettings}>
          <View style={settingsStyles.panel}>
            <View style={settingsStyles.handle} />

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

            <Text style={settingsStyles.heading}>Fonte</Text>
            <View style={settingsStyles.row}>
              {(Object.keys(FONT_FAMILIES) as FontFamilyKey[]).map((key) => {
                const { label, value } = FONT_FAMILIES[key];
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
                      { fontFamily: value },
                      isActive && { color: accent, fontWeight: '600' },
                    ]}>
                      {label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

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
  badge: {
    position: 'absolute', top: -4, right: -4,
    minWidth: 14, height: 14, borderRadius: 7,
    justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: 2,
  },
  badgeText: { fontSize: 9, color: '#fff', fontWeight: '700' },
});

const styles = StyleSheet.create({
  container: { flex: 1 },
  webView: { flex: 1, backgroundColor: 'transparent' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { fontSize: 16, color: palette.gray500, marginTop: spacing.md, marginBottom: spacing.lg },
  backLink: { fontSize: 16, fontWeight: '600' },
  toast: {
    position: 'absolute',
    top: 12,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  toastText: { fontSize: 13, color: '#fff', fontWeight: '600' },
});

const settingsStyles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  panel: {
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
  fontBtn: {
    flex: 1, minWidth: 80, paddingVertical: 10,
    borderRadius: radius.md, borderWidth: 1.5,
    borderColor: palette.gray200, alignItems: 'center',
    backgroundColor: palette.white,
  },
  fontBtnText: { fontSize: 14, color: palette.gray600 },
  lhBtn: {
    flex: 1, paddingVertical: 8, borderRadius: radius.md,
    borderWidth: 1.5, borderColor: palette.gray200,
    alignItems: 'center', flexDirection: 'row',
    justifyContent: 'center', gap: 4,
    backgroundColor: palette.white,
  },
  lhText: { fontSize: 13, color: palette.gray500 },
  themeBtn: {
    flex: 1, minWidth: 65, paddingVertical: 10,
    borderRadius: radius.md, alignItems: 'center',
    flexDirection: 'row', justifyContent: 'center',
  },
  themeBtnText: { fontSize: 13, fontWeight: '500' },
});
