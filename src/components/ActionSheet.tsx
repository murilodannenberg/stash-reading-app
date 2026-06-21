import React from 'react';
import {
  Modal, View, Text, TouchableOpacity, StyleSheet, Pressable,
} from 'react-native';
import { useAppThemeStore, getHomeColors } from '../stores/appThemeStore';
import { spacing, radius, typography, palette } from '../theme/colors';

type TablerIcon = React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;

export type ActionSheetAction = {
  label: string;
  onPress: () => void;
  style?: 'default' | 'destructive';
  Icon?: TablerIcon;
};

type Props = {
  visible: boolean;
  onClose: () => void;
  title?: string;
  actions: ActionSheetAction[];
};

export function ActionSheet({ visible, onClose, title, actions }: Props) {
  const { prefs: appTheme } = useAppThemeStore();
  const colors = getHomeColors(appTheme.homeTheme);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={[styles.panel, { backgroundColor: colors.surface }]}>
          <View style={[styles.handle, { backgroundColor: colors.border }]} />

          {title != null && (
            <Text style={[styles.title, { color: colors.textSecondary }]} numberOfLines={2}>
              {title}
            </Text>
          )}

          {actions.map((action, index) => {
            const isDestructive = action.style === 'destructive';
            const labelColor = isDestructive ? palette.danger : colors.text;
            const iconColor = isDestructive ? palette.danger : colors.textSecondary;
            return (
              <React.Fragment key={action.label}>
                {index > 0 && (
                  <View style={[styles.separator, { backgroundColor: colors.border }]} />
                )}
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => { onClose(); action.onPress(); }}
                  activeOpacity={0.6}
                >
                  {action.Icon != null && (
                    <View style={styles.actionIcon}>
                      <action.Icon size={20} color={iconColor} strokeWidth={1.75} />
                    </View>
                  )}
                  <Text style={[styles.actionLabel, { color: labelColor }]}>
                    {action.label}
                  </Text>
                </TouchableOpacity>
              </React.Fragment>
            );
          })}

          <View style={[styles.cancelDivider, { backgroundColor: colors.border }]} />
          <TouchableOpacity style={styles.actionBtn} onPress={onClose} activeOpacity={0.6}>
            <Text style={[styles.actionLabel, styles.cancelLabel, { color: colors.textSecondary }]}>
              Cancelar
            </Text>
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
  },
  handle: {
    width: 36, height: 4, borderRadius: 2,
    alignSelf: 'center', marginBottom: spacing.md,
  },
  title: {
    ...typography.caption,
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
  },
  separator: { height: 0.5, marginHorizontal: spacing.lg },
  cancelDivider: { height: 6, marginTop: spacing.sm },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.xl, paddingVertical: spacing.lg,
  },
  actionIcon: { marginRight: spacing.md },
  actionLabel: { ...typography.body },
  cancelLabel: { fontWeight: '600' },
});
