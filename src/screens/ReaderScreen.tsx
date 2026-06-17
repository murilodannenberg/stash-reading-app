import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  ActivityIndicator, TouchableOpacity,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { getArticleById, markAsRead } from '../database';
import { Article, RootStackParamList } from '../types';
import { palette } from '../theme/colors';

type Route = RouteProp<RootStackParamList, 'Reader'>;

export function ReaderScreen() {
  const route = useRoute<Route>();
  const navigation = useNavigation();
  const { articleId } = route.params;
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getArticleById(articleId).then((a) => {
      setArticle(a);
      setLoading(false);
      if (a && !a.is_read) {
        markAsRead(articleId, true);
      }
    });
  }, [articleId]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={palette.primary} />
      </View>
    );
  }

  if (!article) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Artigo não encontrado.</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backLink}>Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{article.title}</Text>
      {article.author != null && (
        <Text style={styles.meta}>{article.author}</Text>
      )}
      {article.reading_time_min != null && (
        <Text style={styles.meta}>{article.reading_time_min} min de leitura</Text>
      )}
      <View style={styles.divider} />

      {article.content_text != null ? (
        <Text style={styles.body}>{article.content_text}</Text>
      ) : (
        <View style={styles.emptyContent}>
          <Text style={styles.emptyText}>
            Este artigo foi salvo sem conteúdo.{'\n'}
            A renderização de HTML completa chegará na v0.2.
          </Text>
          {article.url != null && (
            <Text style={styles.urlText}>URL: {article.url}</Text>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 20, paddingBottom: 60 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: {
    fontSize: 24, fontWeight: '700', color: '#111827',
    lineHeight: 32, marginBottom: 12,
  },
  meta: { fontSize: 13, color: '#6b7280', marginBottom: 4 },
  divider: { height: 1, backgroundColor: '#e5e7eb', marginVertical: 16 },
  body: { fontSize: 17, color: '#374151', lineHeight: 28 },
  emptyContent: { alignItems: 'center', marginTop: 40 },
  emptyText: {
    textAlign: 'center', color: '#6b7280', fontSize: 15, lineHeight: 22, marginBottom: 16,
  },
  urlText: { fontSize: 13, color: palette.primary },
  errorText: { fontSize: 16, color: '#6b7280', marginBottom: 16 },
  backLink: { color: palette.primary, fontSize: 16 },
});
