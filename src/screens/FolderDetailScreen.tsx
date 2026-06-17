import React, { useEffect } from 'react';
import {
  View, Text, FlatList, StyleSheet,
  TouchableOpacity, Alert,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useArticleStore } from '../stores/articleStore';
import { useFolderStore } from '../stores/folderStore';
import { Article, Folder, RootStackParamList } from '../types';
import { palette } from '../theme/colors';

type Route = RouteProp<RootStackParamList, 'FolderDetail'>;
type Nav = NativeStackNavigationProp<RootStackParamList>;

export function FolderDetailScreen() {
  const route = useRoute<Route>();
  const navigation = useNavigation<Nav>();
  const { folderId } = route.params;
  const { articles, loadArticles, deleteArticle, toggleFavorite } = useArticleStore();
  const { folders, loadFolders } = useFolderStore();

  useEffect(() => {
    loadArticles(folderId);
    loadFolders(folderId);
  }, [folderId, loadArticles, loadFolders]);

  const handleDeleteArticle = (article: Article) => {
    Alert.alert(
      'Remover artigo',
      `Remover "${article.title}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Remover', style: 'destructive', onPress: () => deleteArticle(article.id) },
      ]
    );
  };

  const renderSubfolder = ({ item }: { item: Folder }) => (
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
        {item.author != null && <Text style={styles.articleMeta}>{item.author}</Text>}
      </View>
      <TouchableOpacity onPress={() => toggleFavorite(item.id)}>
        <Text style={styles.favoriteIcon}>{item.is_favorite ? '★' : '☆'}</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {folders.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Subpastas</Text>
          <FlatList
            data={folders}
            keyExtractor={(f) => f.id}
            renderItem={renderSubfolder}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.folderList}
          />
        </>
      )}
      <Text style={styles.sectionTitle}>Artigos</Text>
      <FlatList
        data={articles}
        keyExtractor={(a) => a.id}
        renderItem={renderArticle}
        contentContainerStyle={styles.articleList}
        ListEmptyComponent={<Text style={styles.empty}>Nenhum artigo nesta pasta.</Text>}
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('AddArticle', { folderId })}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
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
    marginHorizontal: 4,
    borderWidth: 1, borderColor: '#e5e7eb',
  },
  folderIcon: { fontSize: 18, marginRight: 6 },
  folderName: { fontSize: 13, fontWeight: '500', color: '#374151' },
  articleList: { paddingHorizontal: 16, paddingBottom: 100 },
  articleItem: {
    backgroundColor: '#fff', borderRadius: 12, padding: 14,
    marginBottom: 10, flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: '#e5e7eb',
  },
  articleRead: { opacity: 0.6 },
  articleContent: { flex: 1 },
  articleTitle: { fontSize: 15, fontWeight: '600', color: '#111827', marginBottom: 4 },
  articleMeta: { fontSize: 12, color: '#6b7280' },
  favoriteIcon: { fontSize: 20, color: palette.accent, padding: 4 },
  fab: {
    position: 'absolute', bottom: 24, right: 16,
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: palette.primary,
    justifyContent: 'center', alignItems: 'center',
    elevation: 4,
  },
  fabText: { fontSize: 28, color: '#fff', lineHeight: 32 },
  empty: { textAlign: 'center', color: '#9ca3af', fontSize: 15, marginTop: 40 },
});
