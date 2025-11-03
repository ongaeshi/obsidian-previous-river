import { Plugin, TFile, Notice, parseLinktext } from "obsidian";
import { NextNoteSuggestModal } from "./NextNoteSuggestModal";

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
  
      // そのファイルの previous プロパティを取得
      const cache = this.app.metadataCache.getFileCache(targetFile);
      let previousRaw: string | null = null;
  
      if (cache?.frontmatter?.previous) {
        previousRaw = cache.frontmatter.previous;
      } else {
        const content = await this.app.vault.read(targetFile);
        const match = content.match(/^previous:\s*(.+)$/m);
        if (match) previousRaw = match[1];
      }
  
      if (!previousRaw) continue;
  
      // [[...]] があれば外す
      const previousLink = this.extractLinkTarget(previousRaw);
  
      // previous が現在のノートを指している場合のみ追加
      if (previousLink === file.basename || previousLink === currentPath) {
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
