import React, { useMemo, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity, Image,
} from 'react-native';
import { useRoute, useNavigation, useFocusEffect, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { IconFileText, IconNews } from '@tabler/icons-react-native';
import { useArticleStore } from '../stores/articleStore';
import { useAppThemeStore, getHomeColors } from '../stores/appThemeStore';
import { RootStackParamList, Article } from '../types';
import { spacing, radius, typography } from '../theme/colors';

type Route = RouteProp<RootStackParamList, 'SourceDetail'>;
type Nav = NativeStackNavigationProp<RootStackParamList>;

function extractDomain(url: string | null): string {
  if (!url) return 'Sem URL';
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return 'Sem URL';
  }
}

export function SourceDetailScreen() {
  const route = useRoute<Route>();
  const navigation = useNavigation<Nav>();
  const { domain } = route.params;

  const { articles, loadArticles } = useArticleStore();
  const { prefs: appTheme } = useAppThemeStore();
  const colors = getHomeColors(appTheme.homeTheme);
  const accent = appTheme.accentColor;

  useFocusEffect(useCallback(() => { loadArticles(null); }, [loadArticles]));

  const sourceArticles = useMemo(
    () => articles.filter((a) => extractDomain(a.url) === domain),
    [articles, domain],
  );

  const renderArticle = ({ item }: { item: Article }) => (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.background }]}
      activeOpacity={0.7}
      onPress={() => navigation.navigate('Reader', { articleId: item.id })}
    >
      {item.cover_image_path != null ? (
        <Image
          source={{ uri: item.cover_image_path }}
          style={[styles.thumb, { backgroundColor: colors.inputBg }]}
          resizeMode="cover"
        />
      ) : (
        <View style={[styles.thumbPlaceholder, { backgroundColor: colors.inputBg }]}>
          <IconFileText size={22} color={colors.textMuted} strokeWidth={1.5} />
        </View>
      )}
      <View style={styles.body}>
        <Text
          style={[
            styles.title,
            { color: colors.text },
            item.is_read && { color: colors.textSecondary, fontWeight: '400' },
          ]}
          numberOfLines={2}
        >
          {item.title}
        </Text>
        {(item.author != null || item.reading_time_min != null) && (
          <Text style={[styles.meta, { color: colors.textMuted }]} numberOfLines={1}>
            {[
              item.author,
              item.reading_time_min != null ? `${item.reading_time_min} min` : null,
            ].filter(Boolean).join(' · ')}
          </Text>
        )}
      </View>
      {!item.is_read && <View style={[styles.dot, { backgroundColor: accent }]} />}
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={sourceArticles}
        keyExtractor={(a) => a.id}
        renderItem={renderArticle}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => (
          <View style={[styles.separator, { backgroundColor: colors.border }]} />
        )}
        ListHeaderComponent={
          sourceArticles.length > 0 ? (
            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
              {sourceArticles.length} {sourceArticles.length === 1 ? 'artigo' : 'artigos'}
            </Text>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <IconNews size={48} color={colors.textMuted} strokeWidth={1} />
            <Text style={[styles.emptyTitle, { color: colors.textSecondary }]}>
              Nenhum artigo desta fonte
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
  separator: { height: 0.5, marginHorizontal: spacing.lg },
  card: {
    flexDirection: 'row', alignItems: 'flex-start',
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
  },
  thumb: { width: 56, height: 56, borderRadius: radius.sm, marginRight: spacing.md },
  thumbPlaceholder: {
    width: 56, height: 56, borderRadius: radius.sm, marginRight: spacing.md,
    justifyContent: 'center', alignItems: 'center',
  },
  body: { flex: 1 },
  title: { ...typography.title, marginBottom: 4 },
  meta: { ...typography.caption },
  dot: { width: 8, height: 8, borderRadius: 4, marginLeft: spacing.sm, marginTop: 6 },
  emptyWrap: { alignItems: 'center', marginTop: 80, paddingHorizontal: spacing.xl },
  emptyTitle: { ...typography.heading, marginTop: spacing.lg },
});
