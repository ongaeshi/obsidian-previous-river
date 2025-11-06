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
 * Retrieve the `previous` link text from the file's frontmatter.
 * @returns Extracted link text from the `previous` property, or null if not found.
 */
export function getPreviousLinkText(app: App, file: TFile): string | null {
  const cache = app.metadataCache.getFileCache(file);
  const previousName = cache?.frontmatter?.previous;

  if (previousName == null) {
    return null;
  }

  return extractLinkText(previousName);
}
