import React, { useCallback, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet,
  TouchableOpacity, Alert,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  IconTrash, IconRefresh, IconTrashX, IconFileText,
} from '@tabler/icons-react-native';
import { useArticleStore } from '../stores/articleStore';
import { useAppThemeStore, getHomeColors } from '../stores/appThemeStore';
import { Article, RootStackParamList } from '../types';
import { spacing, radius, typography, palette } from '../theme/colors';
import { ActionSheet } from '../components/ActionSheet';

type Nav = NativeStackNavigationProp<RootStackParamList>;

function formatTrashDate(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

export function TrashScreen() {
  const navigation = useNavigation<Nav>();
  const { trashArticles, loadTrash, restoreArticle, permanentlyDeleteArticle, emptyTrash } =
    useArticleStore();
  const { prefs: appTheme } = useAppThemeStore();
  const colors = getHomeColors(appTheme.homeTheme);
  const accent = appTheme.accentColor;

  const [sheetArticle, setSheetArticle] = useState<Article | null>(null);

  useFocusEffect(useCallback(() => { loadTrash(); }, [loadTrash]));

  const handleEmptyTrash = useCallback(() => {
    if (trashArticles.length === 0) return;
    Alert.alert(
      'Esvaziar lixeira',
      `Remover permanentemente ${trashArticles.length} ${trashArticles.length === 1 ? 'artigo' : 'artigos'}? Essa ação não pode ser desfeita.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Esvaziar', style: 'destructive', onPress: () => emptyTrash() },
      ]
    );
  }, [trashArticles.length, emptyTrash]);

  React.useEffect(() => {
    navigation.setOptions({
      headerRight: () =>
        trashArticles.length > 0 ? (
          <TouchableOpacity
            onPress={handleEmptyTrash}
            style={{ paddingHorizontal: 10, paddingVertical: 6 }}
          >
            <Text style={{ color: palette.danger, fontSize: 15, fontWeight: '600' }}>
              Esvaziar
            </Text>
          </TouchableOpacity>
        ) : null,
    });
  }, [navigation, trashArticles.length, handleEmptyTrash]);

  const renderItem = ({ item }: { item: Article }) => (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
      activeOpacity={0.7}
      onLongPress={() => setSheetArticle(item)}
      onPress={() => setSheetArticle(item)}
    >
      <View style={[styles.iconWrap, { backgroundColor: colors.inputBg }]}>
        <IconFileText size={20} color={colors.textMuted} strokeWidth={1.5} />
      </View>
      <View style={styles.body}>
        <Text style={[styles.title, { color: colors.textSecondary }]} numberOfLines={2}>
          {item.title}
        </Text>
        {item.deleted_at != null && (
          <Text style={[styles.date, { color: colors.textMuted }]}>
            Enviado em {formatTrashDate(item.deleted_at)}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={trashArticles}
        keyExtractor={(a) => a.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => (
          <View style={[styles.separator, { backgroundColor: colors.border }]} />
        )}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <IconTrash size={48} color={colors.border} strokeWidth={1} />
            <Text style={[styles.emptyTitle, { color: colors.textSecondary }]}>
              Lixeira vazia
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
              Artigos excluídos aparecem aqui
            </Text>
          </View>
        }
      />

      <ActionSheet
        visible={sheetArticle != null}
        onClose={() => setSheetArticle(null)}
        title={sheetArticle?.title}
        actions={sheetArticle ? [
          {
            label: 'Restaurar',
            Icon: IconRefresh,
            onPress: () => restoreArticle(sheetArticle.id),
          },
          {
            label: 'Excluir permanentemente',
            style: 'destructive',
            Icon: IconTrashX,
            onPress: () => Alert.alert(
              'Excluir permanentemente',
              `Remover "${sheetArticle.title}" para sempre? Essa ação não pode ser desfeita.`,
              [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Excluir', style: 'destructive', onPress: () => permanentlyDeleteArticle(sheetArticle.id) },
              ]
            ),
          },
        ] : []}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { paddingVertical: spacing.sm, paddingBottom: 40 },
  separator: { height: 0.5, marginHorizontal: spacing.lg },
  card: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
    borderBottomWidth: 0,
  },
  iconWrap: {
    width: 44, height: 44, borderRadius: radius.sm,
    justifyContent: 'center', alignItems: 'center',
    marginRight: spacing.md,
  },
  body: { flex: 1 },
  title: { ...typography.subheading, marginBottom: 2 },
  date: { ...typography.caption },
  emptyWrap: { alignItems: 'center', marginTop: 100 },
  emptyTitle: { ...typography.heading, marginTop: spacing.lg },
  emptySubtitle: { ...typography.body, marginTop: spacing.xs, textAlign: 'center' },
});
