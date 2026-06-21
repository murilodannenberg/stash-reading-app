import React, { useCallback, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet,
  TouchableOpacity, Alert, Share, Image,
} from 'react-native';
import { useRoute, useNavigation, useFocusEffect, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  IconFileText, IconBookmark, IconBookmarkFilled,
  IconShare2, IconPlus, IconTrash, IconArchive, IconArchiveOff, IconTag,
} from '@tabler/icons-react-native';
import { ShelfIcon } from '../components/ShelfIcon';
import { useArticleStore } from '../stores/articleStore';
import { useFolderStore } from '../stores/folderStore';
import { useAppThemeStore, getHomeColors } from '../stores/appThemeStore';
import { Article, Folder, RootStackParamList } from '../types';
import { spacing, radius, typography } from '../theme/colors';
import { ActionSheet } from '../components/ActionSheet';
import { TagPicker } from '../components/TagPicker';

type Route = RouteProp<RootStackParamList, 'FolderDetail'>;
type Nav = NativeStackNavigationProp<RootStackParamList>;

export function FolderDetailScreen() {
  const route = useRoute<Route>();
  const navigation = useNavigation<Nav>();
  const { folderId } = route.params;
  const { articles, loadArticles, trashArticle, archiveArticle, unarchiveArticle, toggleFavorite } = useArticleStore();
  const { folders, loadFolders, deleteFolder } = useFolderStore();
  const { prefs: appTheme } = useAppThemeStore();
  const colors = getHomeColors(appTheme.homeTheme);
  const accent = appTheme.accentColor;

  const [sheetArticle, setSheetArticle] = useState<Article | null>(null);
  const [sheetFolder, setSheetFolder] = useState<Folder | null>(null);
  const [tagPickerArticleId, setTagPickerArticleId] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      loadArticles(folderId);
      loadFolders(folderId);
    }, [folderId, loadArticles, loadFolders])
  );

  const renderSubfolder = ({ item }: { item: Folder }) => (
    <TouchableOpacity
      style={[styles.folderCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
      activeOpacity={0.7}
      onPress={() => navigation.navigate('FolderDetail', { folderId: item.id, folderName: item.name })}
      onLongPress={() => setSheetFolder(item)}
    >
      <View style={[styles.folderIconWrap, { backgroundColor: accent + '18' }]}>
        <ShelfIcon iconKey={item.icon ?? 'books'} size={18} color={accent} strokeWidth={1.5} />
      </View>
      <Text style={[styles.folderName, { color: colors.text }]} numberOfLines={1}>{item.name}</Text>
    </TouchableOpacity>
  );

  const renderArticle = ({ item }: { item: Article }) => (
    <TouchableOpacity
      style={[styles.articleCard, { backgroundColor: colors.background }]}
      activeOpacity={0.7}
      onPress={() => navigation.navigate('Reader', { articleId: item.id })}
      onLongPress={() => setSheetArticle(item)}
    >
      {item.cover_image_path != null ? (
        <Image
          source={{ uri: item.cover_image_path }}
          style={[styles.articleThumb, { backgroundColor: colors.inputBg }]}
          resizeMode="cover"
        />
      ) : (
        <View style={[styles.articleThumbPlaceholder, { backgroundColor: colors.inputBg }]}>
          <IconFileText size={22} color={colors.textMuted} strokeWidth={1.5} />
        </View>
      )}
      <View style={styles.articleBody}>
        <Text
          style={[styles.articleTitle, { color: colors.text }, item.is_read && { color: colors.textSecondary, fontWeight: '400' }]}
          numberOfLines={2}
        >
          {item.title}
        </Text>
        {(item.author != null || item.reading_time_min != null) && (
          <Text style={[styles.articleMeta, { color: colors.textMuted }]} numberOfLines={1}>
            {[
              item.author,
              item.reading_time_min != null ? `${item.reading_time_min} min` : null,
            ].filter(Boolean).join(' · ')}
          </Text>
        )}
      </View>
      <View style={styles.articleActions}>
        <TouchableOpacity
          onPress={() => toggleFavorite(item.id)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          {item.is_favorite
            ? <IconBookmarkFilled size={20} color={accent} />
            : <IconBookmark size={20} color={colors.textMuted} strokeWidth={1.5} />
          }
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
          <IconShare2 size={18} color={colors.textMuted} strokeWidth={1.5} />
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
            <IconFileText size={40} color={colors.textMuted} strokeWidth={1} />
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>Nenhum artigo nesta estante</Text>
          </View>
        }
      />

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: accent, shadowColor: accent }]}
        activeOpacity={0.8}
        onPress={() => navigation.navigate('AddArticle', { folderId })}
      >
        <IconPlus size={26} color="#fff" strokeWidth={2} />
      </TouchableOpacity>

      <ActionSheet
        visible={sheetArticle != null}
        onClose={() => setSheetArticle(null)}
        title={sheetArticle?.title}
        actions={sheetArticle ? [
          {
            label: 'Compartilhar',
            Icon: IconShare2,
            onPress: () => Share.share({
              message: sheetArticle.url
                ? `${sheetArticle.title}\n${sheetArticle.url}`
                : sheetArticle.title,
              title: sheetArticle.title,
            }),
          },
          {
            label: 'Gerenciar tags',
            Icon: IconTag,
            onPress: () => setTagPickerArticleId(sheetArticle.id),
          },
          {
            label: sheetArticle.is_archived ? 'Remover do arquivo' : 'Arquivar',
            Icon: sheetArticle.is_archived ? IconArchiveOff : IconArchive,
            onPress: () => sheetArticle.is_archived
              ? unarchiveArticle(sheetArticle.id)
              : archiveArticle(sheetArticle.id),
          },
          {
            label: 'Mover para lixeira',
            style: 'destructive',
            Icon: IconTrash,
            onPress: () => trashArticle(sheetArticle.id),
          },
        ] : []}
      />

      <ActionSheet
        visible={sheetFolder != null}
        onClose={() => setSheetFolder(null)}
        title={sheetFolder?.name}
        actions={sheetFolder ? [
          {
            label: 'Excluir estante',
            style: 'destructive',
            Icon: IconTrash,
            onPress: () => Alert.alert('Remover estante', `Remover "${sheetFolder.name}" e todo seu conteudo?`, [
              { text: 'Cancelar', style: 'cancel' },
              { text: 'Remover', style: 'destructive', onPress: () => deleteFolder(sheetFolder.id) },
            ]),
          },
        ] : []}
      />

      <TagPicker
        visible={tagPickerArticleId != null}
        onClose={() => setTagPickerArticleId(null)}
        articleId={tagPickerArticleId ?? ''}
      />
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
