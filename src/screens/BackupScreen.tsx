import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, Alert, ActivityIndicator, StyleSheet, ScrollView,
} from 'react-native';
import { IconDownload, IconUpload, IconInfoCircle } from '@tabler/icons-react-native';
import { useAppThemeStore, getHomeColors } from '../stores/appThemeStore';
import { spacing, radius, typography } from '../theme/colors';
import { exportBackup, importBackup } from '../services/backup';

export function BackupScreen() {
  const { prefs } = useAppThemeStore();
  const colors = getHomeColors(prefs.homeTheme);
  const accent = prefs.accentColor;
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportBackup();
    } catch (e) {
      Alert.alert('Erro ao exportar', e instanceof Error ? e.message : 'Erro desconhecido.');
    } finally {
      setExporting(false);
    }
  };

  const handleImport = () => {
    Alert.alert(
      'Restaurar backup',
      'Isso substituirá todos os dados atuais (artigos, destaques, pastas e tags) pelo conteúdo do backup.\n\nEssa ação não pode ser desfeita. Após a restauração, feche e reabra o Stash.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Restaurar',
          style: 'destructive',
          onPress: async () => {
            setImporting(true);
            try {
              const outcome = await importBackup();
              if (outcome === 'ok') {
                Alert.alert(
                  'Backup restaurado!',
                  'Feche completamente o Stash e abra novamente para carregar os dados restaurados.',
                );
              }
            } catch (e) {
              Alert.alert('Erro ao restaurar', e instanceof Error ? e.message : 'Erro desconhecido.');
            } finally {
              setImporting(false);
            }
          },
        },
      ],
    );
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      {/* Aviso informativo */}
      <View style={[styles.infoBox, { backgroundColor: accent + '14', borderColor: accent + '40' }]}>
        <IconInfoCircle size={16} color={accent} strokeWidth={1.75} style={styles.infoIcon} />
        <Text style={[styles.infoText, { color: colors.textSecondary }]}>
          O backup contém artigos, destaques, pastas e tags. Imagens de capa serão baixadas novamente ao abrir cada artigo.
        </Text>
      </View>

      {/* Exportar */}
      <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Exportar</Text>
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.desc, { color: colors.textMuted }]}>
          Gera um arquivo{' '}
          <Text style={styles.mono}>.db</Text>
          {' '}com todos os seus dados. Salve-o em um local seguro (Google Drive, e-mail, etc.).
        </Text>
        <TouchableOpacity
          style={[styles.btn, { backgroundColor: accent }, (exporting || importing) && styles.btnDisabled]}
          onPress={handleExport}
          disabled={exporting || importing}
          activeOpacity={0.8}
        >
          {exporting ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <IconDownload size={18} color="#fff" strokeWidth={2} />
              <Text style={styles.btnText}>Exportar backup</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Restaurar */}
      <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Restaurar</Text>
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.desc, { color: colors.textMuted }]}>
          Selecione um arquivo de backup{' '}
          <Text style={styles.mono}>.db</Text>
          {' '}para substituir os dados atuais. O app precisará ser reiniciado.
        </Text>
        <TouchableOpacity
          style={[styles.btn, styles.btnDestructive, (exporting || importing) && styles.btnDisabled]}
          onPress={handleImport}
          disabled={exporting || importing}
          activeOpacity={0.8}
        >
          {importing ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <IconUpload size={18} color="#fff" strokeWidth={2} />
              <Text style={styles.btnText}>Restaurar backup</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingTop: spacing.lg, paddingBottom: 48 },

  infoBox: {
    flexDirection: 'row',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  infoIcon: { marginTop: 1 },
  infoText: { ...typography.caption, flex: 1, lineHeight: 18 },

  sectionLabel: {
    ...typography.label,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    marginTop: spacing.xl,
  },
  card: {
    marginHorizontal: spacing.lg,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    gap: spacing.md,
  },
  desc: { ...typography.body, lineHeight: 22 },
  mono: { fontFamily: 'monospace', fontSize: 13 },

  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: 12,
    borderRadius: radius.md,
  },
  btnDestructive: { backgroundColor: '#ef4444' },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontWeight: '600', fontSize: 15 },
});
