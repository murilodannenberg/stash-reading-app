import React, { useEffect, useCallback, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  TextInput, Alert, Modal, Pressable,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFolderStore } from '../stores/folderStore';
import { useArticleStore } from '../stores/articleStore';
import { RootStackParamList, Article, Folder } from '../types';
import { palette } from '../theme/colors';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function LibraryScreen() {
  const navigation = useNavigation<Nav>();
  const { folders, loadFolders, createFolder } = useFolderStore();
  const { articles, loadArticles, deleteArticle, toggleFavorite } = useArticleStore();
  const [newFolderName, setNewFolderName] = useState('');
  const [showFolderModal, setShowFolderModal] = useState(false);

  useEffect(() => {
    loadFolders(null);
    loadArticles(null);
  }, [loadFolders, loadArticles]);

  const handleCreateFolder = useCallback(async () => {
    if (!newFolderName.trim()) return;
    await createFolder(newFolderName.trim());
    setNewFolderName('');
    setShowFolderModal(false);
  }, [newFolderName, createFolder]);

  const handleDeleteArticle = useCallback((article: Article) => {
    Alert.alert(
      'Remover artigo',
      `Remover "${article.title}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Remover', style: 'destructive', onPress: () => deleteArticle(article.id) },
      ]
    );
  }, [deleteArticle]);

  const renderFolder = ({ item }: { item: Folder }) => (
    <TouchableOpacity
      style={styles.folderItem}
      onPress={() => navigation.navigate('FolderDetail', { folderId: item.id, folderName: item.name })}
    >
      <Text style={styles.folderIcon}>📁</Text>
      <Text style={styles.folderName}>{item.name}</Text>
    </TouchableOpacity>
  );

  const renderArticle = ({ item }: { item: Article }) => (
    <TouchableOpacity
      style={[styles.articleItem, item.is_read && styles.articleRead]}
      onPress={() => navigation.navigate('Reader', { articleId: item.id })}
      onLongPress={() => handleDeleteArticle(item)}
    >
      <View style={styles.articleContent}>
        <Text style={styles.articleTitle} numberOfLines={2}>{item.title}</Text>
        {item.author != null && (
          <Text style={styles.articleMeta}>{item.author}</Text>
        )}
        {item.reading_time_min != null && (
          <Text style={styles.articleMeta}>{item.reading_time_min} min de leitura</Text>
        )}
      </View>
      <TouchableOpacity onPress={() => toggleFavorite(item.id)} style={styles.favoriteBtn}>
        <Text style={styles.favoriteIcon}>{item.is_favorite ? '★' : '☆'}</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Folders section */}
      {folders.length > 0 && (
        <View>
          <Text style={styles.sectionTitle}>Pastas</Text>
          <FlatList
            data={folders}
            keyExtractor={(f) => f.id}
            renderItem={renderFolder}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.folderList}
          />
        </View>
      )}

      {/* Articles section */}
      <Text style={styles.sectionTitle}>Artigos</Text>
      <FlatList
        data={articles}
        keyExtractor={(a) => a.id}
        renderItem={renderArticle}
        contentContainerStyle={styles.articleList}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            Nenhum artigo ainda.{'\n'}Toque em + para adicionar.
          </Text>
        }
      />

      {/* FAB actions */}
      <View style={styles.fabRow}>
        <TouchableOpacity style={[styles.fab, styles.fabSecondary]} onPress={() => setShowFolderModal(true)}>
          <Text style={styles.fabText}>📁</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('AddArticle', {})}>
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      </View>

      {/* New folder modal */}
      <Modal visible={showFolderModal} transparent animationType="fade">
        <Pressable style={styles.overlay} onPress={() => setShowFolderModal(false)}>
          <Pressable style={styles.modal}>
            <Text style={styles.modalTitle}>Nova pasta</Text>
            <TextInput
              style={styles.input}
              placeholder="Nome da pasta"
              value={newFolderName}
              onChangeText={setNewFolderName}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleCreateFolder}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity onPress={() => setShowFolderModal(false)}>
                <Text style={styles.cancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleCreateFolder}>
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
  sectionTitle: {
    fontSize: 13, fontWeight: '600', color: '#6b7280',
    marginTop: 16, marginBottom: 8, marginHorizontal: 16,
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  folderList: { paddingHorizontal: 12 },
  folderItem: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 10, padding: 10,
    marginHorizontal: 4, minWidth: 100,
    borderWidth: 1, borderColor: '#e5e7eb',
  },
  folderIcon: { fontSize: 20, marginRight: 6 },
  folderName: { fontSize: 14, fontWeight: '500', color: '#374151' },
  articleList: { paddingHorizontal: 16, paddingBottom: 100 },
  articleItem: {
    backgroundColor: '#fff', borderRadius: 12, padding: 14,
    marginBottom: 10, flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: '#e5e7eb',
  },
  articleRead: { opacity: 0.6 },
  articleContent: { flex: 1 },
  articleTitle: { fontSize: 15, fontWeight: '600', color: '#111827', marginBottom: 4 },
  articleMeta: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  favoriteBtn: { padding: 4, marginLeft: 8 },
  favoriteIcon: { fontSize: 20, color: palette.accent },
  fabRow: {
    position: 'absolute', bottom: 24, right: 16,
    flexDirection: 'row', gap: 12,
  },
  fab: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: palette.primary,
    justifyContent: 'center', alignItems: 'center',
    elevation: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2, shadowRadius: 4,
  },
  fabSecondary: { backgroundColor: '#fff', borderWidth: 2, borderColor: palette.primary },
  fabText: { fontSize: 22, color: '#fff', fontWeight: '600' },
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
  modalButtons: { flexDirection: 'row', justifyContent: 'flex-end', gap: 16 },
  cancelText: { fontSize: 15, color: '#6b7280' },
  confirmText: { fontSize: 15, color: palette.primary, fontWeight: '600' },
  emptyText: {
    textAlign: 'center', color: '#9ca3af', fontSize: 15, marginTop: 60, lineHeight: 24,
  },
});
