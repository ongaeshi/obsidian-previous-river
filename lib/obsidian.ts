import type { App, TFile } from "obsidian";
import { Notice, parseLinktext } from "obsidian";
import { extractLinkTarget } from "./utils";

/**
 * Get the currently active file
 */
export function getActiveFile(app: App): TFile | null {
  return app.workspace.getActiveFile();
}

/**
 * Retrieve the `previous` note name from the file's frontmatter or body.
 * Frontmatter takes precedence.
 */
export async function getPreviousNoteName(app: App, file: TFile): Promise<string | null> {
  const cache = app.metadataCache.getFileCache(file);

  if (cache?.frontmatter?.previous) {
    return cache.frontmatter.previous;
  }

  // If not in frontmatter, search the body
  const content = await app.vault.read(file);
  const match = content.match(/^previous:\s*\[\[(.+?)\]\]/m);
  return match ? match[1] : null;
}
