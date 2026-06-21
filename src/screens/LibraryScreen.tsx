import React, { useCallback, useState, useEffect, useMemo } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  TextInput, Alert, Modal, Pressable, Share, Image,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  IconSearch, IconPlus, IconFileText,
  IconBookmark, IconBookmarkFilled, IconShare2,
  IconAdjustments, IconX, IconCircleX,
  IconStack2, IconEyeOff, IconCircleCheck,
} from '@tabler/icons-react-native';
import { useArticleStore } from '../stores/articleStore';
import { useTagStore } from '../stores/tagStore';
import { useAppThemeStore, getHomeColors } from '../stores/appThemeStore';
import { RootStackParamList, Article, Tag } from '../types';
import { spacing, radius, typography } from '../theme/colors';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type StatusFilter = 'all' | 'unread' | 'read' | 'favorites';
type TablerIcon = React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;

const FILTERS: { key: StatusFilter; label: string; Icon: TablerIcon }[] = [
  { key: 'all', label: 'Todos', Icon: IconStack2 },
  { key: 'unread', label: 'Nao lidos', Icon: IconEyeOff },
  { key: 'read', label: 'Lidos', Icon: IconCircleCheck },
  { key: 'favorites', label: 'Favoritos', Icon: IconBookmark },
];

export function LibraryScreen() {
  const navigation = useNavigation<Nav>();
  const { articles, loadArticles, loadArticlesByTag, deleteArticle, toggleFavorite } = useArticleStore();
  const { tags, loadTags } = useTagStore();
  const { prefs: appTheme, _hydrate } = useAppThemeStore();
  const colors = getHomeColors(appTheme.homeTheme);
  const accent = appTheme.accentColor;

  const [showFilterSheet, setShowFilterSheet] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => { _hydrate(); }, [_hydrate]);

  // Botões de busca e adicionar artigo no header
  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity
            onPress={() => navigation.navigate('Search')}
            style={{ paddingHorizontal: 10, paddingVertical: 6 }}
          >
            <IconSearch size={22} color={accent} strokeWidth={1.75} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.navigate('AddArticle', {})}
            style={{ paddingHorizontal: 10, paddingVertical: 6 }}
          >
            <IconPlus size={26} color={accent} strokeWidth={2} />
          </TouchableOpacity>
        </View>
      ),
    });
  }, [navigation, accent]);

  useFocusEffect(
    useCallback(() => {
      loadTags();
      if (selectedTag) {
        loadArticlesByTag(selectedTag);
      } else {
        loadArticles(null);
      }
    }, [loadArticles, loadTags, loadArticlesByTag, selectedTag])
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

  const handleShareArticle = useCallback((article: Article) => {
    Share.share({
      message: article.url
        ? `${article.title}\n${article.url}`
        : article.title,
      title: article.title,
    });
  }, []);

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
          {item.is_favorite
            ? <IconBookmarkFilled size={20} color={accent} />
            : <IconBookmark size={20} color={colors.textMuted} strokeWidth={1.5} />
          }
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => handleShareArticle(item)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={{ marginTop: spacing.sm }}
        >
          <IconShare2 size={18} color={colors.textMuted} strokeWidth={1.5} />
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
          <IconAdjustments
            size={18}
            color={hasActiveFilters ? '#fff' : colors.textMuted}
            strokeWidth={1.75}
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
              <IconX size={14} color={colors.textMuted} strokeWidth={2} />
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <Text style={[styles.filterHint, { color: colors.textMuted }]}>Todos os artigos</Text>
          }
        />
      </View>

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
        ItemSeparatorComponent={() => (
          <View style={[styles.separator, { backgroundColor: colors.border }]} />
        )}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <IconFileText size={48} color={colors.textMuted} strokeWidth={1} />
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
              <IconSearch size={16} color={colors.textMuted} strokeWidth={1.5} style={{ marginRight: spacing.sm }} />
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
                  <IconCircleX size={16} color={colors.textMuted} strokeWidth={1.5} />
                </TouchableOpacity>
              )}
            </View>

            {/* Status */}
            <Text style={[styles.sheetLabel, { color: colors.textSecondary }]}>Status</Text>
            <View style={styles.sheetChipRow}>
              {FILTERS.map((f) => {
                const isActive = statusFilter === f.key;
                const FilterIcon = f.Icon;
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
                    <FilterIcon size={16} color={isActive ? accent : colors.textMuted} strokeWidth={1.5} />
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

  separator: { height: 0.5, marginHorizontal: spacing.lg },

  // Articles
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
  articleMeta: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 4 },
  metaText: { ...typography.caption },
  excerpt: { ...typography.caption, lineHeight: 18 },
  articleActions: { marginLeft: spacing.sm, alignItems: 'center' },

  // Empty
  emptyWrap: { alignItems: 'center', marginTop: 80 },
  emptyTitle: { ...typography.heading, marginTop: spacing.lg },
  emptySubtitle: { ...typography.body, marginTop: spacing.xs },

});
