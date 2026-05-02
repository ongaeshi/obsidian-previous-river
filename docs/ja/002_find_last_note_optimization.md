# Previous River の末端ノート探索の最適化

## 目的

深いリンク階層（例：深さ10,000）を持つノート群に対して `findLastNote()` 等の探索処理を実行すると、アプリケーションが長時間ブロックされる（フリーズする）問題が存在した。本アルゴリズムは、計算量 $O(V \times D)$ を $O(E + D)$ に削減し、探索処理を最適化する（$V$: 総ノート数、$E$: 総エッジ数、$D$: 探索深度）。

## 用語の定義

- **順引きキャッシュ**: ノート自身のプロパティ（フロントマター）を読む、通常のアクセス方法。
- **逆引きキャッシュ**: リンク先（親）からリンク元（子）への参照を事前に一括構築した連想配列（マップ）。

## 設計方針

探索処理のボトルネックを解消するため、以下の手法を検証し、最終的なアーキテクチャを決定した。

| 検討項目 | 採用案 | 却下案 | 理由 |
|---|---|---|---|
| 次のノートの取得 | キャッシュの事前一括構築 (`buildReverseCache`) | 毎ループでの全ファイルスキャン (`Object.entries`) | `Object.entries` による全ファイルスキャンは、配列生成によるGC（ガベージコレクション）負荷と $O(V \times D)$ の計算量が発生するため。 |
| バックリンクの取得 | `app.metadataCache.resolvedLinks` を `for...in` で走査 | `app.metadataCache.getBacklinksForFile()` の利用 | 非公式APIである `getBacklinksForFile()` は、内部で `ReferenceCache` オブジェクトを動的生成するため、著しいメモリアロケーション負荷が発生したため。 |
| キャッシュのライフサイクル | コマンド実行時にその都度構築して破棄 | 常駐キャッシュ（イベントリスナーによる常時同期） | 常駐キャッシュは「キャッシュの腐敗」の温床となる。また、モバイル環境においては常駐処理によるバッテリー消費が懸念されたため。 |
| フェイルセーフ | 実装しない（計算量の削減により不要化） | 一定時間（5〜10秒）経過後のタイムアウト処理 | ルックアップが $O(1)$ となり、探索処理がミリ秒単位で完了するようになったため、タイムアウト処理は不要となった。 |

## 実装

コマンド実行の起点となる `findLastNote()` 等の先頭で一度だけ `buildReverseCache()` を実行する。これにより、全リンク情報（$E$）から完全な逆引きマップを $O(E)$ で構築し、後続の探索処理を最適化する。

### 逆引きキャッシュの構築 (`buildReverseCache`)

`app.metadataCache.resolvedLinks` を `for...in` 構文で高速に走査し、メモリ割り当てを最小限に抑えつつ逆引きマップを作成する。

```typescript
export function buildReverseCache(app: App): Record<string, string[]> {
  const resolvedLinks = app.metadataCache.resolvedLinks;
  const cache: Record<string, string[]> = {};

  for (const sourcePath in resolvedLinks) {
    if (!Object.prototype.hasOwnProperty.call(resolvedLinks, sourcePath)) continue;

    const targets = resolvedLinks[sourcePath];
    for (const targetPath in targets) {
      if (!Object.prototype.hasOwnProperty.call(targets, targetPath)) continue;

      if (!cache[targetPath]) cache[targetPath] = [];
      cache[targetPath].push(sourcePath);
    }
  }
  return cache;
}
```

### 末端ノートの探索 (`findLastNote`)

構築した逆引きマップ（`reverseCache`）を利用して、チェインの末端を高速に探索する。毎回の次ノード検索（`getNextNotesWithCache`）が $O(1)$ で処理されるため、ループ全体でも $O(D)$ の計算量に抑えられる。

```typescript
export async function findLastNote(app: App, startNote: TFile, placeholder: string = "Select the next branch..."): Promise<TFile | null> {
  const reverseCache = buildReverseCache(app);
  let lastNote = startNote;

  while (true) {
    const nextNotes = getNextNotesWithCache(app, lastNote, reverseCache);
    if (nextNotes.length === 0 || nextNotes.includes(startNote)) {
      break;
    }

    if (nextNotes.length === 1) {
      // 候補が1つならそのまま進む
      lastNote = nextNotes[0];
    } else {
      // 分岐がある場合はサジェストUIを表示
      const selectedNote = await new Promise<TFile | null>((resolve) => {
        new NextNoteSuggestModal(app, nextNotes, resolve, placeholder).open();
      });

      if (!selectedNote) return null;
      lastNote = selectedNote;
    }
  }
  return lastNote;
}
```

## ユースケース

数万件規模のノートを含むVaultにおいて、深いリンク階層の末尾を特定する処理に適用する。

### 長大な思考チェインの末端特定

数千から数万件のノートが連なるチェインにおいて、末尾のノートを特定する際のパフォーマンスを改善する。
実行時に約10〜50ミリ秒のキャッシュ構築時間が発生するが、その後のノード探索は完全な $O(1)$ で処理されるため、UIのフリーズ（ブロック）を防ぐことができる。

### モバイル環境でのリソース最適化

モバイル環境（iOS / Android）などのリソースが制限された環境において、メモリ消費を最小限に抑える。
キャッシュ用のオブジェクトはコマンド実行時にのみ構築され、処理完了後に即座にGC（ガベージコレクション）に回収されるため、常駐メモリを圧迫しない。

## コミットログ

関連する主要なコミット履歴を提示する。

- [`83d28c8`](https://github.com/ongaeshi/previous-river/commit/83d28c8) feat: タイムアウト処理を削除
- [`6cee7ba`](https://github.com/ongaeshi/previous-river/commit/6cee7ba) perf: findLastNote内にO(1)の逆引きキャッシュを構築し、O(V*D)のオーバーヘッドを解消
- [`02999b5`](https://github.com/ongaeshi/previous-river/commit/02999b5) perf: 詳細なバックリンクプロパティを利用したgetNextNotesの取得
- [`c68596d`](https://github.com/ongaeshi/previous-river/commit/c68596d) perf: getNextNotesのバックリンクのイテレーションを最適化
- [`21adb7d`](https://github.com/ongaeshi/previous-river/commit/21adb7d) feat: findLastNoteの探索にタイムアウトを追加
- [`6e8e72b`](https://github.com/ongaeshi/previous-river/commit/6e8e72b) refactor: findLastNoteユーティリティ関数を `lib/obsidian.ts` モジュールへ移動
- [`c6dd657`](https://github.com/ongaeshi/previous-river/commit/c6dd657) refactor: getNextNotes() 関数を抽出

---
[⬅️ (previous) 001_chain_algorithm](001_chain_algorithm.md) | [003_canvas_export  (next) ➡️](003_canvas_export.md)
