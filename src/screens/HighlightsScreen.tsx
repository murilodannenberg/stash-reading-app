import React, { useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity, Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { IconHighlight, IconTrash } from '@tabler/icons-react-native';
import { useHighlightStore } from '../stores/highlightStore';
import { useAppThemeStore, getHomeColors } from '../stores/appThemeStore';
import { HighlightWithArticle } from '../database/repositories/highlights';
import { spacing, radius, typography } from '../theme/colors';

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function HighlightsScreen() {
  const { allHighlights, loadAllHighlights, removeHighlight } = useHighlightStore();
  const { prefs: appTheme } = useAppThemeStore();
  const colors = getHomeColors(appTheme.homeTheme);

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

  const renderItem = ({ item }: { item: HighlightWithArticle }) => (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {/* Faixa de cor do destaque */}
      <View style={[styles.colorBar, { backgroundColor: item.color }]} />

      <View style={styles.cardBody}>
        <Text
          style={[styles.quote, { color: colors.text }]}
          numberOfLines={5}
        >
          {item.selected_text}
        </Text>
        <Text style={[styles.articleTitle, { color: colors.textSecondary }]} numberOfLines={1}>
          {item.article_title}
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
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={allHighlights}
        keyExtractor={(h) => h.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => (
          <View style={[styles.separator, { backgroundColor: colors.border }]} />
        )}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <IconHighlight size={48} color={colors.textMuted} strokeWidth={1} />
            <Text style={[styles.emptyTitle, { color: colors.textSecondary }]}>
              Nenhum destaque
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
              Abra um artigo, toque no ícone de destaque e selecione um trecho para salvar.
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { paddingVertical: spacing.sm, paddingBottom: 40 },
  separator: { height: 0.5, marginHorizontal: spacing.lg },

  card: {
    flexDirection: 'row',
    marginHorizontal: spacing.lg,
    marginVertical: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  colorBar: {
    width: 4,
  },
  cardBody: {
    flex: 1,
    padding: spacing.md,
    gap: 4,
  },
  quote: {
    ...typography.body,
    fontStyle: 'italic',
    lineHeight: 22,
  },
  articleTitle: {
    ...typography.caption,
    fontWeight: '600',
    marginTop: 2,
  },
  date: {
    ...typography.caption,
    fontSize: 11,
  },
  deleteBtn: {
    padding: spacing.md,
    justifyContent: 'center',
  },

  // Empty state
  emptyWrap: {
    alignItems: 'center',
    marginTop: 80,
    paddingHorizontal: spacing.xl,
  },
  emptyTitle: { ...typography.heading, marginTop: spacing.lg },
  emptySubtitle: {
    ...typography.body,
    marginTop: spacing.xs,
    textAlign: 'center',
    lineHeight: 22,
  },
});
