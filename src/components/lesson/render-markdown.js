import MarkdownIt from 'markdown-it';

// Raw HTML is disabled: lesson content is Markdown only, which keeps the rendered output safe.
const markdown = new MarkdownIt({ html: false, linkify: true, typographer: true });

/**
 * @param {string} source Lesson Markdown.
 * @returns {string} HTML.
 */
export function renderMarkdown(source) {
  return markdown.render(source);
}
