import { File, Directory, Paths } from 'expo-file-system';
import { parseHTML } from 'linkedom';

const COVERS_DIR = new Directory(Paths.document, 'covers');

const LAZY_ATTRS = ['data-src', 'data-lazy-src', 'data-original', 'data-lazy', 'data-url', 'data-delayed-url'];

function pickImageUrl(img: Element): string | null {
  const src = img.getAttribute('src');
  if (src && /^https?:\/\//i.test(src)) return src;
  if (src && src.startsWith('//')) return `https:${src}`;
  for (const attr of LAZY_ATTRS) {
    const v = img.getAttribute(attr);
    if (v && /^https?:\/\//i.test(v)) return v;
    if (v && v.startsWith('//')) return `https:${v}`;
  }
  return null;
}

/**
 * Downloads every remote <img> in the article body to local files and rewrites
 * the HTML so it renders fully offline. Failed images are left untouched.
 * Returns the rewritten HTML and how many images were saved.
 */
export async function downloadArticleImages(
  articleId: string,
  contentHtml: string | null,
): Promise<{ html: string; count: number }> {
  if (!contentHtml) return { html: contentHtml ?? '', count: 0 };

  const { document } = parseHTML(`<!DOCTYPE html><html><body>${contentHtml}</body></html>`);
  const imgs = Array.from(document.querySelectorAll('img')) as unknown as Element[];
  if (imgs.length === 0) return { html: contentHtml, count: 0 };

  const parent = new Directory(Paths.document, 'article_images');
  if (!parent.exists) parent.create();
  const dir = new Directory(parent, articleId);
  if (!dir.exists) dir.create();

  let count = 0;
  for (let i = 0; i < imgs.length; i++) {
    const img = imgs[i];
    const url = pickImageUrl(img);
    if (!url) continue;
    try {
      const ext = getExtension(url).replace('.', '') || 'jpg';
      const dest = new File(dir, `img_${i}.${ext}`);
      if (dest.exists) dest.delete();
      const downloaded = await File.downloadFileAsync(url, dest);
      img.setAttribute('src', downloaded.uri);
      img.setAttribute('loading', 'eager');
      for (const attr of LAZY_ATTRS) img.removeAttribute(attr);
      img.removeAttribute('srcset');
      count += 1;
    } catch {
      // leave this image pointing at its remote URL
    }
  }

  return { html: document.body.innerHTML, count };
}

/** Removes the locally-cached body images of an article (does not touch the cover). */
export async function deleteArticleImages(articleId: string): Promise<void> {
  try {
    const dir = new Directory(new Directory(Paths.document, 'article_images'), articleId);
    if (dir.exists) dir.delete();
  } catch {
    // silently ignore
  }
}

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
