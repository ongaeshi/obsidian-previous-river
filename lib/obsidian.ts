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

  // TODO: Support parseLinkText
  // const { path: linkPath, path: linkSubPath } = parseLinktext(previousLinkText);
}

/**
 * Retrieve the previous note based on the `previous` property in the frontmatter.
 */
export function getPreviousNote(app: App, file: TFile): TFile | null {
  const previousLinkText = getPreviousLinkText(app, file);
  if (!previousLinkText) {
    return null;
  }

  const target = app.metadataCache.getFirstLinkpathDest(
    previousLinkText,
    file.path
  );

  if (!target) {
    new Notice(`ノート「${previousLinkText}」が見つかりません`); // TODO: i18n
    return null;
  }

  return target;
}