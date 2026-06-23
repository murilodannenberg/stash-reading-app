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
import { useFonts, Lora_600SemiBold, Lora_700Bold } from '@expo-google-fonts/lora';
import { Colors } from './src/theme/tokens';
import { AppLogo } from './src/components/AppLogo';
import { installGlobalFont } from './src/utils/globalFont';

installGlobalFont();

const LETTERS = ['S', 't', 'a', 's', 'h'];

function SplashLogo() {
  const logoScale = useRef(new Animated.Value(0.62)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoLift = useRef(new Animated.Value(14)).current;
  const letters = useRef(LETTERS.map(() => new Animated.Value(0))).current;
  const lineScale = useRef(new Animated.Value(0)).current;
  const lineOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      // 1) Logo settles in with a soft spring + lift.
      Animated.parallel([
        Animated.spring(logoScale, { toValue: 1, tension: 38, friction: 7, useNativeDriver: true }),
        Animated.timing(logoOpacity, { toValue: 1, duration: 460, useNativeDriver: true }),
        Animated.spring(logoLift, { toValue: 0, tension: 40, friction: 8, useNativeDriver: true }),
      ]),
      // 2) Wordmark reveals letter by letter.
      Animated.stagger(
        65,
        letters.map((v) =>
          Animated.spring(v, { toValue: 1, tension: 65, friction: 9, useNativeDriver: true }),
        ),
      ),
      // 3) Accent underline grows from the centre.
      Animated.parallel([
        Animated.timing(lineOpacity, { toValue: 1, duration: 180, useNativeDriver: true }),
        Animated.spring(lineScale, { toValue: 1, tension: 45, friction: 10, useNativeDriver: true }),
      ]),
    ]).start();
  }, [logoScale, logoOpacity, logoLift, letters, lineScale, lineOpacity]);

  return (
    <View style={styles.center}>
      <Animated.View
        style={{ opacity: logoOpacity, transform: [{ scale: logoScale }, { translateY: logoLift }] }}
      >
        <AppLogo size={100} />
      </Animated.View>
      <View style={styles.wordmark}>
        {LETTERS.map((ch, i) => (
          <Animated.Text
            key={i}
            style={[
              styles.logoLetter,
              {
                opacity: letters[i],
                transform: [{
                  translateY: letters[i].interpolate({ inputRange: [0, 1], outputRange: [16, 0] }),
                }],
              },
            ]}
          >
            {ch}
          </Animated.Text>
        ))}
      </View>
      <Animated.View
        style={[styles.logoLine, { opacity: lineOpacity, transform: [{ scaleX: lineScale }] }]}
      />
    </View>
  );
}

const MIN_SPLASH_MS = 2200;

export default function App() {
  const [ready, setReady] = useState(false);
  const [minElapsed, setMinElapsed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fontsLoaded] = useFonts({ Lora_600SemiBold, Lora_700Bold });

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

  if (!ready || !minElapsed || !fontsLoaded) {
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
  wordmark: {
    flexDirection: 'row', alignItems: 'flex-end',
    marginTop: 20, paddingHorizontal: 6,
  },
  logoLetter: {
    fontSize: 30, color: Colors.tinta,
    fontFamily: 'Lora_700Bold', includeFontPadding: false,
  },
  logoLine: {
    width: 48, height: 3, borderRadius: 2,
    backgroundColor: Colors.ambar, marginTop: 14,
  },
  errorTitle: { fontSize: 18, fontWeight: '700', color: '#ef4444', marginBottom: 8 },
  errorText: { fontSize: 14, color: '#374151', textAlign: 'center', paddingHorizontal: 32 },
});
