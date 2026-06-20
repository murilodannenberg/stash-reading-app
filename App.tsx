import 'react-native-get-random-values';
import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { openDatabase } from './src/database/connection';
import { runMigrations } from './src/database/migrations';
import { AppNavigator } from './src/navigation';
import { useAppThemeStore } from './src/stores/appThemeStore';
import { palette } from './src/theme/colors';

export default function App() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hydrateTheme = useAppThemeStore((s) => s._hydrate);

  useEffect(() => {
    async function init() {
      try {
        hydrateTheme();
        const db = await openDatabase();
        await runMigrations(db);
        setReady(true);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Erro ao inicializar banco.');
      }
    }
    init();
  }, [hydrateTheme]);

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorTitle}>Erro ao inicializar</Text>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (!ready) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={palette.primary} size="large" />
        <Text style={styles.loadingText}>Carregando Stash…</Text>
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="auto" />
      <AppNavigator />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff',
  },
  loadingText: { marginTop: 12, color: '#6b7280', fontSize: 14 },
  errorTitle: { fontSize: 18, fontWeight: '700', color: '#ef4444', marginBottom: 8 },
  errorText: { fontSize: 14, color: '#374151', textAlign: 'center', paddingHorizontal: 32 },
});
