import { Plugin, TFile, Notice, parseLinktext } from "obsidian";

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

  /**
   * Extracts the inner link text from an Obsidian-style link string such as "[[note]]" or "[[note|alias]]".
   * Removes the surrounding [[...]] brackets if present and returns only the inner content.
   *
   * @param raw - The original link string, possibly enclosed in [[...]].
   * @returns The inner link text (e.g., "note" or "note|alias").
   */
  extractLinkTarget(raw: string): string {
    const trimmed = raw.trim();
    const match = trimmed.match(/^\[\[(.+?)\]\]$/);
    return match ? match[1] : trimmed;
  }

  async goToPreviousNote() {
    const file = this.getActiveFile();
    if (!file) {
      new Notice("アクティブなノートがありません");
      return;
    }
  
    // YAML frontmatter を優先的にチェック
    const cache = this.app.metadataCache.getFileCache(file);
    let previousNoteName: string | null = null;
  
    if (cache?.frontmatter?.previous) {
      previousNoteName = cache.frontmatter.previous;
    } else {
      // 本文から探す
      const content = await this.app.vault.read(file);
      const match = content.match(/^previous:\s*\[\[(.+?)\]\]/m);
      if (match) {
        previousNoteName = match[1];
      }
    }
  
    if (!previousNoteName) {
      new Notice("previous プロパティが見つかりません");
      return;
    }
  
    // [[note|alias]] のような場合をパース
    const linkText = this.extractLinkTarget(previousNoteName);
    const { path: linkpath } = parseLinktext(linkText);
    const target = this.app.metadataCache.getFirstLinkpathDest(linkpath, file.path);
  
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
