import React, { useCallback, useState, useEffect, useMemo } from 'react';
import {
  View, Text, FlatList, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, Modal, Pressable, Share, Image,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  IconSearch, IconPlus, IconFileText,
  IconBookmark, IconBookmarkFilled, IconShare2,
  IconAdjustments, IconX, IconCircleX,
  IconStack2, IconEyeOff, IconCircleCheck,
  IconTrash, IconArchive, IconArchiveOff, IconClock, IconTag,
} from '@tabler/icons-react-native';
import { ActionSheet } from '../components/ActionSheet';
import { TagPicker } from '../components/TagPicker';
import { useArticleStore } from '../stores/articleStore';
import { useTagStore } from '../stores/tagStore';
import { useAppThemeStore, getHomeColors } from '../stores/appThemeStore';
import { RootStackParamList, Article, Tag } from '../types';
import { spacing, radius, typography, palette } from '../theme/colors';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type StatusFilter = 'all' | 'unread' | 'read' | 'favorites' | 'archived';
type TablerIcon = React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;

const FILTERS: { key: StatusFilter; label: string; Icon: TablerIcon }[] = [
  { key: 'all',       label: 'Todos',      Icon: IconStack2 },
  { key: 'unread',    label: 'Nao lidos',  Icon: IconEyeOff },
  { key: 'read',      label: 'Lidos',      Icon: IconCircleCheck },
  { key: 'favorites', label: 'Favoritos',  Icon: IconBookmark },
  { key: 'archived',  label: 'Arquivados', Icon: IconArchive },
];

