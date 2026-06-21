import React, { useCallback, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet,
  TouchableOpacity, Alert, Modal, Pressable, TextInput, ScrollView,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { IconChevronRight, IconPlus, IconTrash, IconEdit } from '@tabler/icons-react-native';
import { useFolderStore } from '../stores/folderStore';
import { useAppThemeStore, getHomeColors } from '../stores/appThemeStore';
import { Folder, RootStackParamList } from '../types';
import { spacing, radius, typography } from '../theme/colors';
import { ActionSheet } from '../components/ActionSheet';
import { ShelfIcon, SHELF_ICONS } from '../components/ShelfIcon';

type Nav = NativeStackNavigationProp<RootStackParamList>;

// Modal inner width: 300 - 2*32 (padding) = 236px, 5 columns
const ICON_CELL = Math.floor(236 / 5);

export function ShelvesScreen() {
  const navigation = useNavigation<Nav>();
  const { folders, loadFolders, createFolder, updateFolder, deleteFolder } = useFolderStore();
  const { prefs: appTheme } = useAppThemeStore();
  const colors = getHomeColors(appTheme.homeTheme);
  const accent = appTheme.accentColor;

  const [showModal, setShowModal] = useState(false);
  const [editFolder, setEditFolder] = useState<Folder | null>(null);
  const [formName, setFormName] = useState('');
  const [formIcon, setFormIcon] = useState('books');
  const [sheetFolder, setSheetFolder] = useState<Folder | null>(null);

  useFocusEffect(
    useCallback(() => {
      loadFolders(null);
    }, [loadFolders])
  );

  const openCreateModal = useCallback(() => {
    setEditFolder(null);
    setFormName('');
    setFormIcon('books');
    setShowModal(true);
  }, []);

  const openEditModal = useCallback((folder: Folder) => {
    setEditFolder(folder);
    setFormName(folder.name);
    setFormIcon(folder.icon ?? 'books');
    setShowModal(true);
  }, []);

  const handleConfirm = useCallback(async () => {
    if (!formName.trim()) return;
    if (editFolder) {
      await updateFolder(editFolder.id, formName.trim(), formIcon);
    } else {
      await createFolder(formName.trim(), null, formIcon);
    }
    setShowModal(false);
  }, [formName, formIcon, editFolder, createFolder, updateFolder]);

  const handleLongPress = useCallback((folder: Folder) => {
    setSheetFolder(folder);
  }, []);

  const renderItem = ({ item }: { item: Folder }) => (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
      activeOpacity={0.7}
      onPress={() => navigation.navigate('FolderDetail', { folderId: item.id, folderName: item.name })}
      onLongPress={() => handleLongPress(item)}
    >
      <View style={[styles.iconWrap, { backgroundColor: accent + '18' }]}>
        <ShelfIcon iconKey={item.icon ?? 'books'} size={22} color={accent} strokeWidth={1.5} />
      </View>
      <View style={styles.cardBody}>
        <Text style={[styles.cardName, { color: colors.text }]} numberOfLines={1}>
          {item.name}
        </Text>
      </View>
      <IconChevronRight size={18} color={colors.textMuted} strokeWidth={1.5} />
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
            <ShelfIcon iconKey="books" size={48} color={colors.border} strokeWidth={1} />
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
        onPress={openCreateModal}
      >
        <IconPlus size={26} color="#fff" strokeWidth={2} />
      </TouchableOpacity>

      <ActionSheet
        visible={sheetFolder != null}
        onClose={() => setSheetFolder(null)}
        title={sheetFolder?.name}
        actions={sheetFolder ? [
          {
            label: 'Editar estante',
            Icon: IconEdit,
            onPress: () => openEditModal(sheetFolder),
          },
          {
            label: 'Excluir estante',
            style: 'destructive',
            Icon: IconTrash,
            onPress: () => Alert.alert(
              'Remover estante',
              `Remover "${sheetFolder.name}" e todo seu conteúdo?`,
              [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Remover', style: 'destructive', onPress: () => deleteFolder(sheetFolder.id) },
              ],
            ),
          },
        ] : []}
      />

      {/* Modal — criar / editar estante */}
      <Modal visible={showModal} transparent animationType="fade">
        <Pressable style={styles.overlay} onPress={() => setShowModal(false)}>
          <Pressable style={[styles.modal, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {editFolder ? 'Editar estante' : 'Nova estante'}
            </Text>

            {/* Picker de ícones */}
            <Text style={[styles.modalLabel, { color: colors.textMuted }]}>Ícone</Text>
            <ScrollView
              style={styles.iconGridWrap}
              contentContainerStyle={styles.iconGrid}
              showsVerticalScrollIndicator={false}
            >
              {SHELF_ICONS.map(({ key, Icon }) => (
                <TouchableOpacity
                  key={key}
                  style={[
                    styles.iconCell,
                    { borderColor: 'transparent' },
                    formIcon === key && { backgroundColor: accent + '22', borderColor: accent },
                  ]}
                  onPress={() => setFormIcon(key)}
                  activeOpacity={0.7}
                >
                  <Icon
                    size={22}
                    color={formIcon === key ? accent : colors.textSecondary}
                    strokeWidth={1.5}
                  />
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Nome */}
            <Text style={[styles.modalLabel, { color: colors.textMuted }]}>Nome</Text>
            <TextInput
              style={[styles.modalInput, { borderColor: colors.border, color: colors.text }]}
              placeholder="Nome da estante"
              placeholderTextColor={colors.textMuted}
              value={formName}
              onChangeText={setFormName}
              autoFocus={!editFolder}
              returnKeyType="done"
              onSubmitEditing={handleConfirm}
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
                onPress={handleConfirm}
              >
                <Text style={styles.btnConfirmText}>
                  {editFolder ? 'Salvar' : 'Criar'}
                </Text>
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

  modalLabel: {
    ...typography.label,
    marginBottom: spacing.xs,
  },
  iconGridWrap: {
    maxHeight: 188,
    marginBottom: spacing.lg,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  iconCell: {
    width: ICON_CELL,
    height: ICON_CELL,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: radius.sm,
    borderWidth: 1.5,
    marginBottom: 2,
  },

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
