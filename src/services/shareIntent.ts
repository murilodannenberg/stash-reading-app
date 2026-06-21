import { NativeModules, Platform } from 'react-native';

const { ShareIntentModule } = NativeModules;

/**
 * Retorna o texto/URL recebido via share intent no Android.
 * Sempre retorna null em iOS (Share Extension requer setup nativo separado).
 */
export async function getSharedUrl(): Promise<string | null> {
  if (Platform.OS !== 'android' || !ShareIntentModule) return null;
  try {
    return await ShareIntentModule.getSharedUrl();
  } catch {
    return null;
  }
}

/**
 * Limpa o valor pendente para que não seja processado novamente.
 */
export function clearSharedUrl(): void {
  if (Platform.OS !== 'android' || !ShareIntentModule) return;
  ShareIntentModule.clearSharedUrl();
}

/**
 * Extrai a primeira URL http(s) encontrada em um texto qualquer.
 * Alguns apps compartilham "Título do artigo: https://..." em vez de só a URL.
 */
export function extractUrl(text: string): string | null {
  const match = text.match(/https?:\/\/[^\s]+/);
  return match ? match[0] : null;
}
