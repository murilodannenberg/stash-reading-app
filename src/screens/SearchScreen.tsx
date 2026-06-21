import React, { useState, useCallback } from 'react';
import {
  View, Text, TextInput, FlatList, StyleSheet,
  TouchableOpacity, ActivityIndicator, Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { IconFileText, IconChevronRight, IconSearch, IconCircleX } from '@tabler/icons-react-native';
import { useArticleStore } from '../stores/articleStore';
import { useAppThemeStore, getHomeColors } from '../stores/appThemeStore';
import { Article, RootStackParamList } from '../types';
import { spacing, radius, typography } from '../theme/colors';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function SearchScreen() {
  const navigation = useNavigation<Nav>();
  const { searchArticles } = useArticleStore();
  const { prefs: appTheme } = useAppThemeStore();
  const colors = getHomeColors(appTheme.homeTheme);
  const accent = appTheme.accentColor;
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const found = await searchArticles(query.trim());
      setResults(found);
    } finally {
      setLoading(false);
    }
  }, [query, searchArticles]);

  const renderItem = ({ item }: { item: Article }) => (
    <TouchableOpacity
      style={[styles.item, { backgroundColor: colors.background }]}
      activeOpacity={0.7}
      onPress={() => navigation.navigate('Reader', { articleId: item.id })}
    >
      {item.cover_image_path != null ? (
        <Image
          source={{ uri: item.cover_image_path }}
          style={[styles.itemThumb, { backgroundColor: colors.inputBg }]}
          resizeMode="cover"
        />
      ) : (
        <View style={[styles.itemThumbPlaceholder, { backgroundColor: colors.inputBg }]}>
          <IconFileText size={20} color={colors.textMuted} strokeWidth={1.5} />
        </View>
      )}
      <View style={styles.itemBody}>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>{item.title}</Text>
        {item.author != null && <Text style={[styles.meta, { color: colors.textMuted }]}>{item.author}</Text>}
        {item.reading_time_min != null && (
          <Text style={[styles.meta, { color: colors.textMuted }]}>{item.reading_time_min} min de leitura</Text>
        )}
      </View>
      <IconChevronRight size={16} color={colors.textMuted} strokeWidth={1.5} />
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.searchRow, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View style={[styles.inputWrap, { backgroundColor: colors.inputBg }]}>
          <IconSearch size={18} color={colors.textMuted} strokeWidth={1.5} style={styles.inputIcon} />
          <TextInput
            style={[styles.input, { color: colors.text }]}
            placeholder="Buscar artigos..."
            placeholderTextColor={colors.textMuted}
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
            onSubmitEditing={handleSearch}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => { setQuery(''); setResults([]); setSearched(false); }}>
              <IconCircleX size={18} color={colors.textMuted} strokeWidth={1.5} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {loading ? (
        <ActivityIndicator style={styles.loading} color={accent} />
      ) : (
        <FlatList
          data={results}
          keyExtractor={(a) => a.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => (
            <View style={[styles.separator, { backgroundColor: colors.border }]} />
          )}
          ListEmptyComponent={
            searched ? (
              <View style={styles.emptyWrap}>
                <IconSearch size={40} color={colors.textMuted} strokeWidth={1} />
                <Text style={[styles.empty, { color: colors.textMuted }]}>Nenhum resultado para "{query}"</Text>
              </View>
            ) : (
              <View style={styles.emptyWrap}>
                <IconSearch size={48} color={colors.border} strokeWidth={1} />
                <Text style={[styles.emptyHint, { color: colors.textMuted }]}>Busca por titulo, autor ou conteudo</Text>
              </View>
            )
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  searchRow: { padding: spacing.lg, borderBottomWidth: 1 },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: radius.md, paddingHorizontal: spacing.md,
  },
  inputIcon: { marginRight: spacing.sm },
  input: { flex: 1, paddingVertical: spacing.sm, fontSize: 15 },
  loading: { marginTop: 40 },
  list: { paddingTop: spacing.sm },
  separator: { height: 0.5, marginHorizontal: spacing.lg },
  item: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
  },
  itemThumb: {
    width: 48, height: 48, borderRadius: radius.sm,
    marginRight: spacing.md,
  },
  itemThumbPlaceholder: {
    width: 48, height: 48, borderRadius: radius.sm,
    marginRight: spacing.md,
    justifyContent: 'center', alignItems: 'center',
  },
  itemBody: { flex: 1 },
  title: { ...typography.title, marginBottom: 4 },
  meta: { ...typography.caption },
  emptyWrap: { alignItems: 'center', marginTop: 80 },
  empty: { ...typography.body, marginTop: spacing.md },
  emptyHint: { ...typography.body, marginTop: spacing.md },
});
