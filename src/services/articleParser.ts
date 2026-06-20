import { Readability } from '@mozilla/readability';
import { parseHTML } from 'linkedom';

export interface ParsedArticle {
  title: string;
  author: string | null;
  content_html: string;
  content_text: string;
  reading_time_min: number;
  excerpt: string | null;
  cover_image_url: string | null;
}

function estimateReadingTime(text: string): number {
  const words = text.trim().split(/\s+/).length;
  return Math.max(1, Math.round(words / 230));
}

export async function fetchAndParse(url: string): Promise<ParsedArticle> {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    },
  });

  if (!response.ok) {
    throw new Error(`Falha ao baixar a página (HTTP ${response.status})`);
  }

  const contentType = response.headers.get('content-type') ?? '';
  if (!contentType.includes('text/html') && !contentType.includes('application/xhtml')) {
    throw new Error('A URL não aponta para uma página HTML.');
  }

  const html = await response.text();

  const { document } = parseHTML(html);

  // Set the URL so Readability can resolve relative links
  if (document.baseURI !== url) {
    const base = document.createElement('base');
    base.setAttribute('href', url);
    document.head.appendChild(base);
  }

  // Extract cover image before Readability mutates the DOM
  const coverImageUrl = extractCoverImage(document, url);

  const reader = new Readability(document as unknown as Document);
  const article = reader.parse();

  if (!article || !article.content) {
    throw new Error(
      'Não foi possível extrair o conteúdo do artigo. A página pode estar protegida ou não conter um artigo legível.'
    );
  }

  const textContent = article.textContent ?? '';

  return {
    title: article.title || 'Sem título',
    author: article.byline || null,
    content_html: article.content,
    content_text: textContent,
    reading_time_min: estimateReadingTime(textContent),
    excerpt: article.excerpt || null,
    cover_image_url: coverImageUrl,
  };
}

function extractCoverImage(document: ReturnType<typeof parseHTML>['document'], baseUrl: string): string | null {
  // 1. og:image (most reliable)
  const ogImage = document.querySelector('meta[property="og:image"]')?.getAttribute('content');
  if (ogImage) return resolveUrl(ogImage, baseUrl);

  // 2. twitter:image
  const twitterImage = document.querySelector('meta[name="twitter:image"]')?.getAttribute('content');
  if (twitterImage) return resolveUrl(twitterImage, baseUrl);

  // 3. First large image in the article body
  const imgs = document.querySelectorAll('article img, .post img, .entry-content img, main img');
  for (let i = 0; i < imgs.length; i++) {
    const img = imgs[i];
    const src = img.getAttribute('src');
    if (!src) continue;
    // Skip tiny icons, tracking pixels, SVGs
    const width = parseInt(img.getAttribute('width') ?? '0', 10);
    const height = parseInt(img.getAttribute('height') ?? '0', 10);
    if ((width > 0 && width < 100) || (height > 0 && height < 100)) continue;
    if (src.includes('.svg') || src.includes('data:image/svg')) continue;
    return resolveUrl(src, baseUrl);
  }

  return null;
}

function resolveUrl(src: string, baseUrl: string): string {
  if (src.startsWith('http://') || src.startsWith('https://')) return src;
  try {
    return new URL(src, baseUrl).toString();
  } catch {
    return src;
  }
}
