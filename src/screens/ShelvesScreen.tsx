import React, { useCallback, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet,
  TouchableOpacity, Alert, Modal, Pressable, TextInput,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useFolderStore } from '../stores/folderStore';
import { useAppThemeStore, getHomeColors } from '../stores/appThemeStore';
import { Folder, RootStackParamList } from '../types';
import { spacing, radius, typography } from '../theme/colors';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function ShelvesScreen() {
  const navigation = useNavigation<Nav>();
  const { folders, loadFolders, createFolder, deleteFolder } = useFolderStore();
  const { prefs: appTheme } = useAppThemeStore();
  const colors = getHomeColors(appTheme.homeTheme);
  const accent = appTheme.accentColor;

  const [showModal, setShowModal] = useState(false);
  const [newName, setNewName] = useState('');

  useFocusEffect(
    useCallback(() => {
      loadFolders(null);
    }, [loadFolders])
  );

  const handleCreate = useCallback(async () => {
    if (!newName.trim()) return;
    await createFolder(newName.trim());
    setNewName('');
    setShowModal(false);
  }, [newName, createFolder]);

  const handleLongPress = useCallback((folder: Folder) => {
    Alert.alert(folder.name, undefined, [
      {
        text: 'Excluir estante',
        style: 'destructive',
        onPress: () =>
          Alert.alert('Remover estante', `Remover "${folder.name}" e todo seu conteúdo?`, [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Remover', style: 'destructive', onPress: () => deleteFolder(folder.id) },
          ]),
      },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  }, [deleteFolder]);

  const renderItem = ({ item }: { item: Folder }) => (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
      activeOpacity={0.7}
      onPress={() => navigation.navigate('FolderDetail', { folderId: item.id, folderName: item.name })}
      onLongPress={() => handleLongPress(item)}
    >
      <View style={[styles.iconWrap, { backgroundColor: accent + '18' }]}>
        <Ionicons name="library-outline" size={22} color={accent} />
      </View>
      <View style={styles.cardBody}>
        <Text style={[styles.cardName, { color: colors.text }]} numberOfLines={1}>
          {item.name}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={folders}
        keyExtractor={(f) => f.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Ionicons name="library-outline" size={48} color={colors.border} />
            <Text style={[styles.emptyTitle, { color: colors.textSecondary }]}>
              Nenhuma estante ainda
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
              Organize seus artigos criando estantes
            </Text>
          </View>
        }
      />

      {/* FAB — nova estante */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: accent, shadowColor: accent }]}
        activeOpacity={0.85}
        onPress={() => setShowModal(true)}
      >
        <Ionicons name="add" size={26} color="#fff" />
      </TouchableOpacity>

      {/* Modal de nova estante */}
      <Modal visible={showModal} transparent animationType="fade">
        <Pressable style={styles.overlay} onPress={() => setShowModal(false)}>
          <Pressable style={[styles.modal, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Nova estante</Text>
            <TextInput
              style={[styles.modalInput, { borderColor: colors.border, color: colors.text }]}
              placeholder="Nome da estante"
              placeholderTextColor={colors.textMuted}
              value={newName}
              onChangeText={setNewName}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleCreate}
            />
            <View style={styles.modalBtns}>
              <TouchableOpacity
                style={styles.btnCancel}
                onPress={() => setShowModal(false)}
              >
                <Text style={[styles.btnCancelText, { color: colors.textSecondary }]}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btnConfirm, { backgroundColor: accent }]}
                onPress={handleCreate}
              >
                <Text style={styles.btnConfirmText}>Criar</Text>
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

  card: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: radius.lg, padding: spacing.lg,
    marginBottom: spacing.sm, borderWidth: 1,
  },
  iconWrap: {
    width: 44, height: 44, borderRadius: radius.md,
    justifyContent: 'center', alignItems: 'center',
    marginRight: spacing.md,
  },
  cardBody: { flex: 1 },
  cardName: { ...typography.subheading },

  emptyWrap: { alignItems: 'center', marginTop: 80 },
  emptyTitle: { ...typography.heading, marginTop: spacing.lg },
  emptySubtitle: { ...typography.body, marginTop: spacing.xs, textAlign: 'center' },

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
    borderRadius: radius.xl, padding: spacing['2xl'], width: 300,
    elevation: 8,
  },
  modalTitle: { ...typography.heading, marginBottom: spacing.lg },
  modalInput: {
    borderWidth: 1, borderRadius: radius.md,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    fontSize: 15, marginBottom: spacing.lg,
  },
  modalBtns: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.sm },
  btnCancel: { paddingVertical: spacing.sm, paddingHorizontal: spacing.lg },
  btnCancelText: { ...typography.body },
  btnConfirm: {
    paddingVertical: spacing.sm, paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
  },
  btnConfirmText: { ...typography.body, color: '#fff', fontWeight: '600' },
});
