import React, { useMemo, useCallback, useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  Modal, TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { IconNews, IconPencil, IconX, IconCheck, IconChevronRight } from '@tabler/icons-react-native';
import { useArticleStore } from '../stores/articleStore';
import { useAppThemeStore, getHomeColors } from '../stores/appThemeStore';
import { useSourceNamesStore } from '../stores/sourceNamesStore';
import { RootStackParamList } from '../types';
import { spacing, radius, typography } from '../theme/colors';

type Nav = NativeStackNavigationProp<RootStackParamList>;

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
  const navigation = useNavigation<Nav>();
  const { articles, loadArticles } = useArticleStore();
  const { prefs: appTheme } = useAppThemeStore();
  const colors = getHomeColors(appTheme.homeTheme);
  const accent = appTheme.accentColor;

  const { names, _hydrate, setName } = useSourceNamesStore();
  useEffect(() => { _hydrate(); }, [_hydrate]);

  const [renameTarget, setRenameTarget] = useState<string | null>(null);
  const [renameText, setRenameText] = useState('');

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

  const openRename = useCallback((domain: string) => {
    setRenameTarget(domain);
    setRenameText(names[domain] ?? '');
  }, [names]);

  const handleSaveRename = useCallback(() => {
    if (!renameTarget) return;
    const trimmed = renameText.trim();
    if (trimmed.length === 0) {
      setName(renameTarget, '');
    } else {
      setName(renameTarget, trimmed);
    }
    setRenameTarget(null);
  }, [renameTarget, renameText, setName]);

  const renderItem = ({ item, index }: { item: SourceEntry; index: number }) => {
    const displayName = names[item.domain] ?? item.domain;
    const hasCustomName = Boolean(names[item.domain]);

    return (
      <TouchableOpacity
        style={[styles.row, { backgroundColor: colors.background }]}
        activeOpacity={0.6}
        onPress={() => navigation.navigate('SourceDetail', { domain: item.domain, title: displayName })}
      >
        <View style={[styles.rank, { backgroundColor: accent + '14' }]}>
          <Text style={[styles.rankText, { color: accent }]}>{index + 1}</Text>
        </View>
        <View style={styles.body}>
          <Text style={[styles.domain, { color: colors.text }]} numberOfLines={1}>
            {displayName}
          </Text>
          {hasCustomName && (
            <Text style={[styles.originalDomain, { color: colors.textMuted }]} numberOfLines={1}>
              {item.domain}
            </Text>
          )}
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
        <TouchableOpacity
          style={[styles.editBtn, { backgroundColor: colors.inputBg }]}
          onPress={() => openRename(item.domain)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          activeOpacity={0.7}
        >
          <IconPencil size={14} color={colors.textMuted} strokeWidth={1.75} />
        </TouchableOpacity>
        <IconChevronRight size={16} color={colors.textMuted} strokeWidth={1.75} />
      </TouchableOpacity>
    );
  };

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

      {/* Rename modal */}
      <Modal
        visible={renameTarget !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setRenameTarget(null)}
      >
        <KeyboardAvoidingView
          style={renameStyles.overlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
        >
          <TouchableOpacity
            style={renameStyles.backdrop}
            activeOpacity={1}
            onPress={() => setRenameTarget(null)}
          />
          <View style={[renameStyles.panel, { backgroundColor: colors.surface }]}>
            <View style={renameStyles.header}>
              <Text style={[renameStyles.title, { color: colors.text }]}>Renomear fonte</Text>
              <TouchableOpacity onPress={() => setRenameTarget(null)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <IconX size={18} color={colors.textMuted} strokeWidth={1.75} />
              </TouchableOpacity>
            </View>
            <Text style={[renameStyles.hint, { color: colors.textMuted }]}>
              {renameTarget}
            </Text>
            <View style={[renameStyles.inputWrap, { backgroundColor: colors.inputBg }]}>
              <TextInput
                style={[renameStyles.input, { color: colors.text }]}
                value={renameText}
                onChangeText={setRenameText}
                placeholder="Nome personalizado"
                placeholderTextColor={colors.textMuted}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={handleSaveRename}
              />
              {renameText.length > 0 && (
                <TouchableOpacity onPress={() => setRenameText('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <IconX size={16} color={colors.textMuted} strokeWidth={1.75} />
                </TouchableOpacity>
              )}
            </View>
            <Text style={[renameStyles.info, { color: colors.textMuted }]}>
              Novos artigos desta fonte serão reconhecidos pelo domínio original.
            </Text>
            <TouchableOpacity
              style={[renameStyles.saveBtn, { backgroundColor: accent }]}
              onPress={handleSaveRename}
              activeOpacity={0.8}
            >
              <IconCheck size={16} color="#fff" strokeWidth={2.5} />
              <Text style={renameStyles.saveBtnText}>Salvar</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
  domain: { ...typography.subheading, marginBottom: 1 },
  originalDomain: { fontSize: 11, marginBottom: 2 },
  meta: { ...typography.caption },
  bar: {
    width: 48, height: 4, borderRadius: 2, overflow: 'hidden',
  },
  barFill: { height: '100%', borderRadius: 2 },
  editBtn: {
    width: 28, height: 28, borderRadius: radius.xs,
    justifyContent: 'center', alignItems: 'center',
  },

  emptyWrap: { alignItems: 'center', marginTop: 80, paddingHorizontal: spacing.xl },
  emptyTitle: { ...typography.heading, marginTop: spacing.lg },
  emptySubtitle: { ...typography.body, marginTop: spacing.xs, textAlign: 'center' },
});

const renameStyles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'center', padding: spacing.xl },
  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.45)' },
  panel: {
    borderRadius: radius.xl,
    padding: spacing.xl,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: spacing.xs,
  },
  title: { fontSize: 17, fontWeight: '700' },
  hint: { fontSize: 12, marginBottom: spacing.md },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: radius.md, paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  input: { flex: 1, paddingVertical: 12, fontSize: 15 },
  info: { fontSize: 12, lineHeight: 17, marginBottom: spacing.lg },
  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.sm, borderRadius: radius.md, paddingVertical: 13,
  },
  saveBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
});
