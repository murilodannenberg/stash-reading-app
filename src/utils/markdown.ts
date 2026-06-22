import { HighlightWithArticle } from '../database/repositories/highlights';

/** Builds a Markdown document from highlights, grouped by article. */
export function highlightsToMarkdown(highlights: HighlightWithArticle[]): string {
  if (highlights.length === 0) return '# Destaques\n\n_Nenhum destaque._\n';

  const byArticle = new Map<string, HighlightWithArticle[]>();
  for (const h of highlights) {
    const arr = byArticle.get(h.article_id);
    if (arr) arr.push(h);
    else byArticle.set(h.article_id, [h]);
  }

  let md = '# Destaques\n\n';
  for (const arr of byArticle.values()) {
    md += `## ${arr[0].article_title}\n\n`;
    for (const h of arr) {
      md += `> ${h.selected_text.trim().replace(/\s*\n\s*/g, ' ')}\n\n`;
      if (h.note && h.note.trim()) md += `${h.note.trim()}\n\n`;
    }
  }
  return md;
}
