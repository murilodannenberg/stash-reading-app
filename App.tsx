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
import { AppLogo } from './src/components/AppLogo';
import { installGlobalFont } from './src/utils/globalFont';

installGlobalFont();

function SplashLogo() {
  const logoScale = useRef(new Animated.Value(0.6)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoLift = useRef(new Animated.Value(12)).current;
  const nameOpacity = useRef(new Animated.Value(0)).current;
  const nameLift = useRef(new Animated.Value(10)).current;
  const lineScale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(logoScale, { toValue: 1, tension: 50, friction: 7, useNativeDriver: true }),
        Animated.timing(logoOpacity, { toValue: 1, duration: 380, useNativeDriver: true }),
        Animated.timing(logoLift, { toValue: 0, duration: 420, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(nameOpacity, { toValue: 1, duration: 320, useNativeDriver: true }),
        Animated.timing(nameLift, { toValue: 0, duration: 360, useNativeDriver: true }),
        Animated.spring(lineScale, { toValue: 1, tension: 60, friction: 9, useNativeDriver: true }),
      ]),
    ]).start();
  }, [logoScale, logoOpacity, logoLift, nameOpacity, nameLift, lineScale]);

  return (
    <View style={styles.center}>
      <Animated.View
        style={{ opacity: logoOpacity, transform: [{ scale: logoScale }, { translateY: logoLift }] }}
      >
        <AppLogo size={92} />
      </Animated.View>
      <Animated.Text
        style={[styles.logoName, { opacity: nameOpacity, transform: [{ translateY: nameLift }] }]}
      >
        Stash
      </Animated.Text>
      <Animated.View
        style={[styles.logoLine, { transform: [{ scaleX: lineScale }] }]}
      />
    </View>
  );
}

const MIN_SPLASH_MS = 2200;

export default function App() {
  const [ready, setReady] = useState(false);
  const [minElapsed, setMinElapsed] = useState(false);
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
    // Keep the splash on screen long enough for the intro animation to play,
    // even when DB init finishes almost instantly.
    const t = setTimeout(() => setMinElapsed(true), MIN_SPLASH_MS);
    return () => clearTimeout(t);
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

  if (!ready || !minElapsed) {
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
  logoName: {
    fontSize: 24, fontWeight: '700', color: Colors.tinta,
    fontFamily: 'Georgia', letterSpacing: -0.5, marginTop: 18,
  },
  logoLine: {
    width: 40, height: 3, borderRadius: 2,
    backgroundColor: Colors.ambar, marginTop: 12,
  },
  errorTitle: { fontSize: 18, fontWeight: '700', color: '#ef4444', marginBottom: 8 },
  errorText: { fontSize: 14, color: '#374151', textAlign: 'center', paddingHorizontal: 32 },
});
