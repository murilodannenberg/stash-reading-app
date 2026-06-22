import { MMKV } from 'react-native-mmkv';

// Per-article scroll progress (0..1) so the reader can resume where you left off.
// Lightweight UI state — kept in MMKV rather than the DB.

let storage: MMKV | null = null;
function getStorage(): MMKV {
  if (!storage) storage = new MMKV({ id: 'reading-position' });
  return storage;
}

export function getReadingPosition(articleId: string): number {
  try {
    return getStorage().getNumber(`pos_${articleId}`) ?? 0;
  } catch {
    return 0;
  }
}

export function setReadingPosition(articleId: string, progress: number): void {
  try {
    // Treat "basically finished" as done, so reopening starts at the top.
    getStorage().set(`pos_${articleId}`, progress > 0.95 ? 0 : progress);
  } catch {
    // MMKV not ready — ignore
  }
}
