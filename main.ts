import { Plugin, TFile, Notice } from "obsidian";

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

  getActiveFile(): TFile | null {
    return this.app.workspace.getActiveFile();
  }

  async goToPreviousNote() {
    const file = this.getActiveFile();
    if (!file) {
      new Notice("アクティブなノートがありません");
      return;
    }

    const content = await this.app.vault.read(file);

    // YAML frontmatter または行頭に "previous: [[ノート名]]" がある場合を探す
    const match = content.match(/^previous:\s*\[\[(.+?)\]\]/m);
    if (!match) {
      new Notice("previous プロパティが見つかりません");
      return;
    }

    const previousNoteName = match[1];
    const target = this.app.metadataCache.getFirstLinkpathDest(previousNoteName, file.path);

    if (!target) {
      new Notice(`ノート「${previousNoteName}」が見つかりません`);
      return;
    }

    await this.app.workspace.getLeaf().openFile(target);
  }

  async goToNextNote() {
    const file = this.getActiveFile();
    if (!file) {
      new Notice("アクティブなノートがありません");
      return;
    }

    // 🔍 バックリンク情報を取得
    const backlinks = this.app.metadataCache.resolvedLinks;
    const currentPath = file.path;

    const nextNotes: TFile[] = [];

    // resolvedLinks は { "noteA.md": { "noteB.md": count, ... } } のような構造
    for (const [sourcePath, links] of Object.entries(backlinks)) {
      if (links[currentPath]) {
        const targetFile = this.app.vault.getAbstractFileByPath(sourcePath);
        if (targetFile instanceof TFile) {
          nextNotes.push(targetFile);
        }
      }
    }

    if (nextNotes.length === 0) {
      new Notice("次のノート（バックリンク）が見つかりません");
      return;
    }

    if (nextNotes.length === 1) {
      await this.app.workspace.getLeaf().openFile(nextNotes[0]);
    } else {
      const list = nextNotes.map(f => f.basename).join("\n");
      new Notice(`複数の次ノートがあります:\n${list}`);
    }
  }
}
