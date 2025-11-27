import { Plugin, TFile } from "obsidian";
import { NextNoteSuggestModal } from "./lib/NextNoteSuggestModal";
import { getActiveFile, getPreviousNote, getNextNotes } from "./lib/obsidian";

export default class PreviousRiverPlugin extends Plugin {
  translations: Record<string, string> = {};

  async onload() {
    await this.loadTranslations();

    this.addCommand({
      id: "go-to-previous-note",
      name: this.t("CMD_GO_TO_PREVIOUS_NOTE"),
      callback: () => this.goToPreviousNote(),
    });

    this.addCommand({
      id: "go-to-next-note",
      name: this.t("CMD_GO_TO_NEXT_NOTE"),
      callback: () => this.goToNextNote(),
    });

    this.addCommand({
      id: "go-to-first-note",
      name: this.t("CMD_GO_TO_FIRST_NOTE"),
      callback: () => this.goToFirstNote(),
    });

    this.addCommand({
      id: "go-to-last-note",
      name: this.t("CMD_GO_TO_LAST_NOTE"),
      callback: () => this.goToLastNote(),
    });
  }

  /**
   * Load translation data for the current locale.
   */
  async loadTranslations() {
    const locale = this.app.locale || "en";

    // Obsidian injects translation objects into the plugin instance
    // @ts-ignore
    const injected = (this as any).translations;

    if (injected && injected[locale]) {
      this.translations = injected[locale];
    } else if (injected && injected["en"]) {
      this.translations = injected["en"];
    } else {
      this.translations = {};
    }
  }

  /**
   * Translation helper
   */
  t(key: string): string {
    if (this.translations[key]) {
      return this.translations[key];
    } else {
      return key;
    }
  }

  /**
   * Move to previous note.
   */
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

  /**
   * Move to next note.
   * Show suggestion modal if multiple candidates exist.
   */
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
      await this.app.workspace.getLeaf().openFile(nextNotes[0]);
    } else {
      new NextNoteSuggestModal(
        this.app,
        nextNotes,
        async (selectedFile) => {
          if (selectedFile) {
            await this.app.workspace.getLeaf().openFile(selectedFile);
          }
        }
      ).open();
    }
  }

  /**
   * Move to the first note in the chain.
   */
  async goToFirstNote() {
    const file = getActiveFile(this.app);
    if (!file) {
      return;
    }

    const startNote = file;
    let firstNote = file;

    while (true) {
      const previousNote = getPreviousNote(this.app, firstNote);

      if (!previousNote) {
        break;
      }

      if (previousNote === startNote) {
        break;
      }

      firstNote = previousNote;
    }

    if (firstNote !== file) {
      await this.app.workspace.getLeaf().openFile(firstNote);
    }
  }

  /**
   * Move to the last note in the chain.
   * If branching occurs, show suggestion modal.
   */
  async goToLastNote() {
    const file = getActiveFile(this.app);
    if (!file) {
      return;
    }

    const startNote = file;
    let lastNote = file;

    while (true) {
      const nextNotes = getNextNotes(this.app, lastNote);

      if (nextNotes.length === 0) {
        break;
      }

      if (nextNotes.includes(startNote)) {
        break;
      }

      if (nextNotes.length === 1) {
        lastNote = nextNotes[0];
      } else {
        const selectedNote = await new Promise<TFile | null>((resolve) => {
          new NextNoteSuggestModal(this.app, nextNotes, resolve).open();
        });

        if (!selectedNote) {
          return;
        }

        lastNote = selectedNote;
      }
    }

    if (lastNote !== file) {
      await this.app.workspace.getLeaf().openFile(lastNote);
    }
  }
}
