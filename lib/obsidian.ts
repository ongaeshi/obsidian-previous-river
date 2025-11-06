import type { App, TFile } from "obsidian";
import { Notice, parseLinktext } from "obsidian";
import { extractLinkText } from "./utils";

/**
 * Get the currently active file
 */
export function getActiveFile(app: App): TFile | null {
  return app.workspace.getActiveFile();
}

/**
 * Retrieve the `previous` note name from the file's frontmatter.
 */
export async function getPreviousNoteName(app: App, file: TFile): Promise<string | null> {
  const cache = app.metadataCache.getFileCache(file);
  return cache?.frontmatter?.previous;
}
