import { Plugin, TFile, Notice, parseLinktext } from "obsidian";
import { NextNoteSuggestModal } from "./lib/NextNoteSuggestModal";
import { getActiveFile, getPreviousNote, getNextNotes } from "./lib/obsidian";

export default class PreviousRiverPlugin extends Plugin {
  async onload() {
    this.addCommand({
      id: "go-to-previous-note",
      name: "前のノートに移動",
      callback: () => this.goToPreviousNote(),
    });

    this.addCommand({
      id: "go-to-next-note",
      name: "次のノートに移動",
      callback: () => this.goToNextNote(),
    });

    this.addCommand({
      id: "go-to-first-note",
      name: "先頭のノートに移動",
      callback: () => this.goToFirstNote(),
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
      // 1件なら移動
      await this.app.workspace.getLeaf().openFile(nextNotes[0]);
    } else {
      // 複数候補の場合はサジェストで選択
      new NextNoteSuggestModal(this.app, nextNotes, async (selectedFile) => {
        await this.app.workspace.getLeaf().openFile(selectedFile);
      }).open();
    }
  }

  async goToFirstNote() {
    const file = getActiveFile(this.app);
    if (!file) {
      return;
    }

    let firstNote = file;
    while (true) {
      const previousNote = getPreviousNote(this.app, firstNote);
      if (!previousNote) {
        break;
      }
      firstNote = previousNote;
    }

    if (firstNote !== file) {
      await this.app.workspace.getLeaf().openFile(firstNote);
    }
  }
}
