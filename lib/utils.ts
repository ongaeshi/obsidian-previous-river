
/**
 * Extracts the inner link text from an Obsidian-style link string such as "[[note]]" or "[[note|alias]]".
 * Removes the surrounding [[...]] brackets if present and returns only the inner content.
 *
 * @param raw - The original link string, possibly enclosed in [[...]].
 * @returns The inner link text (e.g., "note" or "note|alias").
 */
export function extractLinkText(raw: string): string {
  const trimmed = raw.trim();
  const match = trimmed.match(/^\[\[(.+?)\]\]$/);
  return match ? match[1] : trimmed;
}

