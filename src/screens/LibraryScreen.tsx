import React, { useCallback, useState, useEffect, useMemo } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  TextInput, Alert, Modal, Pressable, Share, Image,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useFolderStore } from '../stores/folderStore';
import { useArticleStore } from '../stores/articleStore';
import { useTagStore } from '../stores/tagStore';
import { useAppThemeStore, getHomeColors } from '../stores/appThemeStore';
import { RootStackParamList, Article, Folder, Tag } from '../types';
import { spacing, radius, typography } from '../theme/colors';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type StatusFilter = 'all' | 'unread' | 'read' | 'favorites';

const FILTERS: { key: StatusFilter; label: string; icon: string }[] = [
  { key: 'all', label: 'Todos', icon: 'layers-outline' },
  { key: 'unread', label: 'Nao lidos', icon: 'eye-off-outline' },
  { key: 'read', label: 'Lidos', icon: 'checkmark-circle-outline' },
  { key: 'favorites', label: 'Favoritos', icon: 'bookmark-outline' },
];

export function LibraryScreen() {
  const navigation = useNavigation<Nav>();
  const { folders, loadFolders, createFolder, deleteFolder } = useFolderStore();
  const { articles, loadArticles, loadArticlesByTag, deleteArticle, toggleFavorite } = useArticleStore();
  const { tags, loadTags } = useTagStore();
  const { prefs: appTheme, _hydrate } = useAppThemeStore();
  const colors = getHomeColors(appTheme.homeTheme);
  const accent = appTheme.accentColor;

  const [newFolderName, setNewFolderName] = useState('');
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [showFilterSheet, setShowFilterSheet] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => { _hydrate(); }, [_hydrate]);

  useFocusEffect(
    useCallback(() => {
      loadFolders(null);
      loadTags();
      if (selectedTag) {
        loadArticlesByTag(selectedTag);
      } else {
        loadArticles(null);
      }
    }, [loadFolders, loadArticles, loadTags, loadArticlesByTag, selectedTag])
  );

  const handleTagFilter = useCallback((tagId: string) => {
    if (selectedTag === tagId) {
      setSelectedTag(null);
      loadArticles(null);
    } else {
      setSelectedTag(tagId);
      loadArticlesByTag(tagId);
    }
  }, [selectedTag, loadArticles, loadArticlesByTag]);

  const filteredArticles = useMemo(() => {
    let result = articles;

    // Status filter
    if (statusFilter === 'unread') result = result.filter((a) => !a.is_read);
    else if (statusFilter === 'read') result = result.filter((a) => a.is_read);
    else if (statusFilter === 'favorites') result = result.filter((a) => a.is_favorite);

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          (a.author && a.author.toLowerCase().includes(q))
      );
    }

    return result;
  }, [articles, statusFilter, searchQuery]);

  const hasActiveFilters = statusFilter !== 'all' || selectedTag !== null || searchQuery.trim().length > 0;
  const activeFilterCount = (statusFilter !== 'all' ? 1 : 0) + (selectedTag ? 1 : 0) + (searchQuery.trim() ? 1 : 0);
  const selectedTagObj = selectedTag ? tags.find((t: Tag) => t.id === selectedTag) : null;

  const clearAllFilters = useCallback(() => {
    setStatusFilter('all');
    setSelectedTag(null);
    setSearchQuery('');
    loadArticles(null);
  }, [loadArticles]);

  const handleCreateFolder = useCallback(async () => {
    if (!newFolderName.trim()) return;
    await createFolder(newFolderName.trim());
    setNewFolderName('');
    setShowFolderModal(false);
  }, [newFolderName, createFolder]);

  const handleArticleActions = useCallback((article: Article) => {
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
  }, [deleteArticle]);

  const handleFolderActions = useCallback((folder: Folder) => {
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
  }, [deleteFolder]);

  const handleShareArticle = useCallback((article: Article) => {
    Share.share({
      message: article.url
        ? `${article.title}\n${article.url}`
        : article.title,
      title: article.title,
    });
  }, []);

  const renderFolder = ({ item }: { item: Folder }) => (
    <TouchableOpacity
      style={[styles.folderCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
      activeOpacity={0.7}
      onPress={() => navigation.navigate('FolderDetail', { folderId: item.id, folderName: item.name })}
      onLongPress={() => handleFolderActions(item)}
    >
      <View style={[styles.folderIconWrap, { backgroundColor: accent + '18' }]}>
        <Ionicons name="library-outline" size={20} color={accent} />
      </View>
      <Text style={[styles.folderName, { color: colors.text }]} numberOfLines={1}>{item.name}</Text>
    </TouchableOpacity>
  );

  const renderArticle = ({ item }: { item: Article }) => (
    <TouchableOpacity
      style={[styles.articleCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
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
        <View style={styles.articleMeta}>
          {item.author != null && (
            <Text style={[styles.metaText, { color: colors.textMuted }]} numberOfLines={1}>{item.author}</Text>
          )}
          {item.reading_time_min != null && (
            <Text style={[styles.metaText, { color: colors.textMuted }]}>
              {item.author ? ' · ' : ''}{item.reading_time_min} min
            </Text>
          )}
        </View>
        {item.content_text != null && (
          <Text style={[styles.excerpt, { color: colors.textSecondary }]} numberOfLines={2}>
            {item.content_text.slice(0, 120)}
          </Text>
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
          onPress={() => handleShareArticle(item)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={{ marginTop: spacing.sm }}
        >
          <Ionicons name="share-outline" size={18} color={colors.textMuted} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const ListHeader = () => (
    <View>
      {/* Filter bar: icon + active chips */}
      <View style={[styles.filterBar, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.filterIconBtn, { backgroundColor: hasActiveFilters ? accent : colors.inputBg }]}
          onPress={() => setShowFilterSheet(true)}
          activeOpacity={0.7}
        >
          <Ionicons
            name="options-outline"
            size={18}
            color={hasActiveFilters ? '#fff' : colors.textMuted}
          />
          {activeFilterCount > 0 && (
            <View style={[styles.filterBadge, { backgroundColor: hasActiveFilters ? '#fff' : accent }]}>
              <Text style={[styles.filterBadgeText, { color: hasActiveFilters ? accent : '#fff' }]}>
                {activeFilterCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        <FlatList
          data={[
            ...(statusFilter !== 'all'
              ? [{ id: 'status', label: FILTERS.find((f) => f.key === statusFilter)!.label, type: 'status' as const }]
              : []),
            ...(selectedTagObj
              ? [{ id: 'tag', label: selectedTagObj.name, type: 'tag' as const, color: selectedTagObj.color }]
              : []),
            ...(searchQuery.trim()
              ? [{ id: 'search', label: `"${searchQuery.trim()}"`, type: 'search' as const }]
              : []),
          ]}
          keyExtractor={(i) => i.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.activeChipRow}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.activeChip, { backgroundColor: colors.inputBg }]}
              onPress={() => {
                if (item.type === 'status') setStatusFilter('all');
                else if (item.type === 'tag') { setSelectedTag(null); loadArticles(null); }
                else if (item.type === 'search') setSearchQuery('');
              }}
              activeOpacity={0.7}
            >
              {'color' in item && item.color && (
                <View style={[styles.tagDot, { backgroundColor: item.color }]} />
              )}
              <Text style={[styles.activeChipText, { color: colors.text }]} numberOfLines={1}>
                {item.label}
              </Text>
              <Ionicons name="close" size={14} color={colors.textMuted} />
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <Text style={[styles.filterHint, { color: colors.textMuted }]}>Todos os artigos</Text>
          }
        />
      </View>

      {/* Shelves */}
      {folders.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Estantes</Text>
          <FlatList
            data={folders}
            keyExtractor={(f) => f.id}
            renderItem={renderFolder}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.folderRow}
          />
        </View>
      )}

      {/* Articles header */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
            Artigos
            {filteredArticles.length > 0 && (
              <Text style={{ color: colors.textMuted, fontWeight: '400' }}> {filteredArticles.length}</Text>
            )}
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={filteredArticles}
        keyExtractor={(a) => a.id}
        renderItem={renderArticle}
        ListHeaderComponent={ListHeader}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Ionicons name="document-text-outline" size={48} color={colors.textMuted} />
            <Text style={[styles.emptyTitle, { color: colors.textSecondary }]}>
              {statusFilter !== 'all' || selectedTag || searchQuery
                ? 'Nenhum artigo encontrado'
                : 'Nenhum artigo ainda'}
            </Text>
            {statusFilter === 'all' && !selectedTag && !searchQuery && (
              <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
                Toque no + para salvar seu primeiro artigo
              </Text>
            )}
          </View>
        }
      />

      {/* FAB */}
      <View style={styles.fabRow}>
        <TouchableOpacity
          style={[styles.fabSmall, { backgroundColor: colors.surface, borderColor: colors.border }]}
          activeOpacity={0.8}
          onPress={() => setShowFolderModal(true)}
        >
          <Ionicons name="library-outline" size={20} color={accent} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: accent, shadowColor: accent }]}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('AddArticle', {})}
        >
          <Ionicons name="add" size={26} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Filter bottom sheet */}
      <Modal visible={showFilterSheet} transparent animationType="slide" onRequestClose={() => setShowFilterSheet(false)}>
        <TouchableOpacity style={styles.sheetOverlay} activeOpacity={1} onPress={() => setShowFilterSheet(false)}>
          <Pressable style={[styles.sheet, { backgroundColor: colors.surface }]}>
            <View style={styles.sheetHandle} />

            <View style={styles.sheetHeader}>
              <Text style={[styles.sheetTitle, { color: colors.text }]}>Filtros</Text>
              {hasActiveFilters && (
                <TouchableOpacity onPress={() => { clearAllFilters(); setShowFilterSheet(false); }}>
                  <Text style={[styles.sheetClear, { color: accent }]}>Limpar</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Search */}
            <Text style={[styles.sheetLabel, { color: colors.textSecondary }]}>Busca</Text>
            <View style={[styles.sheetSearchWrap, { backgroundColor: colors.inputBg }]}>
              <Ionicons name="search" size={16} color={colors.textMuted} style={{ marginRight: spacing.sm }} />
              <TextInput
                style={[styles.sheetSearchInput, { color: colors.text }]}
                placeholder="Buscar por titulo ou autor..."
                placeholderTextColor={colors.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
                returnKeyType="search"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={16} color={colors.textMuted} />
                </TouchableOpacity>
              )}
            </View>

            {/* Status */}
            <Text style={[styles.sheetLabel, { color: colors.textSecondary }]}>Status</Text>
            <View style={styles.sheetChipRow}>
              {FILTERS.map((f) => {
                const isActive = statusFilter === f.key;
                return (
                  <TouchableOpacity
                    key={f.key}
                    style={[
                      styles.sheetChip,
                      { backgroundColor: colors.inputBg },
                      isActive && { backgroundColor: accent + '15', borderColor: accent, borderWidth: 1.5 },
                    ]}
                    onPress={() => setStatusFilter(f.key)}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={f.icon as keyof typeof Ionicons.glyphMap}
                      size={16}
                      color={isActive ? accent : colors.textMuted}
                    />
                    <Text style={[
                      styles.sheetChipText,
                      { color: colors.textSecondary },
                      isActive && { color: accent, fontWeight: '600' },
                    ]}>
                      {f.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Tags */}
            {tags.length > 0 && (
              <>
                <Text style={[styles.sheetLabel, { color: colors.textSecondary }]}>Tags</Text>
                <View style={styles.sheetChipRow}>
                  {tags.map((tag: Tag) => {
                    const isActive = selectedTag === tag.id;
                    return (
                      <TouchableOpacity
                        key={tag.id}
                        style={[
                          styles.sheetChip,
                          { backgroundColor: colors.inputBg },
                          isActive && { backgroundColor: tag.color + '18', borderColor: tag.color, borderWidth: 1.5 },
                        ]}
                        onPress={() => handleTagFilter(tag.id)}
                        activeOpacity={0.7}
                      >
                        <View style={[styles.tagDot, { backgroundColor: tag.color }]} />
                        <Text style={[
                          styles.sheetChipText,
                          { color: colors.textSecondary },
                          isActive && { color: tag.color, fontWeight: '600' },
                        ]}>
                          {tag.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </>
            )}

            <TouchableOpacity
              style={[styles.sheetDoneBtn, { backgroundColor: accent }]}
              onPress={() => setShowFilterSheet(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.sheetDoneBtnText}>Aplicar</Text>
            </TouchableOpacity>
          </Pressable>
        </TouchableOpacity>
      </Modal>

      {/* New folder modal */}
      <Modal visible={showFolderModal} transparent animationType="fade">
        <Pressable style={styles.overlay} onPress={() => setShowFolderModal(false)}>
          <Pressable style={[styles.modal, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Nova estante</Text>
            <TextInput
              style={[styles.modalInput, { borderColor: colors.border, color: colors.text }]}
              placeholder="Nome da estante"
              placeholderTextColor={colors.textMuted}
              value={newFolderName}
              onChangeText={setNewFolderName}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleCreateFolder}
            />
            <View style={styles.modalBtns}>
              <TouchableOpacity
                style={styles.modalBtnCancel}
                onPress={() => setShowFolderModal(false)}
              >
                <Text style={[styles.modalBtnCancelText, { color: colors.textSecondary }]}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtnConfirm, { backgroundColor: accent }]}
                onPress={handleCreateFolder}
              >
                <Text style={styles.modalBtnConfirmText}>Criar</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { paddingBottom: 100 },

  // Filter bar
  filterBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.lg, paddingVertical: spacing.sm,
    borderBottomWidth: 1, gap: spacing.sm,
  },
  filterIconBtn: {
    width: 36, height: 36, borderRadius: radius.sm,
    justifyContent: 'center', alignItems: 'center',
  },
  filterBadge: {
    position: 'absolute', top: -4, right: -4,
    width: 18, height: 18, borderRadius: 9,
    justifyContent: 'center', alignItems: 'center',
  },
  filterBadgeText: { fontSize: 10, fontWeight: '700' },
  activeChipRow: { gap: spacing.xs, paddingRight: spacing.sm },
  activeChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: spacing.md, paddingVertical: 6,
    borderRadius: radius.full,
  },
  activeChipText: { fontSize: 13, fontWeight: '500', maxWidth: 120 },
  filterHint: { fontSize: 13, paddingVertical: 6 },
  tagDot: { width: 8, height: 8, borderRadius: 4 },

  // Filter bottom sheet
  sheetOverlay: {
    flex: 1, justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  sheet: {
    borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing.xl, paddingBottom: 40, paddingTop: spacing.md,
  },
  sheetHandle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: '#d1d5db', alignSelf: 'center', marginBottom: spacing.lg,
  },
  sheetHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: spacing.lg,
  },
  sheetTitle: { ...typography.heading },
  sheetClear: { ...typography.body, fontWeight: '600' },
  sheetLabel: {
    ...typography.label, marginBottom: spacing.sm, marginTop: spacing.md,
  },
  sheetSearchWrap: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: radius.md, paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  sheetSearchInput: { flex: 1, paddingVertical: spacing.sm, fontSize: 15 },
  sheetChipRow: {
    flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm,
  },
  sheetChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: spacing.lg, paddingVertical: spacing.sm,
    borderRadius: radius.full, borderWidth: 1, borderColor: 'transparent',
  },
  sheetChipText: { fontSize: 14 },
  sheetDoneBtn: {
    marginTop: spacing.xl, borderRadius: radius.md,
    paddingVertical: 14, alignItems: 'center',
  },
  sheetDoneBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },

  // Sections
  section: { marginTop: spacing.lg },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  sectionLabel: {
    ...typography.label,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.lg,
  },

  // Folders
  folderRow: { paddingHorizontal: spacing.md },
  folderCard: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: radius.md, paddingVertical: spacing.sm, paddingHorizontal: spacing.md,
    marginHorizontal: spacing.xs,
    borderWidth: 1, minWidth: 100,
  },
  folderIconWrap: {
    width: 32, height: 32, borderRadius: radius.sm,
    justifyContent: 'center', alignItems: 'center', marginRight: spacing.sm,
  },
  folderName: { ...typography.subheading, flexShrink: 1 },

  // Articles
  articleCard: {
    flexDirection: 'row', alignItems: 'flex-start',
    marginHorizontal: spacing.lg, marginBottom: spacing.sm,
    borderRadius: radius.lg, padding: spacing.lg,
    borderWidth: 1,
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
  articleTitle: { ...typography.subheading, marginBottom: 4 },
  articleMeta: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 4 },
  metaText: { ...typography.caption },
  excerpt: { ...typography.caption, lineHeight: 18 },
  articleActions: { marginLeft: spacing.sm, alignItems: 'center' },

  // Empty
  emptyWrap: { alignItems: 'center', marginTop: 80 },
  emptyTitle: { ...typography.heading, marginTop: spacing.lg },
  emptySubtitle: { ...typography.body, marginTop: spacing.xs },

  // FABs
  fabRow: {
    position: 'absolute', bottom: 24, right: spacing.lg,
    flexDirection: 'row', gap: spacing.md, alignItems: 'center',
  },
  fab: {
    width: 54, height: 54, borderRadius: 27,
    justifyContent: 'center', alignItems: 'center',
    elevation: 6,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8,
  },
  fabSmall: {
    width: 44, height: 44, borderRadius: 22,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1.5,
    elevation: 3,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 4,
  },

  // Modal
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center', alignItems: 'center',
  },
  modal: {
    borderRadius: radius.xl,
    padding: spacing['2xl'], width: 300,
    elevation: 8,
  },
  modalTitle: { ...typography.heading, marginBottom: spacing.lg },
  modalInput: {
    borderWidth: 1, borderRadius: radius.md,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    fontSize: 15, marginBottom: spacing.lg,
  },
  modalBtns: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.sm },
  modalBtnCancel: { paddingVertical: spacing.sm, paddingHorizontal: spacing.lg },
  modalBtnCancelText: { ...typography.body },
  modalBtnConfirm: {
    paddingVertical: spacing.sm, paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
  },
  modalBtnConfirmText: { ...typography.body, color: '#fff', fontWeight: '600' },
});
