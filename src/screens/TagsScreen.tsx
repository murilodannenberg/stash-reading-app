import React, { useEffect, useCallback, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  TextInput, Modal, Pressable, Alert,
} from 'react-native';
import { useTagStore } from '../stores/tagStore';
import { Tag } from '../types';
import { palette } from '../theme/colors';

const TAG_COLORS = [
  '#6366f1', '#ec4899', '#f59e0b', '#10b981',
  '#3b82f6', '#ef4444', '#8b5cf6', '#14b8a6',
];

export function TagsScreen() {
  const { tags, loadTags, createTag, deleteTag } = useTagStore();
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [selectedColor, setSelectedColor] = useState(TAG_COLORS[0]);

  useEffect(() => { loadTags(); }, [loadTags]);

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
      `Remover a tag "${tag.name}"? Ela será desvinculada de todos os itens.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Remover', style: 'destructive', onPress: () => deleteTag(tag.id) },
      ]
    );
  }, [deleteTag]);

  const renderTag = ({ item }: { item: Tag }) => (
    <TouchableOpacity
      style={[styles.tag, { borderColor: item.color }]}
      onLongPress={() => handleDelete(item)}
    >
      <View style={[styles.tagDot, { backgroundColor: item.color }]} />
      <Text style={styles.tagName}>{item.name}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={tags}
        keyExtractor={(t) => t.id}
        renderItem={renderTag}
        numColumns={2}
        contentContainerStyle={styles.list}
        columnWrapperStyle={styles.row}
        ListEmptyComponent={
          <Text style={styles.empty}>
            Nenhuma tag.{'\n'}Toque em + para criar.
          </Text>
        }
      />

      <TouchableOpacity style={styles.fab} onPress={() => setShowModal(true)}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      <Modal visible={showModal} transparent animationType="fade">
        <Pressable style={styles.overlay} onPress={() => setShowModal(false)}>
          <Pressable style={styles.modal}>
            <Text style={styles.modalTitle}>Nova tag</Text>
            <TextInput
              style={styles.input}
              placeholder="Nome da tag"
              value={name}
              onChangeText={setName}
              autoFocus
            />
            <Text style={styles.colorLabel}>Cor</Text>
            <View style={styles.colorRow}>
              {TAG_COLORS.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[
                    styles.colorSwatch,
                    { backgroundColor: c },
                    selectedColor === c && styles.colorSelected,
                  ]}
                  onPress={() => setSelectedColor(c)}
                />
              ))}
            </View>
            <View style={styles.modalButtons}>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Text style={styles.cancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleCreate}>
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
  container: { flex: 1, backgroundColor: '#f9fafb' },
  list: { padding: 16, paddingBottom: 100 },
  row: { gap: 12 },
  tag: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 12, padding: 14,
    marginBottom: 12, borderWidth: 2,
  },
  tagDot: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
  tagName: { fontSize: 14, fontWeight: '600', color: '#374151' },
  empty: { textAlign: 'center', color: '#9ca3af', fontSize: 15, marginTop: 60, lineHeight: 24 },
  fab: {
    position: 'absolute', bottom: 24, right: 16,
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: palette.primary,
    justifyContent: 'center', alignItems: 'center',
    elevation: 4,
  },
  fabText: { fontSize: 28, color: '#fff', lineHeight: 32 },
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center', alignItems: 'center',
  },
  modal: {
    backgroundColor: '#fff', borderRadius: 16, padding: 24,
    width: 300, elevation: 8,
  },
  modalTitle: { fontSize: 17, fontWeight: '700', color: '#111827', marginBottom: 16 },
  input: {
    borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8,
    padding: 10, fontSize: 15, color: '#111827', marginBottom: 16,
  },
  colorLabel: { fontSize: 13, color: '#6b7280', marginBottom: 10 },
  colorRow: { flexDirection: 'row', gap: 10, marginBottom: 20, flexWrap: 'wrap' },
  colorSwatch: { width: 28, height: 28, borderRadius: 14 },
  colorSelected: { borderWidth: 3, borderColor: '#111827' },
  modalButtons: { flexDirection: 'row', justifyContent: 'flex-end', gap: 16 },
  cancelText: { fontSize: 15, color: '#6b7280' },
  confirmText: { fontSize: 15, color: palette.primary, fontWeight: '600' },
});
