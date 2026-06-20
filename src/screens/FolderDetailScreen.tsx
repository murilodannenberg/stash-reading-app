import React, { useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet,
  TouchableOpacity, Alert, Share, Image,
} from 'react-native';
import { useRoute, useNavigation, useFocusEffect, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useArticleStore } from '../stores/articleStore';
import { useFolderStore } from '../stores/folderStore';
import { useAppThemeStore, getHomeColors } from '../stores/appThemeStore';
import { Article, Folder, RootStackParamList } from '../types';
import { spacing, radius, typography } from '../theme/colors';

type Route = RouteProp<RootStackParamList, 'FolderDetail'>;
type Nav = NativeStackNavigationProp<RootStackParamList>;

export function FolderDetailScreen() {
  const route = useRoute<Route>();
  const navigation = useNavigation<Nav>();
  const { folderId } = route.params;
  const { articles, loadArticles, deleteArticle, toggleFavorite } = useArticleStore();
  const { folders, loadFolders, deleteFolder } = useFolderStore();
  const { prefs: appTheme } = useAppThemeStore();
  const colors = getHomeColors(appTheme.homeTheme);
  const accent = appTheme.accentColor;

  useFocusEffect(
    useCallback(() => {
      loadArticles(folderId);
      loadFolders(folderId);
    }, [folderId, loadArticles, loadFolders])
  );

  const handleArticleActions = (article: Article) => {
    Alert.alert(article.title, undefined, [
      {
        text: 'Compartilhar',
        onPress: () => {
          Share.share({
            message: article.url
              ? `${article.title}\n${article.url}`
              : article.title,
            title: article.title,
          });
        },
      },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: () => {
          Alert.alert('Remover artigo', `Remover "${article.title}"?`, [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Remover', style: 'destructive', onPress: () => deleteArticle(article.id) },
          ]);
        },
      },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  };

  const handleFolderActions = (folder: Folder) => {
    Alert.alert(folder.name, undefined, [
      {
        text: 'Excluir estante',
        style: 'destructive',
        onPress: () => {
          Alert.alert('Remover estante', `Remover "${folder.name}" e todo seu conteudo?`, [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Remover', style: 'destructive', onPress: () => deleteFolder(folder.id) },
          ]);
        },
      },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  };

  const renderSubfolder = ({ item }: { item: Folder }) => (
    <TouchableOpacity
      style={[styles.folderCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
      activeOpacity={0.7}
      onPress={() => navigation.navigate('FolderDetail', { folderId: item.id, folderName: item.name })}
      onLongPress={() => handleFolderActions(item)}
    >
      <View style={[styles.folderIconWrap, { backgroundColor: accent + '18' }]}>
        <Ionicons name="library-outline" size={18} color={accent} />
      </View>
      <Text style={[styles.folderName, { color: colors.text }]} numberOfLines={1}>{item.name}</Text>
    </TouchableOpacity>
  );

  const renderArticle = ({ item }: { item: Article }) => (
    <TouchableOpacity
      style={[styles.articleCard, { backgroundColor: colors.background }]}
      activeOpacity={0.7}
      onPress={() => navigation.navigate('Reader', { articleId: item.id })}
      onLongPress={() => handleArticleActions(item)}
    >
      {item.cover_image_path != null ? (
        <Image
          source={{ uri: item.cover_image_path }}
          style={[styles.articleThumb, { backgroundColor: colors.inputBg }]}
          resizeMode="cover"
        />
      ) : (
        <View style={[styles.articleThumbPlaceholder, { backgroundColor: colors.inputBg }]}>
          <Ionicons name="document-text-outline" size={22} color={colors.textMuted} />
        </View>
      )}
      <View style={styles.articleBody}>
        <Text
          style={[styles.articleTitle, { color: colors.text }, item.is_read && { color: colors.textSecondary, fontWeight: '400' }]}
          numberOfLines={2}
        >
          {item.title}
        </Text>
        {item.author != null && <Text style={[styles.articleMeta, { color: colors.textMuted }]}>{item.author}</Text>}
        {item.reading_time_min != null && (
          <Text style={[styles.articleMeta, { color: colors.textMuted }]}>{item.reading_time_min} min</Text>
        )}
      </View>
      <View style={styles.articleActions}>
        <TouchableOpacity
          onPress={() => toggleFavorite(item.id)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons
            name={item.is_favorite ? 'bookmark' : 'bookmark-outline'}
            size={20}
            color={item.is_favorite ? accent : colors.textMuted}
          />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => {
            Share.share({
              message: item.url ? `${item.title}\n${item.url}` : item.title,
              title: item.title,
            });
          }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={{ marginTop: spacing.sm }}
        >
          <Ionicons name="share-outline" size={18} color={colors.textMuted} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {folders.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Seções</Text>
          <FlatList
            data={folders}
            keyExtractor={(f) => f.id}
            renderItem={renderSubfolder}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.folderRow}
          />
        </View>
      )}
      <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Artigos</Text>
      <FlatList
        data={articles}
        keyExtractor={(a) => a.id}
        renderItem={renderArticle}
        contentContainerStyle={styles.articleList}
        ItemSeparatorComponent={() => (
          <View style={[styles.separator, { backgroundColor: colors.border }]} />
        )}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Ionicons name="document-text-outline" size={40} color={colors.textMuted} />
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>Nenhum artigo nesta estante</Text>
          </View>
        }
      />

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: accent, shadowColor: accent }]}
        activeOpacity={0.8}
        onPress={() => navigation.navigate('AddArticle', { folderId })}
      >
        <Ionicons name="add" size={26} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  section: { marginTop: spacing.lg },
  sectionLabel: {
    ...typography.label,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.lg,
  },
  folderRow: { paddingHorizontal: spacing.md },
  folderCard: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: radius.md, paddingVertical: spacing.sm, paddingHorizontal: spacing.md,
    marginHorizontal: spacing.xs,
    borderWidth: 1,
  },
  folderIconWrap: {
    width: 28, height: 28, borderRadius: radius.sm,
    justifyContent: 'center', alignItems: 'center', marginRight: spacing.sm,
  },
  folderName: { ...typography.caption, fontWeight: '500' },
  articleList: { paddingBottom: 100 },
  separator: { height: 0.5, marginHorizontal: spacing.lg },
  articleCard: {
    flexDirection: 'row', alignItems: 'flex-start',
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
  },
  articleThumb: {
    width: 56, height: 56, borderRadius: radius.sm,
    marginRight: spacing.md,
  },
  articleThumbPlaceholder: {
    width: 56, height: 56, borderRadius: radius.sm,
    marginRight: spacing.md,
    justifyContent: 'center', alignItems: 'center',
  },
  articleBody: { flex: 1 },
  articleTitle: { ...typography.title, marginBottom: 4 },
  articleMeta: { ...typography.caption },
  articleActions: { marginLeft: spacing.sm, alignItems: 'center' },
  emptyWrap: { alignItems: 'center', marginTop: 60 },
  emptyText: { ...typography.body, marginTop: spacing.md },
  fab: {
    position: 'absolute', bottom: 24, right: spacing.lg,
    width: 54, height: 54, borderRadius: 27,
    justifyContent: 'center', alignItems: 'center',
    elevation: 6,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8,
  },
});
