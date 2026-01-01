import { Notice, Plugin, TFile } from "obsidian";
import { NextNoteSuggestModal } from "./lib/NextNoteSuggestModal";
import { getActiveFile, getPreviousNote, getNextNotes, detachNote, setPreviousProperty, findLastNote } from "./lib/obsidian";

export default class PreviousRiverPlugin extends Plugin {
  onload() {
    this.addCommand({
      id: "go-to-previous-note",
      name: "Go to previous note",
      callback: () => this.goToPreviousNoteCommand(),
    });

    this.addCommand({
      id: "go-to-next-note",
      name: "Go to next note",
      callback: () => this.goToNextNoteCommand(),
    });

    this.addCommand({
      id: "go-to-first-note",
      name: "Go to first note",
      callback: () => this.goToFirstNoteCommand(),
    });

    this.addCommand({
      id: "go-to-last-note",
      name: "Go to last note",
      callback: () => this.goToLastNoteCommand(),
    });

    this.addCommand({
      id: "detach-note",
      name: "Detach note",
      callback: () => this.detachNoteCommand(),
    });

    this.addCommand({
      id: "insert-note-to-last",
      name: "Insert note to last",
      callback: () => this.insertNoteToLastCommand(),
    });
  }

  async goToPreviousNoteCommand() {
    const file = getActiveFile(this.app);
    if (!file) {
      return;
    }

    const target = getPreviousNote(this.app, file);
    if (!target) {
      return;
    }

    await this.app.workspace.getLeaf().openFile(target);
  }

  async goToNextNoteCommand() {
    const file = getActiveFile(this.app);
    if (!file) {
      return;
    }

    const nextNotes = getNextNotes(this.app, file);

    if (nextNotes.length === 0) {
      return;
    }

    if (nextNotes.length === 1) {
      // If only one candidate exists, open it directly.
      await this.app.workspace.getLeaf().openFile(nextNotes[0]);
    } else {
      // If multiple candidates exist, open a suggestion modal.
      new NextNoteSuggestModal(this.app, nextNotes, (selectedFile) => {
        void this.app.workspace.getLeaf().openFile(selectedFile);
      }).open();
    }
  }

  async goToFirstNoteCommand() {
    const file = getActiveFile(this.app);
    if (!file) {
      return;
    }

    const startNote = file;
    let firstNote = file;
    while (true) {
      const previousNote = getPreviousNote(this.app, firstNote);
      if (!previousNote || previousNote === startNote) {
        break;
      }
      firstNote = previousNote;
    }

    if (firstNote !== file) {
      await this.app.workspace.getLeaf().openFile(firstNote);
    }
  }

  async goToLastNoteCommand() {
    const file = getActiveFile(this.app);
    if (!file) {
      return;
    }

    const lastNote = await findLastNote(this.app, file);
    if (lastNote && lastNote !== file) {
      await this.app.workspace.getLeaf().openFile(lastNote);
    }
  }

  async detachNoteCommand() {
    const file = getActiveFile(this.app);
    if (!file) {
      return;
    }

    // TODO: Add confirm dialog
    await detachNote(this.app, file);
  }

  async insertNoteToLastCommand() {
    const file = getActiveFile(this.app);
    if (!file) {
      return;
    }

    // detach note
    await detachNote(this.app, file);

    const selectedNote = await new Promise<TFile | null>((resolve) => {
      new NextNoteSuggestModal(this.app, this.app.vault.getMarkdownFiles(), resolve).open();
    });

    if (!selectedNote) {
      return;
    }

    const lastNote = await findLastNote(this.app, selectedNote);
    if (!lastNote) {
      return;
    }

    await setPreviousProperty(this.app, file, lastNote.basename);
  }
}
