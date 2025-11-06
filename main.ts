import { Plugin, TFile, Notice, parseLinktext } from "obsidian";
import { NextNoteSuggestModal } from "./lib/NextNoteSuggestModal";
import { extractLinkText } from "./lib/utils";
import { getActiveFile, getPreviousLinkText } from "./lib/obsidian";

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
  }

  async goToPreviousNote() {
    const file = getActiveFile(this.app);
    if (!file) {
      return;
    }

    let previousLinkText = getPreviousLinkText(this.app, file);
    if (!previousLinkText) {
      return;
    }
  
    const target = this.app.metadataCache.getFirstLinkpathDest(
      previousLinkText, file.path
      );
  
    if (!target) {
      new Notice(`ノート「${previousLinkText}」が見つかりません`);
      return;
    }
  
    await this.app.workspace.getLeaf().openFile(target);
  }

  async goToNextNote() {
    const file = getActiveFile(this.app);
    if (!file) {
      return;
    }
  
    const currentPath = file.path;
    const backlinks = this.app.metadataCache.resolvedLinks;
    const nextNotes: TFile[] = [];
  
    for (const [sourcePath, targets] of Object.entries(backlinks)) {
      // この source が現在のノートにリンクしているか
      if (!targets[currentPath]) continue;
  
      const targetFile = this.app.vault.getAbstractFileByPath(sourcePath);
      if (!(targetFile instanceof TFile)) continue;

      let previousLinkText = getPreviousLinkText(this.app, targetFile);
      if (!previousLinkText) {
        continue;
      }
  
      // previous が現在のノートを指している場合のみ追加
      if (previousLinkText === file.basename || previousLinkText === currentPath) {
        nextNotes.push(targetFile);
      }
    }
  
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
}
