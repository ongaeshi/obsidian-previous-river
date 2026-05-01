# Previous River の大量にリンクされたノートの探索の最適化

## 1. 背景と目的 (Background)

深いリンク階層（例：深さ10,000）を持つノート群に対して `findLastNote()` を実行すると、アプリケーションが長時間ブロックされる問題が存在した。計算量 $O(V \times D)$ を $O(E + D)$ に削減し、探索処理を最適化する。（$V$: 総ノート数、$E$: 総エッジ数、$D$: 探索深度）

## 2. 概念定義 (Definitions)

- **順引きキャッシュ**: ノート自身のプロパティを読む通常のアクセス方法。
- **逆引きキャッシュ (Reverse Cache)**: リンク先（親）からリンク元（子）への参照を事前に構築したマップ。

## 3. 設計意図/ADR (Design Decisions)

探索処理のボトルネックを解消するため、以下の手法を検証し、最終的なアーキテクチャを決定した。

| 検討項目 | 採用案 | 却下案 | 理由 |
|---|---|---|---|
| 次のノートの取得 | キャッシュの事前一括構築 (`buildReverseCache`) | 毎ループでの全ファイルスキャン (`Object.entries`) | `Object.entries` による全ファイルスキャンは配列生成によるGC負荷と $O(V \times D)$ の計算量が発生するため。 |
| バックリンクの取得 | `app.metadataCache.resolvedLinks` を `for...in` で走査 | `app.metadataCache.getBacklinksForFile()` の利用 | 非公式APIである `getBacklinksForFile()` は内部で `ReferenceCache` オブジェクトを動的生成するため、著しいメモリアロケーション負荷が発生したため。 |
| キャッシュのライフサイクル | コマンド実行時にその都度構築して破棄 | 常駐キャッシュ（イベントリスナーによる常時同期） | 常時同期は実装が複雑化し「キャッシュの腐敗」の温床となる。また、モバイル環境においては常駐処理によるバッテリー消費が懸念されたため。 |
| フェイルセーフ | 実装しない（計算量の削減により不要化） | 一定時間（5〜10秒）経過後のタイムアウト処理 | $O(1)$ のルックアップにより探索処理がミリ秒単位で完了するようになったため、タイムアウト処理は不要となった。 |

## 4. 実装 (Implementation)

コマンド実行の起点である `findLastNote()` の先頭で一度だけ `buildReverseCache()` を実行する。これにより、全リンク情報（$E$）から完全な逆引きマップを $O(E)$ で構築する。

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

## 5. ユースケース (Usage)

数万件規模のノートを含むVaultにおいて、深いリンク階層の末尾を特定する処理に適用する。
実行時に約10〜50ミリ秒のキャッシュ構築時間が発生するが、その後のノード探索は完全な $O(1)$ で処理される。不要なオブジェクトは処理完了後に即座にGC（ガベージコレクション）に回収されるため、モバイル環境でもリソースを圧迫しない。

## 6. コミットログ

関連する主要なコミット履歴を提示する。

- [`83d28c8`](https://github.com/ongaeshi/previous-river/commit/83d28c8) feat: Remove timeout
- [`6cee7ba`](https://github.com/ongaeshi/previous-river/commit/6cee7ba) perf: Build O(1) reverse cache in findLastNote to eliminate O(V*D) overhead
- [`02999b5`](https://github.com/ongaeshi/previous-river/commit/02999b5) perf: getNextNotes via detailed backlink properties
- [`c68596d`](https://github.com/ongaeshi/previous-river/commit/c68596d) perf: Optimize backlink iteration in getNextNotes
- [`21adb7d`](https://github.com/ongaeshi/previous-river/commit/21adb7d) feat: Add timeout to findLastNote search
- [`6e8e72b`](https://github.com/ongaeshi/previous-river/commit/6e8e72b) refactor: findLastNote utility function into a `lib/obsidian.ts` module.
- [`c6dd657`](https://github.com/ongaeshi/previous-river/commit/c6dd657) refactor: Extranct getNextNotes() function

---
[⬅️ (previous) 001_chain_algorithm](001_chain_algorithm.md) | [003_canvas_export  (next) ➡️](003_canvas_export.md)
