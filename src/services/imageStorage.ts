import { File, Directory, Paths } from 'expo-file-system';

const COVERS_DIR = new Directory(Paths.document, 'covers');

/**
 * Downloads a cover image and returns the local file URI.
 * Returns null if the download fails (non-blocking).
 */
export async function downloadCoverImage(
  remoteUrl: string,
  articleId: string,
): Promise<string | null> {
  try {
    // Ensure covers directory exists
    if (!COVERS_DIR.exists) {
      COVERS_DIR.create();
    }

    const ext = getExtension(remoteUrl);
    const destination = new File(COVERS_DIR, `${articleId}${ext}`);

    // If file already exists, remove it first
    if (destination.exists) {
      destination.delete();
    }

    const downloaded = await File.downloadFileAsync(remoteUrl, destination);
    return downloaded.uri;
  } catch {
    return null;
  }
}

export async function deleteCoverImage(localUri: string): Promise<void> {
  try {
    const file = new File(localUri);
    if (file.exists) {
      file.delete();
    }
  } catch {
    // silently ignore
  }
}

function getExtension(url: string): string {
  try {
    const pathname = new URL(url).pathname;
    const match = pathname.match(/\.(jpe?g|png|webp|gif|avif)(\?|$)/i);
    return match ? `.${match[1].toLowerCase()}` : '.jpg';
  } catch {
    return '.jpg';
  }
}
