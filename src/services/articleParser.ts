import { Readability } from '@mozilla/readability';
import { parseHTML } from 'linkedom';

export interface ParsedArticle {
  title: string;
  author: string | null;
  content_html: string;
  content_text: string;
  reading_time_min: number;
  excerpt: string | null;
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
  };
}
