# Previous River の同一チェイン判定アルゴリズム

## 目的

「ノードAとノードBが同一の経路（チェイン）上に存在するか」を判定するアルゴリズムを提供する。これにより、ノート挿入時のリンクの無限ループや、構造的な矛盾の発生を未然に防ぐ。

## 用語の定義

- **同一経路 (Same Path)**: `previous` プロパティの単方向リストにおいて、一方が他方の祖先（または子孫）である状態。
- **兄弟関係 (Siblings)**: 共通の祖先を持つが、互いに直接の親子関係がない状態。本判定アルゴリズムでは同一経路とみなさない（`false` を返す）。

## 設計方針

ノード間の関係性を正しく判定するための仕様と、循環参照を防ぐ安全な探索方式について定義した。

| 検討項目 | 採用案 | 却下案 | 理由 |
|---|---|---|---|
| 基本機能 | `isAncestor` による一方向の再帰的探索 | `previous` プロパティの単純比較 | 階層が深い場合でも正確に祖先を特定するため。 |
| 双方向判定の関数名 | `isOnSamePath` | `isConnected` | `isConnected` では兄弟関係も「繋がっている」と誤認されるリスクがあるため。 |
| 双方向判定の関数名 | - | `areOnSameChain` | 「チェイン」という用語がデータ構造の文脈において曖昧さを残すため。 |
| 無限ループ対策 | `visited` (Set) による訪問履歴の記録 | - | ユーザー操作等によって意図せず発生した循環参照（サイクル）によるクラッシュを防ぐため。 |

## 実装

### 祖先判定 (`isAncestor`)

`target` が `note` の祖先であるかを判定する。ノードの `previous` プロパティを順にたどり、循環参照を検出するために `visited` セットを使用する。

```typescript
export function isAncestor(app: App, note: TFile, target: TFile): boolean {
  let current = note;
  const visited = new Set<string>();
  visited.add(current.path);

  let depth = 0;
  const maxDepth = 100000;

  while (depth < maxDepth) {
    const prev = getPreviousNote(app, current);
    if (!prev) {
      return false;
    }

    if (prev.path === target.path) {
      return true;
    }

    if (visited.has(prev.path)) {
      return false; // 循環参照の検出
    }

    visited.add(prev.path);
    current = prev;
    depth++;
  }

  return false;
}
```

### 同一経路判定 (`isOnSamePath`)

2つのノートが同一経路上にあるかを判定する。AからB、またはBからAへの祖先関係を検証する。

```typescript
export function isOnSamePath(app: App, note1: TFile, note2: TFile): boolean {
  if (note1.path === note2.path) {
    return true;
  }
  return isAncestor(app, note1, note2) || isAncestor(app, note2, note1);
}
```

## ユースケース

Previous River の各種コマンドにおいて、不正な操作を防ぐためのバリデーション（安全装置）として利用する。

### 循環参照の防止

ノードの挿入操作（`Insert note`、`Insert note to first`、`Insert note to last`）において、対象ノードが既に同一経路上に存在する場合、操作をブロックする。これにより、ノートのリンク構造が無限ループに陥ることを防ぐ。

```typescript
if (isOnSamePath(app, file, selectedNote)) {
    new Notice(`Cannot insert: "${file.basename}" and "${selectedNote.basename}" are on the same path.`);
    return;
}
```

## コミットログ

関連する主要なコミット履歴を提示する。

- [be9fcf6](https://github.com/ongaeshi/previous-river/commit/be9fcf6) feat: ノート挿入前にデタッチしないように変更
- [b6ca1db](https://github.com/ongaeshi/previous-river/commit/b6ca1db) feat: insertNoteToLastCommand でのグループ挿入をサポートし、循環参照を防止
- [e63ea67](https://github.com/ongaeshi/previous-river/commit/e63ea67) feat: insertNoteToFirstCommand でのグループ挿入をサポート

---
[⬅️ (previous) 000_previous_property](000_previous_property.md) | [002_find_last_note_optimization  (next) ➡️](002_find_last_note_optimization.md)
