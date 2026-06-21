import React, { useCallback, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet,
  TouchableOpacity, Alert, Image,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as Sharing from 'expo-sharing';
import ImageViewing from 'react-native-image-viewing';
import {
  IconFile, IconFileTypePdf, IconPhoto,
  IconFileTypeDoc, IconTrash,
} from '@tabler/icons-react-native';
import { useFileStore } from '../stores/fileStore';
import { useAppThemeStore, getHomeColors } from '../stores/appThemeStore';
import { StashFile, FileType } from '../types';
import { ActionSheet } from '../components/ActionSheet';
import { spacing, radius, typography } from '../theme/colors';

function detectType(name: string, mimeType?: string): FileType {
  const mime = mimeType ?? '';
  if (mime.startsWith('image/') || /\.(jpe?g|png|gif|webp|avif|heic)$/i.test(name)) return 'image';
  if (mime === 'application/pdf' || /\.pdf$/i.test(name)) return 'pdf';
  return 'text';
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function FilesScreen() {
  const { files, loadFiles, deleteFile } = useFileStore();
  const { prefs: appTheme } = useAppThemeStore();
  const colors = getHomeColors(appTheme.homeTheme);

  const [sheetFile, setSheetFile] = useState<StashFile | null>(null);
  const [imageViewerUris, setImageViewerUris] = useState<{ uri: string }[]>([]);
  const [imageViewerVisible, setImageViewerVisible] = useState(false);

  useFocusEffect(useCallback(() => { loadFiles(); }, [loadFiles]));

  const handleOpen = useCallback(async (file: StashFile) => {
    if (file.type === 'image') {
      setImageViewerUris([{ uri: file.path }]);
      setImageViewerVisible(true);
      return;
    }
    const available = await Sharing.isAvailableAsync();
    if (!available) {
      Alert.alert('Indisponível', 'Compartilhamento não disponível neste dispositivo.');
      return;
    }
    await Sharing.shareAsync(file.path, { mimeType: file.type === 'pdf' ? 'application/pdf' : 'text/plain' });
  }, []);

  const handleDelete = useCallback((file: StashFile) => {
    Alert.alert(
      'Remover arquivo',
      `Remover "${file.name}"? Esta ação não pode ser desfeita.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover', style: 'destructive',
          onPress: () => deleteFile(file.id, file.path),
        },
      ],
    );
  }, [deleteFile]);

  const FileIcon = ({ type, color }: { type: FileType; color: string }) => {
    const props = { size: 22, color, strokeWidth: 1.5 };
    if (type === 'pdf') return <IconFileTypePdf {...props} />;
    if (type === 'image') return <IconPhoto {...props} />;
    return <IconFileTypeDoc {...props} />;
  };

  const renderFile = ({ item }: { item: StashFile }) => (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.background }]}
      activeOpacity={0.7}
      onPress={() => handleOpen(item)}
      onLongPress={() => setSheetFile(item)}
    >
      {item.type === 'image' ? (
        <Image source={{ uri: item.path }} style={[styles.thumb, { backgroundColor: colors.inputBg }]} resizeMode="cover" />
      ) : (
        <View style={[styles.thumb, styles.thumbIcon, { backgroundColor: colors.inputBg }]}>
          <FileIcon type={item.type} color={item.type === 'pdf' ? '#ef4444' : colors.textMuted} />
        </View>
      )}
      <View style={styles.cardBody}>
        <Text style={[styles.cardName, { color: colors.text }]} numberOfLines={2}>{item.name}</Text>
        <Text style={[styles.cardMeta, { color: colors.textMuted }]}>
          {item.type.toUpperCase()} · {formatBytes(item.size_bytes)}
        </Text>
      </View>
      <TouchableOpacity
        onPress={() => handleDelete(item)}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        style={styles.deleteBtn}
      >
        <IconTrash size={18} color={colors.textMuted} strokeWidth={1.5} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={files}
        keyExtractor={(f) => f.id}
        renderItem={renderFile}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={[styles.separator, { backgroundColor: colors.border }]} />}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <IconFile size={48} color={colors.textMuted} strokeWidth={1} />
            <Text style={[styles.emptyTitle, { color: colors.textSecondary }]}>Nenhum arquivo</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
              Imagens salvas dos artigos aparecem aqui
            </Text>
          </View>
        }
      />

      <ActionSheet
        visible={sheetFile != null}
        onClose={() => setSheetFile(null)}
        title={sheetFile?.name}
        actions={sheetFile ? [
          {
            label: 'Abrir',
            Icon: IconFile,
            onPress: () => handleOpen(sheetFile),
          },
          {
            label: 'Remover',
            style: 'destructive',
            Icon: IconTrash,
            onPress: () => handleDelete(sheetFile),
          },
        ] : []}
      />

      <ImageViewing
        images={imageViewerUris}
        imageIndex={0}
        visible={imageViewerVisible}
        onRequestClose={() => setImageViewerVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { paddingBottom: 100 },
  separator: { height: 0.5, marginHorizontal: spacing.lg },
  card: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
  },
  thumb: {
    width: 52, height: 52, borderRadius: radius.sm, marginRight: spacing.md,
  },
  thumbIcon: { justifyContent: 'center', alignItems: 'center' },
  cardBody: { flex: 1 },
  cardName: { ...typography.title, marginBottom: 2 },
  cardMeta: { ...typography.caption },
  deleteBtn: { marginLeft: spacing.sm, padding: 4 },
  emptyWrap: { alignItems: 'center', marginTop: 80, paddingHorizontal: spacing.xl },
  emptyTitle: { ...typography.heading, marginTop: spacing.lg },
  emptySubtitle: { ...typography.body, marginTop: spacing.xs, textAlign: 'center' },
});
