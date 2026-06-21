import React, { useEffect, useState, useCallback } from 'react';
import {
  Modal, View, Text, FlatList, TouchableOpacity,
  StyleSheet, Pressable, ActivityIndicator,
} from 'react-native';
import { IconTag, IconCheck, IconPlus } from '@tabler/icons-react-native';
import { getTagsForArticle, setTagsForArticle, getTags } from '../database';
import { useAppThemeStore, getHomeColors } from '../stores/appThemeStore';
import { Tag } from '../types';
import { spacing, radius, typography, palette } from '../theme/colors';

type Props = {
  visible: boolean;
  onClose: () => void;
  articleId: string;
  /** Called after tags are saved so the caller can refresh if needed */
  onSaved?: () => void;
  /** Navigate to Tags screen to create a new tag */
  onCreateTag?: () => void;
};

export function TagPicker({ visible, onClose, articleId, onSaved, onCreateTag }: Props) {
  const { prefs: appTheme } = useAppThemeStore();
  const colors = getHomeColors(appTheme.homeTheme);
  const accent = appTheme.accentColor;

  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Load tags every time the modal opens
  useEffect(() => {
    if (!visible) return;
    setLoading(true);
    Promise.all([getTags(), getTagsForArticle(articleId)])
      .then(([all, current]) => {
        setAllTags(all);
        setSelected(new Set(current.map((t) => t.id)));
      })
      .finally(() => setLoading(false));
  }, [visible, articleId]);

  const toggle = useCallback((tagId: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(tagId)) next.delete(tagId);
      else next.add(tagId);
      return next;
    });
  }, []);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      await setTagsForArticle(articleId, Array.from(selected));
      onSaved?.();
      onClose();
    } finally {
      setSaving(false);
    }
  }, [articleId, selected, onSaved, onClose]);

  const renderTag = ({ item }: { item: Tag }) => {
    const isSelected = selected.has(item.id);
    return (
      <TouchableOpacity
        style={[
          styles.tagRow,
          { borderBottomColor: colors.border },
        ]}
        activeOpacity={0.6}
        onPress={() => toggle(item.id)}
      >
        <View style={[styles.tagDot, { backgroundColor: item.color }]} />
        <Text style={[styles.tagName, { color: colors.text }]}>{item.name}</Text>
        {isSelected && (
          <View style={[styles.checkCircle, { backgroundColor: accent }]}>
            <IconCheck size={13} color="#fff" strokeWidth={2.5} />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={[styles.panel, { backgroundColor: colors.surface }]}>
          <View style={[styles.handle, { backgroundColor: colors.border }]} />

          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>Tags do artigo</Text>
            <TouchableOpacity onPress={handleSave} disabled={saving} activeOpacity={0.7}>
              {saving ? (
                <ActivityIndicator size="small" color={accent} />
              ) : (
                <Text style={[styles.saveBtn, { color: accent }]}>Salvar</Text>
              )}
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator color={accent} />
            </View>
          ) : allTags.length === 0 ? (
            <View style={styles.emptyWrap}>
              <IconTag size={36} color={colors.border} strokeWidth={1.25} />
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                Nenhuma tag criada ainda
              </Text>
              {onCreateTag != null && (
                <TouchableOpacity
                  style={[styles.createTagBtn, { backgroundColor: accent + '15', borderColor: accent }]}
                  onPress={() => { onClose(); onCreateTag(); }}
                  activeOpacity={0.7}
                >
                  <IconPlus size={15} color={accent} strokeWidth={2} />
                  <Text style={[styles.createTagText, { color: accent }]}>Criar tag</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <FlatList
              data={allTags}
              keyExtractor={(t) => t.id}
              renderItem={renderTag}
              style={styles.list}
              bounces={false}
              ListFooterComponent={
                onCreateTag != null ? (
                  <TouchableOpacity
                    style={[styles.tagRow, styles.createRow, { borderBottomColor: 'transparent' }]}
                    onPress={() => { onClose(); onCreateTag(); }}
                    activeOpacity={0.6}
                  >
                    <View style={[styles.tagDot, { backgroundColor: colors.inputBg }]}>
                      <IconPlus size={8} color={colors.textMuted} strokeWidth={2.5} />
                    </View>
                    <Text style={[styles.tagName, { color: colors.textMuted }]}>Nova tag</Text>
                  </TouchableOpacity>
                ) : null
              }
            />
          )}

          <TouchableOpacity style={styles.cancelBtn} onPress={onClose} activeOpacity={0.6}>
            <Text style={[styles.cancelText, { color: colors.textSecondary }]}>Cancelar</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1, justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  panel: {
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingBottom: 32,
    paddingTop: spacing.md,
    maxHeight: '70%',
  },
  handle: {
    width: 36, height: 4, borderRadius: 2,
    alignSelf: 'center', marginBottom: spacing.md,
  },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing.xl, paddingBottom: spacing.md,
  },
  title: { ...typography.subheading, fontWeight: '700' },
  saveBtn: { fontSize: 15, fontWeight: '600' },

  list: { flexGrow: 0 },

  tagRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.xl, paddingVertical: spacing.lg,
    borderBottomWidth: 0.5,
  },
  createRow: { marginTop: spacing.xs },
  tagDot: {
    width: 12, height: 12, borderRadius: 6,
    marginRight: spacing.md,
    justifyContent: 'center', alignItems: 'center',
  },
  tagName: { ...typography.body, flex: 1 },
  checkCircle: {
    width: 22, height: 22, borderRadius: 11,
    justifyContent: 'center', alignItems: 'center',
  },

  loadingWrap: { paddingVertical: 40, alignItems: 'center' },
  emptyWrap: { paddingVertical: 40, alignItems: 'center', gap: spacing.md },
  emptyText: { ...typography.body },
  createTagBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: spacing.lg, paddingVertical: spacing.sm,
    borderRadius: radius.full, borderWidth: 1, marginTop: spacing.sm,
  },
  createTagText: { fontSize: 14, fontWeight: '600' },

  cancelBtn: { alignItems: 'center', paddingVertical: spacing.lg },
  cancelText: { ...typography.body, fontWeight: '600' },
});
