import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import {
  View, Text, StyleSheet,
  ActivityIndicator, TouchableOpacity, Modal, Share,
  Alert, TextInput, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import {
  IconShare2, IconTextSize, IconAlertCircle,
  IconMinus, IconPlus, IconLineHeight, IconCheck,
  IconHighlight, IconBookmark, IconBookmarkFilled,
  IconPencil, IconX, IconDownload, IconCircleCheckFilled,
} from '@tabler/icons-react-native';
import WebView from 'react-native-webview';
import type { WebViewMessageEvent } from 'react-native-webview';
import { File, Directory, Paths } from 'expo-file-system';
import { getArticleById, markAsRead, updateArticleContent } from '../database';
import { Article, ReadingPreferences, RootStackParamList } from '../types';
import { useReadingPrefsStore } from '../stores/readingPrefsStore';
import { useAppThemeStore } from '../stores/appThemeStore';
import { useHighlightStore } from '../stores/highlightStore';
import { useArticleStore } from '../stores/articleStore';
import { useFileStore } from '../stores/fileStore';
import { READING_THEMES, ReadingThemeKey, FONT_FAMILIES, FontFamilyKey } from '../theme/reading';
import { palette, spacing, radius } from '../theme/colors';
import { generateId } from '../utils/id';

type Route = RouteProp<RootStackParamList, 'Reader'>;

const FONT_SIZES = [14, 15, 16, 17, 18, 20, 22, 24];

const MARKER_COLORS = [
  { color: '#fde047', label: 'Amarelo' },
  { color: '#fda4af', label: 'Rosa' },
  { color: '#93c5fd', label: 'Azul' },
  { color: '#86efac', label: 'Verde' },
  { color: '#fdba74', label: 'Laranja' },
];

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

  const markerColors = MARKER_COLORS.map((m) => m.color);
  const coverHtml = article.cover_image_path
    ? `<img class="cover" src="${article.cover_image_path}" />`
    : '';

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
img{max-width:100%;height:auto;display:block;margin:12px auto;border-radius:6px;cursor:pointer}
.cover{width:100%;height:auto;border-radius:12px;margin:0 0 18px;display:block;}
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
#picker{position:fixed;bottom:20px;left:16px;right:16px;
  background:rgba(30,30,30,.92);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);
  padding:12px 16px;border-radius:20px;
  display:none;align-items:center;justify-content:center;gap:12px;z-index:9999;
  user-select:none;-webkit-user-select:none;}
.dot{width:36px;height:36px;border-radius:18px;cursor:pointer;
  border:2.5px solid rgba(255,255,255,.3);
  display:flex;align-items:center;justify-content:center;
  transition:transform .1s;}
.dot:active{transform:scale(0.88);}
#cancel-btn{width:32px;height:32px;border-radius:16px;cursor:pointer;
  background:rgba(255,255,255,.15);display:flex;align-items:center;justify-content:center;
  margin-left:4px;font-size:18px;color:#fff;font-weight:300;line-height:1;}
</style>
</head><body>
${coverHtml}
<h1 class="title">${escHtml(article.title)}</h1>
${meta ? `<p class="meta">${meta}</p>` : ''}
<hr>
${content}
<div id="picker">
  ${markerColors.map((c) => `<div class="dot" data-color="${c}" style="background:${c}"></div>`).join('')}
  <div id="cancel-btn">✕</div>