export function LibraryScreen() {
  const navigation = useNavigation<Nav>();
  const {
    articles, loadArticles, loadArticlesByTag, loadArchivedArticles,
    trashArticle, archiveArticle, unarchiveArticle, toggleFavorite,
  } = useArticleStore();
  const { tags, loadTags } = useTagStore();
  const { prefs: appTheme, _hydrate } = useAppThemeStore();
  const colors = getHomeColors(appTheme.homeTheme);
  const accent = appTheme.accentColor;

  const [showFilterSheet, setShowFilterSheet] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sheetArticle, setSheetArticle] = useState<Article | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [tagPickerArticleId, setTagPickerArticleId] = useState<string | null>(null);
  useEffect(() => { _hydrate(); }, [_hydrate]);

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity
            onPress={() => navigation.navigate('Tags')}
            style={{ paddingHorizontal: 8, paddingVertical: 6 }}
          >
            <IconTag size={22} color={colors.textMuted} strokeWidth={1.75} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.navigate('Search')}
            style={{ paddingHorizontal: 8, paddingVertical: 6 }}
          >
            <IconSearch size={22} color={colors.textMuted} strokeWidth={1.75} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.navigate('AddArticle', {})}
            style={{ paddingHorizontal: 8, paddingVertical: 6 }}
          >
            <IconPlus size={26} color={accent} strokeWidth={2} />
          </TouchableOpacity>
        </View>
      ),
    });
  }, [navigation, accent, colors.textMuted]);

  useFocusEffect(
    useCallback(() => {
      loadTags();
      if (statusFilter === 'archived') {
        loadArchivedArticles();
      } else if (selectedTag) {
        loadArticlesByTag(selectedTag);
      } else {
        loadArticles(null);
      }
    }, [loadArticles, loadTags, loadArticlesByTag, loadArchivedArticles, selectedTag, statusFilter])
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
    if (statusFilter === 'unread')         result = result.filter((a) => !a.is_read);
    else if (statusFilter === 'read')      result = result.filter((a) => a.is_read);
    else if (statusFilter === 'favorites') result = result.filter((a) => a.is_favorite);

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          (a.author != null && a.author.toLowerCase().includes(q))
      );
    }
    return result;
  }, [articles, statusFilter, searchQuery]);

  const showFeatured =
    statusFilter === 'all' && !selectedTag && !searchQuery.trim() && filteredArticles.length > 0;

  const hasActiveFilters =
    statusFilter !== 'all' || selectedTag !== null || searchQuery.trim().length > 0;
  const activeFilterCount =
    (statusFilter !== 'all' ? 1 : 0) + (selectedTag ? 1 : 0) + (searchQuery.trim() ? 1 : 0);
  const selectedTagObj = selectedTag ? tags.find((t: Tag) => t.id === selectedTag) : null;

  const clearAllFilters = useCallback(() => {
    setStatusFilter('all');
    setSelectedTag(null);
    setSearchQuery('');
    loadArticles(null);
  }, [loadArticles]);

  const handleShareArticle = useCallback((article: Article) => {
    Share.share({
      message: article.url ? `${article.title}\n${article.url}` : article.title,
      title: article.title,
    });
  }, []);

  // ─── Hero card ─────────────────────────────────────────────────────────────

  const HeroCard = ({ article }: { article: Article }) => {
    const hasImage = article.cover_image_path != null;

    return (
      <TouchableOpacity
        style={[
          styles.heroCard,
          { backgroundColor: colors.surface },
          !hasImage && { borderLeftWidth: 4, borderLeftColor: accent },
        ]}
        activeOpacity={0.88}
        onPress={() => navigation.navigate('Reader', { articleId: article.id })}
        onLongPress={() => setSheetArticle(article)}
      >
        {hasImage && (
          <Image
            source={{ uri: article.cover_image_path! }}
            style={styles.heroImage}
            resizeMode="cover"
          />
        )}
        <View style={[styles.heroContent, hasImage && styles.heroContentBorder, { borderTopColor: colors.border }]}>
          <View style={styles.heroMeta}>
            {!article.is_read && (
              <View style={[styles.unreadBadge, { backgroundColor: accent }]}>
                <Text style={styles.unreadBadgeText}>Novo</Text>
              </View>
            )}
            {article.reading_time_min != null && (
              <View style={styles.metaBadge}>
                <IconClock size={11} color={colors.textMuted} strokeWidth={1.75} />
                <Text style={[styles.metaBadgeText, { color: colors.textMuted }]}>
                  {article.reading_time_min} min
                </Text>
              </View>
            )}
          </View>
          <Text
            style={[styles.heroTitle, { color: colors.text }]}
            numberOfLines={hasImage ? 2 : 3}
          >
            {article.title}
          </Text>
          {article.author != null && (
            <Text style={[styles.heroAuthor, { color: colors.textMuted }]} numberOfLines={1}>
              {article.author}
            </Text>
          )}
          {!hasImage && article.content_text != null && (
            <Text style={[styles.heroExcerpt, { color: colors.textSecondary }]} numberOfLines={2}>
              {article.content_text.slice(0, 120)}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  // ─── Recent card ───────────────────────────────────────────────────────────

  const RecentCard = ({ article }: { article: Article }) => {
    const hasImage = article.cover_image_path != null;
    return (
      <TouchableOpacity
        style={[styles.recentCard, { backgroundColor: colors.surface }]}
        activeOpacity={0.85}
        onPress={() => navigation.navigate('Reader', { articleId: article.id })}
        onLongPress={() => setSheetArticle(article)}
      >
        {hasImage ? (
          <Image
            source={{ uri: article.cover_image_path! }}
            style={styles.recentImage}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.recentImage, styles.recentPlaceholder, { backgroundColor: accent + '14' }]}>
            <IconFileText size={26} color={accent} strokeWidth={1.25} />
          </View>
        )}
        <View style={styles.recentBody}>
          {!article.is_read && (
            <View style={[styles.recentDot, { backgroundColor: accent }]} />
          )}
          <Text style={[styles.recentTitle, { color: colors.text }]} numberOfLines={3}>
            {article.title}
          </Text>
          {article.reading_time_min != null && (
            <Text style={[styles.recentTime, { color: colors.textMuted }]}>
              {article.reading_time_min} min
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  // ─── Article list item ─────────────────────────────────────────────────────

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
          style={[
            styles.articleTitle,
            { color: colors.text },
            item.is_read && { color: colors.textSecondary, fontWeight: '400' },
          ]}
          numberOfLines={2}
        >
          {item.title}
        </Text>
        {(item.author != null || item.reading_time_min != null) && (
          <Text style={[styles.metaText, { color: colors.textMuted }]} numberOfLines={1}>
            {[
              item.author,
              item.reading_time_min != null ? `${item.reading_time_min} min` : null,
            ].filter(Boolean).join(' · ')}
          </Text>
        )}
      </View>
      <TouchableOpacity
        style={styles.favoriteBtn}
        onPress={() => toggleFavorite(item.id)}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        {item.is_favorite
          ? <IconBookmarkFilled size={22} color={accent} />
          : <IconBookmark size={22} color={colors.textMuted} strokeWidth={1.5} />
        }
      </TouchableOpacity>
    </TouchableOpacity>
  );

  // ─── List header ───────────────────────────────────────────────────────────

  const ListHeader = () => (
    <View>
      {/* Filter bar */}
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

      {/* ── Featured section ── */}
      {showFeatured && (
        <View>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary, marginTop: spacing.xl }]}>
            Salvo recentemente
          </Text>
          <HeroCard article={filteredArticles[0]} />

          {filteredArticles.length > 1 && (
            <>
              <Text style={[styles.sectionLabel, { color: colors.textSecondary, marginTop: spacing.lg }]}>
                Adicionados recentemente
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.recentRow}
              >
                {filteredArticles.slice(1, 5).map((article) => (
                  <RecentCard key={article.id} article={article} />
                ))}
              </ScrollView>
            </>
          )}

          <View style={[styles.sectionDivider, { backgroundColor: colors.border }]} />
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
            Todos
            <Text style={{ color: colors.textMuted, fontWeight: '400' }}> {filteredArticles.length}</Text>
          </Text>
        </View>
      )}

      {/* Section label when filters active */}
      {!showFeatured && (
        <View style={styles.sectionRow}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
            {statusFilter === 'archived' ? 'Arquivados' : 'Artigos'}
            {filteredArticles.length > 0 && (
              <Text style={{ color: colors.textMuted, fontWeight: '400' }}> {filteredArticles.length}</Text>
            )}
          </Text>
        </View>
      )}
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
              {statusFilter === 'archived'
                ? 'Nenhum artigo arquivado'
                : hasActiveFilters
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

      {/* Article action sheet */}
      <ActionSheet
        visible={sheetArticle != null}
        onClose={() => setSheetArticle(null)}
        title={sheetArticle?.title}
        actions={sheetArticle ? [
          {
            label: 'Compartilhar',
            Icon: IconShare2,
            onPress: () => handleShareArticle(sheetArticle),
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

      <TagPicker
        visible={tagPickerArticleId != null}
        onClose={() => setTagPickerArticleId(null)}
        articleId={tagPickerArticleId ?? ''}
      />

      {/* Filter bottom sheet */}
      <Modal
        visible={showFilterSheet}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFilterSheet(false)}
      >
        <TouchableOpacity
          style={styles.sheetOverlay}
          activeOpacity={1}
          onPress={() => setShowFilterSheet(false)}
        >
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

            <TouchableOpacity
              style={[styles.trashLink, { borderTopColor: colors.border }]}
              onPress={() => { setShowFilterSheet(false); navigation.navigate('Trash'); }}
              activeOpacity={0.7}
            >
              <IconTrash size={16} color={colors.textMuted} strokeWidth={1.5} />
              <Text style={[styles.trashLinkText, { color: colors.textMuted }]}>Ver lixeira</Text>
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

  // ── Filter bar ──────────────────────────────────────────────────────────────
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

  // ── Hero card ───────────────────────────────────────────────────────────────
  heroCard: {
    marginHorizontal: spacing.lg,
    borderRadius: radius.xl,
    overflow: 'hidden',
  },
  heroImage: { width: '100%', height: 190 },
  heroContent: { padding: spacing.lg },
  heroContentBorder: { borderTopWidth: 1 },
  heroMeta: {
    flexDirection: 'row', alignItems: 'center',
    gap: spacing.sm, marginBottom: spacing.sm,
  },
  unreadBadge: {
    borderRadius: radius.xs,
    paddingHorizontal: 6, paddingVertical: 2,
  },
  unreadBadgeText: { fontSize: 10, fontWeight: '700', color: '#fff', letterSpacing: 0.4 },
  metaBadge: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  metaBadgeText: { fontSize: 12 },
  heroTitle: {
    fontSize: 18, fontWeight: '700',
    lineHeight: 24, letterSpacing: -0.2,
    marginBottom: spacing.xs,
  },
  heroAuthor: { fontSize: 13, marginBottom: spacing.xs },
  heroExcerpt: { fontSize: 13, lineHeight: 19, marginTop: spacing.xs },

  // ── Recent cards row ────────────────────────────────────────────────────────
  recentRow: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    paddingBottom: spacing.xs,
  },
  recentCard: {
    width: 148,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  recentImage: { width: '100%', height: 96 },
  recentPlaceholder: { justifyContent: 'center', alignItems: 'center' },
  recentBody: { padding: spacing.sm, minHeight: 72 },
  recentDot: { width: 6, height: 6, borderRadius: 3, marginBottom: 4 },
  recentTitle: { fontSize: 13, fontWeight: '600', lineHeight: 18 },
  recentTime: { fontSize: 11, marginTop: 4 },

  // ── Section labels ──────────────────────────────────────────────────────────
  sectionLabel: {
    ...typography.label,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  sectionRow: { marginTop: spacing.lg },
  sectionDivider: { height: 1, marginHorizontal: spacing.lg, marginTop: spacing.xl, marginBottom: spacing.lg },

  // ── Article list items ──────────────────────────────────────────────────────
  separator: { height: 0.5, marginHorizontal: spacing.lg },
  articleCard: {
    flexDirection: 'row', alignItems: 'flex-start',
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
  },
  articleThumb: {
    width: 56, height: 56, borderRadius: radius.sm, marginRight: spacing.md,
  },
  articleThumbPlaceholder: {
    width: 56, height: 56, borderRadius: radius.sm, marginRight: spacing.md,
    justifyContent: 'center', alignItems: 'center',
  },
  articleBody: { flex: 1 },
  articleTitle: { ...typography.title, marginBottom: 4 },
  metaText: { ...typography.caption },
  favoriteBtn: { marginLeft: spacing.md, padding: 4 },

  // ── Empty state ─────────────────────────────────────────────────────────────
  emptyWrap: { alignItems: 'center', marginTop: 80 },
  emptyTitle: { ...typography.heading, marginTop: spacing.lg },
  emptySubtitle: { ...typography.body, marginTop: spacing.xs },

  // ── Filter sheet ────────────────────────────────────────────────────────────
  sheetOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.35)' },
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
  sheetLabel: { ...typography.label, marginBottom: spacing.sm, marginTop: spacing.md },
  sheetSearchWrap: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: radius.md, paddingHorizontal: spacing.md, marginBottom: spacing.sm,
  },
  sheetSearchInput: { flex: 1, paddingVertical: spacing.sm, fontSize: 15 },
  sheetChipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
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
  trashLink: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.sm, marginTop: spacing.lg, paddingTop: spacing.lg, borderTopWidth: 0.5,
  },
  trashLinkText: { ...typography.body },
});
