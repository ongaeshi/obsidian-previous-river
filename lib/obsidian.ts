import { App, TFile } from "obsidian";
import { Notice, getLinkpath } from "obsidian";
import { extractLinktext } from "./utils";
import { NextNoteSuggestModal } from "./NextNoteSuggestModal";

/**
 * Get the currently active file.
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

  if (!previousName?.includes("[[")) {
    return null;
  }

  return getLinkpath(extractLinktext(previousName));
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
    new Notice(`Note "${previousLinkpath}" was not found.`);
    return null;
  }

  return target;
}

/**
 * Retrieve notes that list the current file as their `previous` note.
 */
export function getNextNotes(app: App, file: TFile): TFile[] {
  const currentPath = file.path;
  const backlinks = app.metadataCache.resolvedLinks;
  const nextNotes: TFile[] = [];

  for (const [sourcePath, targets] of Object.entries(backlinks)) {
    // Check if the source note links to the current note.
    if (!targets[currentPath]) {
      continue;
    }

    const targetFile = app.vault.getAbstractFileByPath(sourcePath);
    if (!(targetFile instanceof TFile)) {
      continue;
    }

    const previousLinkText = getPreviousLinkpath(app, targetFile);
    if (!previousLinkText) {
      continue;
    }

    // Add only if the `previous` field points to the current note.
    if (previousLinkText === file.basename || previousLinkText === currentPath) {
      nextNotes.push(targetFile);
    }
  }

  return nextNotes;
}

export async function detachNote(app: App, file: TFile): Promise<void> {
  try {
    await app.fileManager.processFrontMatter(file, (fm) => {
      fm.previous = "ROOT";
    });

    new Notice(`Detached: previous → ROOT`);
  } catch (err) {
    console.error(err);
    new Notice(`Failed to detach note`);
  }

  // TODO:
  // 1. If nextNotes() is not open, open it first.
  // 2. Set previousNote() to next notes previous properties.
}

/**
 * Sets the `previous` property in the file's frontmatter to the specified link.
 *
 * @param app - The Obsidian App instance.
 * @param file - The file to modify.
 * @param previousLink - The link path or name to set as the previous note.
 */
export async function setPreviousProperty(app: App, file: TFile, previousLink: string): Promise<void> {
  await app.fileManager.processFrontMatter(file, (fm) => {
    fm.previous = `[[${previousLink}]]`;
  });
}

export async function findLastNote(app: App, startNote: TFile): Promise<TFile | null> {
  let lastNote = startNote;
  while (true) {
    const nextNotes = getNextNotes(app, lastNote);
    if (nextNotes.length === 0 || nextNotes.includes(startNote)) {
      break;
    }

    if (nextNotes.length === 1) {
      // If only one next note exists, follow it.
      lastNote = nextNotes[0];
    } else {
      // If multiple candidates exist, open a suggestion modal.
      const selectedNote = await new Promise<TFile | null>((resolve) => {
        new NextNoteSuggestModal(app, nextNotes, resolve).open();
      });

      if (!selectedNote) {
        // If the user cancels selection, stop.
        return null;
      }

      lastNote = selectedNote;
    }
  }
  return lastNote;
}
