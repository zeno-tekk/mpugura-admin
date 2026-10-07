// Lesson content used to be authored as plain text with **bold**, "- " bullets,
// "1." numbered lists and blank-line paragraphs (see mpugura-web's markdown-text.tsx,
// which still renders that format for any lesson that hasn't been re-saved yet).
// The rich text editor only ever produces HTML, so any such plain text is converted
// to HTML once, the first time it's opened in the editor.

export function looksLikeHtml(value: string): boolean {
  return /<\/?[a-z][\s\S]*>/i.test(value);
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function inlineToHtml(text: string): string {
  return escapeHtml(text).replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
}

type Block = { type: 'p' | 'ul' | 'ol'; lines: string[] };

export function plainTextToHtml(source: string): string {
  const blocks: Block[] = [];

  for (const rawLine of source.split('\n')) {
    const line = rawLine.trim();
    const last = blocks[blocks.length - 1];

    if (!line) {
      blocks.push({ type: 'p', lines: [] });
      continue;
    }

    const bullet = line.match(/^[-*•]\s+(.*)$/);
    const numbered = line.match(/^\d+[.)]\s+(.*)$/);

    if (bullet) {
      if (last?.type === 'ul') last.lines.push(bullet[1]);
      else blocks.push({ type: 'ul', lines: [bullet[1]] });
    } else if (numbered) {
      if (last?.type === 'ol') last.lines.push(numbered[1]);
      else blocks.push({ type: 'ol', lines: [numbered[1]] });
    } else if (last?.type === 'p') {
      last.lines.push(line);
    } else {
      blocks.push({ type: 'p', lines: [line] });
    }
  }

  return blocks
    .filter((block) => block.lines.length > 0)
    .map((block) => {
      if (block.type === 'ul') return `<ul>${block.lines.map((l) => `<li>${inlineToHtml(l)}</li>`).join('')}</ul>`;
      if (block.type === 'ol') return `<ol>${block.lines.map((l) => `<li>${inlineToHtml(l)}</li>`).join('')}</ol>`;
      return `<p>${block.lines.map(inlineToHtml).join('<br>')}</p>`;
    })
    .join('');
}

/** Used when loading saved content into the editor: pass HTML through, convert legacy plain text. */
export function toEditableHtml(value: string): string {
  if (!value.trim()) return '';
  return looksLikeHtml(value) ? value : plainTextToHtml(value);
}
