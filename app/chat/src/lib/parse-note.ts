/**
 * Parse pasted text into note fields.
 *
 * Supports two formats:
 *
 * 1. Claude iOS app output:
 *    Title: ...
 *    Area: ...
 *    Tags: ...
 *    Content:
 *    ...
 *
 * 2. YAML frontmatter:
 *    ---
 *    area: ...
 *    tags: [...]
 *    ---
 *    # Title
 *    ...
 */

interface ParsedNote {
  title: string;
  area: string;
  tags: string[];
  content: string;
}

type ParseResult =
  | { ok: true; data: ParsedNote }
  | { ok: false; reason: string };

// ---------------------------------------------------------------------------
// Format 1 — Claude iOS "Title: / Area: / Tags: / Content:" blocks
// ---------------------------------------------------------------------------

function parseClaude(text: string): ParseResult | null {
  const titleMatch = text.match(/^Title:\s*(.+)/im);
  const contentMatch = text.match(/^Content:\s*\n([\s\S]+)/im);

  if (!titleMatch || !contentMatch) return null;

  const title = titleMatch[1].trim();
  const content = contentMatch[1].trim();

  const areaMatch = text.match(/^Area:\s*(.+)/im);
  const area = areaMatch ? areaMatch[1].trim().toLowerCase() : "";

  const tagsMatch = text.match(/^Tags:\s*(.+)/im);
  const tags = tagsMatch
    ? tagsMatch[1]
        .split(",")
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean)
    : [];

  if (!title) return { ok: false, reason: "Title is empty." };
  if (!content) return { ok: false, reason: "Content is empty." };

  return { ok: true, data: { title, area, tags, content } };
}

// ---------------------------------------------------------------------------
// Format 2 — YAML frontmatter + # Title
// ---------------------------------------------------------------------------

function parseFrontmatter(text: string): ParseResult | null {
  const fmMatch = text.match(/^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/);
  if (!fmMatch) return null;

  const yaml = fmMatch[1];
  const body = fmMatch[2].trim();

  const areaMatch = yaml.match(/^area:\s*(.+)/m);
  const area = areaMatch ? areaMatch[1].trim() : "";

  const tagsMatch = yaml.match(/^tags:\s*\[([^\]]*)\]/m);
  const tags = tagsMatch
    ? tagsMatch[1]
        .split(",")
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean)
    : [];

  const titleMatch = body.match(/^#\s+(.+)/m);
  const title = titleMatch ? titleMatch[1].trim() : "";
  const content = titleMatch
    ? body.slice(body.indexOf("\n", body.indexOf(titleMatch[0])) + 1).trim()
    : body;

  if (!title) return { ok: false, reason: "Could not find a # Title heading in the pasted text." };
  if (!content) return { ok: false, reason: "Content after the title is empty." };

  return { ok: true, data: { title, area, tags, content } };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function parseNoteMarkdown(text: string): ParseResult {
  const trimmed = text.trim();
  if (!trimmed) {
    return { ok: false, reason: "Clipboard is empty." };
  }

  // Try Claude format first (more specific), then frontmatter
  const claude = parseClaude(trimmed);
  if (claude) return claude;

  const fm = parseFrontmatter(trimmed);
  if (fm) return fm;

  return {
    ok: false,
    reason:
      'Could not recognize the note format. Expected either "Title: / Area: / Tags: / Content:" blocks (from Claude) or YAML frontmatter with a # heading.',
  };
}
