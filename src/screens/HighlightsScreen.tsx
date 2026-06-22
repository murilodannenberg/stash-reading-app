import React, { useCallback, useState, useMemo } from 'react';
import {
  View, Text, SectionList, StyleSheet, TouchableOpacity, Alert,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { IconHighlight, IconTrash, IconX } from '@tabler/icons-react-native';
import { useHighlightStore } from '../stores/highlightStore';
import { useAppThemeStore, getHomeColors } from '../stores/appThemeStore';
import { HighlightWithArticle } from '../database/repositories/highlights';
import { spacing, radius, typography } from '../theme/colors';
import { RootStackParamList } from '../types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const FILTER_COLORS = [
  { color: '#fde047', label: 'Amarelo' },
  { color: '#fda4af', label: 'Rosa' },
  { color: '#93c5fd', label: 'Azul' },
  { color: '#86efac', label: 'Verde' },
  { color: '#fdba74', label: 'Laranja' },
];

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

type Section = {
  title: string;
  articleId: string;
  data: HighlightWithArticle[];
};

export function HighlightsScreen() {
  const navigation = useNavigation<Nav>();
  const { allHighlights, loadAllHighlights, removeHighlight } = useHighlightStore();
  const { prefs: appTheme } = useAppThemeStore();
  const colors = getHomeColors(appTheme.homeTheme);
  const accent = appTheme.accentColor;

  const [colorFilter, setColorFilter] = useState<string | null>(null);

  useFocusEffect(useCallback(() => { loadAllHighlights(); }, [loadAllHighlights]));

  const handleDelete = useCallback((item: HighlightWithArticle) => {
    Alert.alert(
      'Remover destaque',
      'Deseja remover este destaque?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: () => removeHighlight(item.id),
        },
      ],
    );
  }, [removeHighlight]);

  const sections: Section[] = useMemo(() => {
    const filtered = colorFilter
      ? allHighlights.filter((h) => h.color === colorFilter)
      : allHighlights;

    const map = new Map<string, { title: string; articleId: string; items: HighlightWithArticle[] }>();
    for (const h of filtered) {
      if (!map.has(h.article_id)) {
        map.set(h.article_id, { title: h.article_title, articleId: h.article_id, items: [] });
      }
      map.get(h.article_id)!.items.push(h);
    }
    return Array.from(map.values()).map(({ title, articleId, items }) => ({
      title,
      articleId,
      data: items,
    }));
  }, [allHighlights, colorFilter]);

  const renderItem = ({ item }: { item: HighlightWithArticle }) => (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
      activeOpacity={0.7}
      onPress={() => navigation.navigate('Reader', { articleId: item.article_id })}
    >
      <View style={[styles.colorBar, { backgroundColor: item.color }]} />
      <View style={styles.cardBody}>
        <Text style={[styles.quote, { color: colors.text }]}>
          {item.selected_text}
        </Text>
        <Text style={[styles.date, { color: colors.textMuted }]}>
          {formatDate(item.created_at)}
        </Text>
      </View>
      <TouchableOpacity
        onPress={() => handleDelete(item)}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        style={styles.deleteBtn}
      >
        <IconTrash size={16} color={colors.textMuted} strokeWidth={1.5} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderSectionHeader = ({ section }: { section: Section }) => (
    <TouchableOpacity
      style={[styles.sectionHeader, { backgroundColor: colors.background }]}
      onPress={() => navigation.navigate('Reader', { articleId: section.articleId })}
      activeOpacity={0.7}
    >
      <Text style={[styles.sectionTitle, { color: colors.textSecondary }]} numberOfLines={1}>
        {section.title}
      </Text>
      <Text style={[styles.sectionCount, { color: colors.textMuted }]}>
        {section.data.length} {section.data.length === 1 ? 'destaque' : 'destaques'}
      </Text>
    </TouchableOpacity>
  );

  const ListHeader = () => (
    <View style={[styles.filterRow, { borderBottomColor: colors.border }]}>
      <TouchableOpacity
        style={[
          styles.allChip,
          { backgroundColor: colorFilter === null ? accent + '15' : colors.inputBg },
          colorFilter === null && { borderColor: accent, borderWidth: 1.5 },
        ]}
        onPress={() => setColorFilter(null)}
        activeOpacity={0.7}
      >
        <Text style={[styles.allChipText, { color: colorFilter === null ? accent : colors.textSecondary }]}>
          Todos
        </Text>
      </TouchableOpacity>
      {FILTER_COLORS.map(({ color }) => (
        <TouchableOpacity
          key={color}
          style={[
            styles.colorChip,
            { backgroundColor: color },
            colorFilter === color && styles.colorChipActive,
          ]}
          onPress={() => setColorFilter((prev) => prev === color ? null : color)}
          activeOpacity={0.8}
        >
          {colorFilter === color && (
            <IconX size={12} color="#000" strokeWidth={2.5} />
          )}
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SectionList
        sections={sections}
        keyExtractor={(h) => h.id}
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader}
        ListHeaderComponent={ListHeader}
        contentContainerStyle={styles.list}
        stickySectionHeadersEnabled={false}
        ItemSeparatorComponent={() => (
          <View style={[styles.separator, { backgroundColor: colors.border }]} />
        )}
        SectionSeparatorComponent={() => (
          <View style={[styles.sectionSep, { backgroundColor: colors.border }]} />
        )}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <IconHighlight size={48} color={colors.textMuted} strokeWidth={1} />
            <Text style={[styles.emptyTitle, { color: colors.textSecondary }]}>
              {colorFilter ? 'Nenhum destaque com essa cor' : 'Nenhum destaque'}
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
              {colorFilter
                ? 'Tente outro filtro de cor'
                : 'Abra um artigo, selecione um trecho e escolha uma cor para salvar.'}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { paddingBottom: 40 },

  // Color filter bar
  filterRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: spacing.lg, paddingVertical: spacing.sm,
    borderBottomWidth: 0.5,
  },
  allChip: {
    paddingHorizontal: spacing.md, paddingVertical: 6,
    borderRadius: radius.full, borderWidth: 1, borderColor: 'transparent',
  },
  allChipText: { fontSize: 13, fontWeight: '500' },
  colorChip: {
    width: 26, height: 26, borderRadius: 13,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1.5, borderColor: 'rgba(0,0,0,0.1)',
  },
  colorChipActive: {
    borderWidth: 2, borderColor: 'rgba(0,0,0,0.35)',
  },

  // Section headers
  sectionHeader: {
    paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.xs,
    flexDirection: 'row', alignItems: 'baseline', gap: spacing.sm,
  },
  sectionTitle: {
    ...typography.label,
    flex: 1,
    fontWeight: '700',
  },
  sectionCount: { ...typography.caption },
  sectionSep: { height: 1, marginTop: spacing.md },

  // Highlight card
  separator: { height: 0.5, marginLeft: spacing.lg + 4 },
  card: {
    flexDirection: 'row',
    marginHorizontal: spacing.lg,
    marginVertical: spacing.xs,
    borderRadius: radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  colorBar: { width: 4 },
  cardBody: {
    flex: 1,
    padding: spacing.md,
    gap: 6,
  },
  quote: {
    fontFamily: 'Georgia',
    fontStyle: 'italic',
    fontSize: 15,
    lineHeight: 22,
  },
  date: { ...typography.caption, fontSize: 11 },
  deleteBtn: { padding: spacing.md, justifyContent: 'center' },

  // Empty state
  emptyWrap: { alignItems: 'center', marginTop: 80, paddingHorizontal: spacing.xl },
  emptyTitle: { ...typography.heading, marginTop: spacing.lg },
  emptySubtitle: {
    ...typography.body,
    marginTop: spacing.xs,
    textAlign: 'center',
    lineHeight: 22,
  },
});
