import React, { useCallback, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  TextInput, Modal, Pressable, Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTagStore } from '../stores/tagStore';
import { useAppThemeStore, getHomeColors } from '../stores/appThemeStore';
import { Tag } from '../types';
import { palette, spacing, radius, typography } from '../theme/colors';

const TAG_COLORS = [
  '#6366f1', '#ec4899', '#f59e0b', '#10b981',
  '#3b82f6', '#ef4444', '#8b5cf6', '#14b8a6',
];

export function TagsScreen() {
  const { tags, loadTags, createTag, deleteTag } = useTagStore();
  const { prefs: appTheme } = useAppThemeStore();
  const colors = getHomeColors(appTheme.homeTheme);
  const accent = appTheme.accentColor;
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [selectedColor, setSelectedColor] = useState(TAG_COLORS[0]);

  useFocusEffect(useCallback(() => { loadTags(); }, [loadTags]));

  const handleCreate = useCallback(async () => {
    if (!name.trim()) return;
    await createTag(name.trim(), selectedColor);
    setName('');
    setSelectedColor(TAG_COLORS[0]);
    setShowModal(false);
  }, [name, selectedColor, createTag]);

  const handleDelete = useCallback((tag: Tag) => {
    Alert.alert(
      'Remover tag',
      `Remover a tag "${tag.name}"? Ela sera desvinculada de todos os itens.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Remover', style: 'destructive', onPress: () => deleteTag(tag.id) },
      ]
    );
  }, [deleteTag]);

  const renderTag = ({ item }: { item: Tag }) => (
    <TouchableOpacity
      style={[styles.tag, { backgroundColor: colors.surface, borderColor: colors.border }]}
      activeOpacity={0.7}
      onLongPress={() => handleDelete(item)}
    >
      <View style={[styles.tagDot, { backgroundColor: item.color }]} />
      <Text style={[styles.tagName, { color: colors.text }]}>{item.name}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={tags}
        keyExtractor={(t) => t.id}
        renderItem={renderTag}
        numColumns={2}
        contentContainerStyle={styles.list}
        columnWrapperStyle={styles.row}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Ionicons name="pricetags-outline" size={48} color={colors.textMuted} />
            <Text style={[styles.emptyTitle, { color: colors.textSecondary }]}>Nenhuma tag</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>Toque no + para criar</Text>
          </View>
        }
      />

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: accent, shadowColor: accent }]}
        activeOpacity={0.8}
        onPress={() => setShowModal(true)}
      >
        <Ionicons name="add" size={26} color="#fff" />
      </TouchableOpacity>

      <Modal visible={showModal} transparent animationType="fade">
        <Pressable style={styles.overlay} onPress={() => setShowModal(false)}>
          <Pressable style={[styles.modal, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Nova tag</Text>
            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.text }]}
              placeholder="Nome da tag"
              placeholderTextColor={colors.textMuted}
              value={name}
              onChangeText={setName}
              autoFocus
            />
            <Text style={[styles.colorLabel, { color: colors.textSecondary }]}>Cor</Text>
            <View style={styles.colorRow}>
              {TAG_COLORS.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[styles.colorSwatch, { backgroundColor: c }]}
                  onPress={() => setSelectedColor(c)}
                >
                  {selectedColor === c && (
                    <Ionicons name="checkmark" size={16} color="#fff" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.modalBtns}>
              <TouchableOpacity
                style={styles.modalBtnCancel}
                onPress={() => setShowModal(false)}
              >
                <Text style={[styles.cancelText, { color: colors.textSecondary }]}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtnConfirm, { backgroundColor: accent }]}
                onPress={handleCreate}
              >
                <Text style={styles.confirmText}>Criar</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { padding: spacing.lg, paddingBottom: 100 },
  row: { gap: spacing.sm },
  tag: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    borderRadius: radius.lg,
    padding: spacing.lg, marginBottom: spacing.sm,
    borderWidth: 1,
  },
  tagDot: { width: 10, height: 10, borderRadius: 5, marginRight: spacing.sm },
  tagName: { ...typography.subheading },
  emptyWrap: { alignItems: 'center', marginTop: 80 },
  emptyTitle: { ...typography.heading, marginTop: spacing.lg },
  emptySubtitle: { ...typography.body, marginTop: spacing.xs },
  fab: {
    position: 'absolute', bottom: 24, right: spacing.lg,
    width: 54, height: 54, borderRadius: 27,
    justifyContent: 'center', alignItems: 'center',
    elevation: 6,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8,
  },
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center', alignItems: 'center',
  },
  modal: {
    borderRadius: radius.xl,
    padding: spacing['2xl'], width: 300, elevation: 8,
  },
  modalTitle: { ...typography.heading, marginBottom: spacing.lg },
  input: {
    borderWidth: 1, borderRadius: radius.md,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    fontSize: 15, marginBottom: spacing.lg,
  },
  colorLabel: { ...typography.caption, fontWeight: '600', marginBottom: spacing.sm },
  colorRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.xl, flexWrap: 'wrap' },
  colorSwatch: {
    width: 32, height: 32, borderRadius: 16,
    justifyContent: 'center', alignItems: 'center',
  },
  modalBtns: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.sm },
  modalBtnCancel: { paddingVertical: spacing.sm, paddingHorizontal: spacing.lg },
  cancelText: { ...typography.body },
  modalBtnConfirm: {
    paddingVertical: spacing.sm, paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
  },
  confirmText: { ...typography.body, color: '#fff', fontWeight: '600' },
});
