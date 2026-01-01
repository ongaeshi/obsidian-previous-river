import { Notice, Plugin, TFile } from "obsidian";
import { NextNoteSuggestModal } from "./lib/NextNoteSuggestModal";
import { getActiveFile, getPreviousNote, getNextNotes, detachNote, setPreviousProperty } from "./lib/obsidian";

export default class PreviousRiverPlugin extends Plugin {
  onload() {
    this.addCommand({
      id: "go-to-previous-note",
      name: "Go to previous note",
      callback: () => this.goToPreviousNote(),
    });

    this.addCommand({
      id: "go-to-next-note",
      name: "Go to next note",
      callback: () => this.goToNextNote(),
    });

    this.addCommand({
      id: "go-to-first-note",
      name: "Go to first note",
      callback: () => this.goToFirstNote(),
    });

    this.addCommand({
      id: "go-to-last-note",
      name: "Go to last note",
      callback: () => this.goToLastNote(),
    });

    this.addCommand({
      id: "detach-note",
      name: "Detach note",
      callback: () => this.detachNote(),
    });

    this.addCommand({
      id: "insert-note-to-last",
      name: "Insert note to last",
      callback: () => this.insertNoteToLastCommand(),
    });
  }

  async goToPreviousNote() {
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

  async goToNextNote() {
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

  async goToFirstNote() {
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

  async findLastNote(startNote: TFile): Promise<TFile | null> {
    let lastNote = startNote;
    while (true) {
      const nextNotes = getNextNotes(this.app, lastNote);
      if (nextNotes.length === 0 || nextNotes.includes(startNote)) {
        break;
      }

      if (nextNotes.length === 1) {
        // If only one next note exists, follow it.
        lastNote = nextNotes[0];
      } else {
        // If multiple candidates exist, open a suggestion modal.
        const selectedNote = await new Promise<TFile | null>((resolve) => {
          new NextNoteSuggestModal(this.app, nextNotes, resolve).open();
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

  async goToLastNote() {
    const file = getActiveFile(this.app);
    if (!file) {
      return;
    }

    const lastNote = await this.findLastNote(file);
    if (lastNote && lastNote !== file) {
      await this.app.workspace.getLeaf().openFile(lastNote);
    }
  }

  async detachNote() {
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

    const lastNote = await this.findLastNote(selectedNote);
    if (!lastNote) {
      return;
    }

    await setPreviousProperty(this.app, file, lastNote.basename);
  }
}