</div>
<script>
(function(){
  var picker=document.getElementById('picker'),t=null,last='',imgPressTimer=null;
  function show(){clearTimeout(t);picker.style.display='flex';}
  function hide(){t=setTimeout(function(){picker.style.display='none';},200);}
  document.addEventListener('selectionchange',function(){
    var s=window.getSelection(),tx=s?s.toString().trim():'';
    last=tx;
    if(tx.length>1){show();}else{hide();}
  });
  picker.querySelectorAll('.dot').forEach(function(dot){
    dot.addEventListener('touchstart',function(e){
      e.preventDefault();e.stopPropagation();
      var s=window.getSelection(),tx=s?s.toString().trim():last;
      var color=dot.getAttribute('data-color');
      if(tx.length>0&&color){
        window.ReactNativeWebView.postMessage(JSON.stringify({type:'highlight',text:tx,color:color}));
        picker.style.display='none';
        if(s&&s.removeAllRanges)s.removeAllRanges();
        last='';
      }
    },{passive:false});
    dot.addEventListener('mousedown',function(e){
      e.preventDefault();e.stopPropagation();
      var s=window.getSelection(),tx=s?s.toString().trim():last;
      var color=dot.getAttribute('data-color');
      if(tx.length>0&&color){
        window.ReactNativeWebView.postMessage(JSON.stringify({type:'highlight',text:tx,color:color}));
        picker.style.display='none';
        if(s&&s.removeAllRanges)s.removeAllRanges();
        last='';
      }
    });
  });
  document.getElementById('cancel-btn').addEventListener('touchstart',function(e){
    e.preventDefault();hide();if(window.getSelection())window.getSelection().removeAllRanges();last='';
  },{passive:false});

  // Scroll progress
  window.addEventListener('scroll',function(){
    var dh=document.documentElement.scrollHeight-window.innerHeight;
    if(dh<=0)return;
    var p=Math.min(1,Math.max(0,window.scrollY/dh));
    window.ReactNativeWebView.postMessage(JSON.stringify({type:'scroll',progress:p}));
  },{passive:true});

  // Fix lazy-loaded images
  (function(){
    var lazy=['data-src','data-lazy-src','data-original','data-lazy','data-url','data-delayed-url'];
    document.querySelectorAll('img').forEach(function(img){
      for(var i=0;i<lazy.length;i++){
        var v=img.getAttribute(lazy[i]);
        if(v&&(v.indexOf('http')===0||v.indexOf('//')===0)){img.src=v;break;}
      }
      img.loading='eager';
    });
    document.querySelectorAll('noscript').forEach(function(ns){
      var h=ns.innerHTML||'';
      if(h.indexOf('img')<0)return;
      var d=document.createElement('div');d.innerHTML=h;
      var im=d.querySelector('img');
      if(im&&im.src){var n=new Image();n.src=im.src;n.style.maxWidth='100%';n.style.height='auto';n.style.borderRadius='6px';if(ns.parentNode)ns.parentNode.insertBefore(n,ns);}
      if(ns.remove)ns.remove();
    });
  })();

  // Image long-press to save
  document.querySelectorAll('img').forEach(function(img){
    img.addEventListener('touchstart',function(){
      var src=img.getAttribute('src')||img.getAttribute('data-src')||'';
      if(!src)return;
      imgPressTimer=setTimeout(function(){
        window.ReactNativeWebView.postMessage(JSON.stringify({type:'save_image',url:src}));
      },600);
    },{passive:true});
    img.addEventListener('touchend',function(){clearTimeout(imgPressTimer);},{passive:true});
    img.addEventListener('touchmove',function(){clearTimeout(imgPressTimer);},{passive:true});
  });
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
  const [readProgress, setReadProgress] = useState(0);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editText, setEditText] = useState('');
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const webViewRef = useRef<any>(null);

  const { prefs, setFontSize, setFontFamily, setTheme, setLineHeight, _hydrate } = useReadingPrefsStore();
  const accent = useAppThemeStore((s) => s.prefs.accentColor);
  const { articleHighlights, loadArticleHighlights, addHighlight } = useHighlightStore();
  const { toggleFavorite, downloadArticle } = useArticleStore();
  const { importFile } = useFileStore();

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

  const articleSource = useMemo(() => {
    if (!article) return null;
    const html = buildArticleHtml(article, prefs, accent);
    // Local resources (cover + downloaded body images) live under the app document
    // dir. Give the WebView a file:// base origin so allowFileAccessFromFileURLs can
    // read them — the images then live in the DOM and scroll with the text.
    if (article.cover_image_path || article.is_downloaded) {
      const docUri = Paths.document?.uri;
      const fallback = article.cover_image_path
        ? article.cover_image_path.substring(0, article.cover_image_path.lastIndexOf('/') + 1)
        : undefined;
      const baseUrl = docUri ?? fallback;
      return baseUrl ? { html, baseUrl } : { html };
    }
    return { html };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [article]);

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

  // Inject highlight marks into WebView text
  useEffect(() => {
    if (!webViewReady || !webViewRef.current || articleHighlights.length === 0) return;
    const hlJson = JSON.stringify(
      articleHighlights.map((h) => ({ t: h.selected_text, c: h.color }))
    );
    webViewRef.current.injectJavaScript(`(function(){
      try{
        document.querySelectorAll('mark.sh').forEach(function(m){
          var p=m.parentNode;while(m.firstChild)p.insertBefore(m.firstChild,m);p.removeChild(m);p.normalize();
        });
        var hl=${hlJson};
        function markText(text,color){
          var walker=document.createTreeWalker(document.body,4,null,false);
          var node,lText=text.toLowerCase();
          while(node=walker.nextNode()){
            var pn=node.parentNode;
            if(!pn||pn.tagName==='SCRIPT'||pn.tagName==='STYLE'||pn.tagName==='MARK')continue;
            var val=node.nodeValue||'',lVal=val.toLowerCase(),idx=lVal.indexOf(lText);
            if(idx<0)continue;
            var b=document.createTextNode(val.substring(0,idx));
            var ins=document.createTextNode(val.substring(idx,idx+text.length));
            var a=document.createTextNode(val.substring(idx+text.length));
            var mk=document.createElement('mark');
            mk.className='sh';
            mk.style.cssText='background:'+color+';border-radius:3px;padding:1px 0;';
            mk.appendChild(ins);
            pn.insertBefore(b,node);pn.insertBefore(mk,node);pn.insertBefore(a,node);pn.removeChild(node);
            return;
          }
        }
        hl.forEach(function(h){markText(h.t,h.c);});
      }catch(e){}
      true;
    })();`);
  }, [articleHighlights, webViewReady]);

  const handleToggleFavorite = useCallback(() => {
    if (!article) return;
    toggleFavorite(article.id);
    setIsFavorite((v) => !v);
  }, [article, toggleFavorite]);

  const handleDownload = useCallback(async () => {
    if (!article || downloading) return;
    if (article.is_downloaded) {
      Alert.alert('Disponível offline', 'Este artigo já está salvo com as imagens para leitura offline.');
      return;
    }
    setDownloading(true);
    try {
      const count = await downloadArticle(article.id);
      const fresh = await getArticleById(article.id);
      if (fresh) setArticle(fresh);
      Alert.alert(
        'Pronto para offline',
        count > 0
          ? `Artigo e ${count} ${count === 1 ? 'imagem salva' : 'imagens salvas'} no aparelho.`
          : 'Artigo salvo. Não havia imagens para baixar.',
      );
    } catch {
      Alert.alert('Erro', 'Não foi possível baixar o artigo completo.');
    } finally {
      setDownloading(false);
    }
  }, [article, downloading, downloadArticle]);

  const handleShare = useCallback(() => {
    if (!article) return;
    Share.share({
      message: article.url ? `${article.title}\n${article.url}` : article.title,
      title: article.title,
    });
  }, [article]);

  const handleSaveImage = useCallback(async (url: string) => {
    if (!url || !url.startsWith('http')) return;
    try {
      const ext = url.split('?')[0].split('.').pop()?.toLowerCase() ?? 'jpg';
      const safeExt = ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext) ? ext : 'jpg';
      const safeName = `img_${generateId()}.${safeExt}`;
      const imagesDir = new Directory(Paths.document, 'stash_files');
      if (!imagesDir.exists) imagesDir.create();
      const destFile = new File(imagesDir, safeName);
      const downloaded = await File.downloadFileAsync(url, destFile);
      await importFile({ name: safeName, type: 'image', path: downloaded.uri, size_bytes: 0, folder_id: null });
      Alert.alert('Imagem salva', 'Imagem adicionada em Arquivos.');
    } catch {
      Alert.alert('Erro', 'Não foi possível salvar a imagem.');
    }
  }, [importFile]);

  const handleMessage = useCallback(async (event: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(event.nativeEvent.data) as { type: string; text?: string; color?: string; progress?: number; url?: string };
      if (data.type === 'scroll' && data.progress != null) {
        setReadProgress(data.progress);
        return;
      }
      if (data.type === 'save_image' && data.url) {
        handleSaveImage(data.url);
        return;
      }
      if (data.type === 'highlight' && article && data.text) {
        const text = data.text.trim();
        if (!text) return;
        const plain = article.content_text ?? '';
        const idx = plain.toLowerCase().indexOf(text.toLowerCase());
        await addHighlight({
          article_id: article.id,
          selected_text: text,
          start_offset: idx >= 0 ? idx : 0,
          end_offset: idx >= 0 ? idx + text.length : text.length,
          color: data.color ?? '#fde047',
        });
        setSavedFeedback(true);
        setTimeout(() => setSavedFeedback(false), 2000);
      }
    } catch { /* ignore parse/save errors */ }
  }, [article, addHighlight, handleSaveImage]);

  const handleOpenEdit = useCallback(() => {
    if (!article) return;
    setEditText(article.content_text ?? '');
    setShowEditModal(true);
  }, [article]);

  const handleSaveEdit = useCallback(async () => {
    if (!article) return;
    setSaving(true);
    try {
      const newText = editText.trim();
      const newHtml = newText.split('\n').filter(Boolean).map((l) => `<p>${l}</p>`).join('');
      await updateArticleContent(article.id, newText, newHtml);
      setArticle((prev) => prev ? { ...prev, content_text: newText, content_html: newHtml } : prev);
      setShowEditModal(false);
    } catch {
      Alert.alert('Erro', 'Não foi possível salvar as alterações.');
    } finally {
      setSaving(false);
    }
  }, [article, editText]);

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
          <TouchableOpacity onPress={handleDownload} style={headerStyles.btn} disabled={downloading}>
            {downloading
              ? <ActivityIndicator size="small" color={accent} />
              : article?.is_downloaded
                ? <IconCircleCheckFilled size={20} color={accent} />
                : <IconDownload size={20} color={accent} strokeWidth={1.75} />
            }
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.navigate('MainTabs', { screen: 'Highlights' })}
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
          <TouchableOpacity onPress={handleOpenEdit} style={headerStyles.btn}>
            <IconPencil size={20} color={accent} strokeWidth={1.75} />
          </TouchableOpacity>
          <TouchableOpacity onPress={toggleSettings} style={headerStyles.btn}>
            <IconTextSize size={20} color={accent} strokeWidth={1.75} />
          </TouchableOpacity>
        </View>
      ),
    });
  }, [navigation, toggleSettings, handleShare, handleToggleFavorite, handleOpenEdit, handleDownload, downloading, article?.is_downloaded, accent, articleHighlights.length, isFavorite]);

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
      {/* Progress bar */}
      <View style={styles.progressTrack}>
        <View style={[styles.progressBar, { width: `${readProgress * 100}%`, backgroundColor: accent }]} />
      </View>

      {/* @ts-ignore */}
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
        allowFileAccess
        allowFileAccessFromFileURLs
        allowUniversalAccessFromFileURLs
      />

      {savedFeedback && (
        <View style={[styles.toast, { backgroundColor: accent }]}>
          <IconCheck size={14} color="#fff" strokeWidth={2.5} />
          <Text style={styles.toastText}>Destaque salvo</Text>
        </View>
      )}

      {/* Reading settings panel */}
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

      {/* Text edit modal */}
      <Modal visible={showEditModal} transparent animationType="slide" onRequestClose={() => setShowEditModal(false)}>
        <KeyboardAvoidingView
          style={editStyles.wrap}
          behavior="padding"
          keyboardVerticalOffset={Platform.OS === 'android' ? 0 : 0}
        >
          <View style={editStyles.panel}>
            <View style={editStyles.header}>
              <Text style={editStyles.title}>Editar texto</Text>
              <TouchableOpacity onPress={() => setShowEditModal(false)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <IconX size={20} color={palette.gray500} strokeWidth={1.75} />
              </TouchableOpacity>
            </View>
            <ScrollView style={editStyles.scrollArea} keyboardShouldPersistTaps="handled">
              <TextInput
                style={editStyles.input}
                value={editText}
                onChangeText={setEditText}
                multiline
                textAlignVertical="top"
                placeholder="Texto do artigo..."
                placeholderTextColor={palette.gray400}
              />
            </ScrollView>
            <TouchableOpacity
              style={[editStyles.saveBtn, { backgroundColor: accent }, saving && { opacity: 0.6 }]}
              onPress={handleSaveEdit}
              disabled={saving}
              activeOpacity={0.8}
            >
              <Text style={editStyles.saveBtnText}>{saving ? 'Salvando…' : 'Salvar alterações'}</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const headerStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  btn: { paddingHorizontal: 8, paddingVertical: 6 },
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
  progressTrack: { height: 2, backgroundColor: 'transparent' },
  progressBar: { height: 2, borderRadius: 1 },
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

const editStyles = StyleSheet.create({
  wrap: { flex: 1, justifyContent: 'flex-end' },
  panel: {
    backgroundColor: palette.white,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.xl,
    paddingBottom: 40,
    maxHeight: '85%',
    borderTopWidth: 1,
    borderColor: palette.gray200,
  },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  title: { fontSize: 17, fontWeight: '700', color: palette.gray900 },
  scrollArea: { maxHeight: 400, marginBottom: spacing.lg },
  input: {
    fontSize: 15, color: palette.gray900, lineHeight: 22,
    minHeight: 200,
  },
  saveBtn: {
    borderRadius: radius.lg, paddingVertical: 14, alignItems: 'center',
  },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
