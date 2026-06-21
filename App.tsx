import 'react-native-get-random-values';
import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, AppState, Animated } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { openDatabase } from './src/database/connection';
import { runMigrations } from './src/database/migrations';
import { AppNavigator } from './src/navigation';
import { useAppThemeStore } from './src/stores/appThemeStore';
import { useShareStore } from './src/stores/shareStore';
import { getSharedUrl, clearSharedUrl, extractUrl } from './src/services/shareIntent';
import { Colors } from './src/theme/tokens';

function SplashLogo() {
  const scale = useRef(new Animated.Value(0.7)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();
  }, [opacity, scale]);

  return (
    <View style={styles.center}>
      <Animated.View style={[styles.logoWrap, { opacity, transform: [{ scale }] }]}>
        <View style={styles.logoMark}>
          <Text style={styles.logoLetter}>S</Text>
        </View>
        <Text style={styles.logoName}>Stash</Text>
      </Animated.View>
    </View>
  );
}

export default function App() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hydrateTheme = useAppThemeStore((s) => s._hydrate);
  const setPendingUrl = useShareStore((s) => s.setPendingUrl);

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

  // Detecta URLs compartilhadas após o banco estar pronto
  useEffect(() => {
    if (!ready) return;

    async function checkSharedUrl() {
      const raw = await getSharedUrl();
      if (raw) {
        clearSharedUrl();
        const url = extractUrl(raw) ?? (raw.startsWith('http') ? raw : null);
        if (url) setPendingUrl(url);
      }
    }

    // Verifica na inicialização (cold start via share intent)
    checkSharedUrl();

    // Verifica quando o app volta ao primeiro plano (warm start via share intent)
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') checkSharedUrl();
    });

    return () => sub.remove();
  }, [ready, setPendingUrl]);

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorTitle}>Erro ao inicializar</Text>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (!ready) {
    return <SplashLogo />;
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
    flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.papel,
  },
  logoWrap: { alignItems: 'center', gap: 16 },
  logoMark: {
    width: 80, height: 80, borderRadius: 22,
    backgroundColor: Colors.ambar + '18',
    borderWidth: 1.5, borderColor: Colors.ambar + '40',
    justifyContent: 'center', alignItems: 'center',
  },
  logoLetter: {
    fontSize: 40, fontWeight: '700', color: Colors.ambar,
    fontFamily: 'Georgia', letterSpacing: -1,
  },
  logoName: {
    fontSize: 22, fontWeight: '700', color: Colors.tinta,
    fontFamily: 'Georgia', letterSpacing: -0.5,
  },
  errorTitle: { fontSize: 18, fontWeight: '700', color: '#ef4444', marginBottom: 8 },
  errorText: { fontSize: 14, color: '#374151', textAlign: 'center', paddingHorizontal: 32 },
});
