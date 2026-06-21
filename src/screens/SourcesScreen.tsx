import React, { useMemo, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { IconNews } from '@tabler/icons-react-native';
import { useArticleStore } from '../stores/articleStore';
import { useAppThemeStore, getHomeColors } from '../stores/appThemeStore';
import { spacing, radius, typography } from '../theme/colors';

type SourceEntry = {
  domain: string;
  count: number;
  readCount: number;
};

function extractDomain(url: string | null): string {
  if (!url) return 'Sem URL';
  try {
    const u = new URL(url);
    return u.hostname.replace(/^www\./, '');
  } catch {
    return 'Sem URL';
  }
}

export function SourcesScreen() {
  const { articles, loadArticles } = useArticleStore();
  const { prefs: appTheme } = useAppThemeStore();
  const colors = getHomeColors(appTheme.homeTheme);
  const accent = appTheme.accentColor;

  useFocusEffect(useCallback(() => { loadArticles(null); }, [loadArticles]));

  const sources = useMemo<SourceEntry[]>(() => {
    const map = new Map<string, SourceEntry>();
    for (const a of articles) {
      const domain = extractDomain(a.url);
      const entry = map.get(domain) ?? { domain, count: 0, readCount: 0 };
      entry.count += 1;
      if (a.is_read) entry.readCount += 1;
      map.set(domain, entry);
    }
    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [articles]);

  const renderItem = ({ item, index }: { item: SourceEntry; index: number }) => (
    <View style={[styles.row, { backgroundColor: colors.background }]}>
      <View style={[styles.rank, { backgroundColor: accent + '14' }]}>
        <Text style={[styles.rankText, { color: accent }]}>{index + 1}</Text>
      </View>
      <View style={styles.body}>
        <Text style={[styles.domain, { color: colors.text }]} numberOfLines={1}>
          {item.domain}
        </Text>
        <Text style={[styles.meta, { color: colors.textMuted }]}>
          {item.count} {item.count === 1 ? 'artigo' : 'artigos'}
          {item.readCount > 0 && ` · ${item.readCount} lidos`}
        </Text>
      </View>
      <View style={[styles.bar, { backgroundColor: colors.inputBg }]}>
        <View
          style={[
            styles.barFill,
            {
              width: `${Math.round((item.readCount / item.count) * 100)}%`,
              backgroundColor: accent,
            },
          ]}
        />
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={sources}
        keyExtractor={(s) => s.domain}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => (
          <View style={[styles.hairline, { backgroundColor: colors.border }]} />
        )}
        ListHeaderComponent={
          sources.length > 0 ? (
            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
              {sources.length} {sources.length === 1 ? 'fonte' : 'fontes'}
            </Text>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <IconNews size={48} color={colors.textMuted} strokeWidth={1} />
            <Text style={[styles.emptyTitle, { color: colors.textSecondary }]}>
              Nenhuma fonte ainda
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
              As fontes dos seus artigos aparecerão aqui
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

  sectionLabel: {
    ...typography.label,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  hairline: { height: 0.5, marginHorizontal: spacing.lg },

  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.lg, paddingVertical: 14,
    gap: spacing.md,
  },
  rank: {
    width: 32, height: 32, borderRadius: radius.sm,
    justifyContent: 'center', alignItems: 'center',
  },
  rankText: { fontSize: 13, fontWeight: '700' },
  body: { flex: 1 },
  domain: { ...typography.subheading, marginBottom: 2 },
  meta: { ...typography.caption },
  bar: {
    width: 48, height: 4, borderRadius: 2, overflow: 'hidden',
  },
  barFill: { height: '100%', borderRadius: 2 },

  emptyWrap: { alignItems: 'center', marginTop: 80, paddingHorizontal: spacing.xl },
  emptyTitle: { ...typography.heading, marginTop: spacing.lg },
  emptySubtitle: { ...typography.body, marginTop: spacing.xs, textAlign: 'center' },
});
