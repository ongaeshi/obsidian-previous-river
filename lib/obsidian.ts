import { App, TFile } from "obsidian";
import { Notice, getLinkpath } from "obsidian";
import { extractLinktext } from "./utils";

/**
 * Get the currently active file
 */
export function getActiveFile(app: App): TFile | null {
  return app.workspace.getActiveFile();
}

/**
 * Retrieve the `previous` linkpath from the file's frontmatter.
 * @returns Extracted linkpath from the `previous` property, or null if not found.
 */
export function getPreviousLinkpath(app: App, file: TFile): string | null {
  const cache = app.metadataCache.getFileCache(file);
  const previousName = cache?.frontmatter?.previous;

  if (previousName == null) {
    return null;
  }

  return  getLinkpath(extractLinktext(previousName));
}

/**
 * Retrieve the previous note based on the `previous` property in the frontmatter.
 */
export function getPreviousNote(app: App, file: TFile): TFile | null {
  const previousLinkpath = getPreviousLinkpath(app, file);
  if (!previousLinkpath) {
    return null;
  }

  const target = app.metadataCache.getFirstLinkpathDest(
    previousLinkpath,
    file.path
  );

  if (!target) {
    new Notice(`ノート「${previousLinkpath}」が見つかりません`); // TODO: i18n
    return null;
  }

  return target;
}

export function getNextNotes(app: App, file: TFile): TFile[] {
  const currentPath = file.path;
  const backlinks = app.metadataCache.resolvedLinks;
  const nextNotes: TFile[] = [];

  for (const [sourcePath, targets] of Object.entries(backlinks)) {
    // この source が現在のノートにリンクしているか
    if (!targets[currentPath]) {
      continue;
    }

    const targetFile = this.app.vault.getAbstractFileByPath(sourcePath);
    if (!(targetFile instanceof TFile)) { 
      continue;
    }

    let previousLinkText = getPreviousLinkpath(this.app, targetFile);
    if (!previousLinkText) {
      continue;
    }

    // previous が現在のノートを指している場合のみ追加
    if (previousLinkText === file.basename || previousLinkText === currentPath) {
      nextNotes.push(targetFile);
    }
  }

  return nextNotes;
}