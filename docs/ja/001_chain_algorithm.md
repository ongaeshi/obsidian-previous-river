# Previous River の同一チェイン判定アルゴリズム

## 1. 背景と目的 (Background)

ナレッジベース内のリンクされたノート間において、「ノードAとノードBが同一の経路（チェイン）上に存在するか」を判定するアルゴリズムを実装する。これにより、リンクの無限ループや構造的な矛盾を未然に防ぐ。

## 2. 概念定義 (Definitions)

- **同一経路 (Same Path)**: `previous`プロパティの単方向リストにおいて、一方が他方の祖先（または子孫）である状態。
- **兄弟関係 (Siblings)**: 共通の祖先を持つが、互いに直接の親子関係がない状態。本判定アルゴリズムでは同一経路とみなさない（`false`を返す）。

## 3. 設計意図/ADR (Design Decisions)

ノード間の関係性を正しく区別するため、関数名とアルゴリズムの仕様を以下のように決定した。

| 検討項目 | 採用案 | 却下案 | 理由 |
|---|---|---|---|
| 基本機能 | `isAncestor` による一方向の再帰的探索 | `previous` プロパティの単純比較 | 階層が深い場合でも正確に祖先を特定するため。 |
| 双方向判定の関数名 | `isOnSamePath` | `isConnected` | `isConnected` では兄弟関係も「繋がっている」と誤認されるリスクがあるため。 |
| 双方向判定の関数名 | - | `areOnSameChain` | 「チェイン」という用語がデータ構造の文脈において曖昧さを残すため。 |
| 無限ループ対策 | `visited` (Set) による訪問履歴の記録 | - | ユーザー操作等によって意図せず発生した循環参照（サイクル）によるクラッシュを防ぐため。 |

## 4. 実装 (Implementation)

方向性を持つ祖先判定関数（`isAncestor`）と、双方向の同一経路判定関数（`isOnSamePath`）を組み合わせて実装した。

### 祖先判定 (`isAncestor`)

`target` が `note` の祖先であるかを判定する。循環参照を検出するために `visited` セットを使用する。

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

## 5. ユースケース (Usage)

コマンド制御時の安全装置（バリデーション）として利用する。
ノードの挿入操作（`insertNoteCommand`など）において、対象ノードが既に同一経路上に存在する場合、操作をブロックする。

```typescript
// コマンド実行時のバリデーション例
if (isOnSamePath(app, file, selectedNote)) {
    new Notice(`Cannot insert: "${file.basename}" and "${selectedNote.basename}" are on the same path.`);
    return;
}
```

これにより、ノートのリンク構造の崩壊や循環参照の発生を防止する。

## 6. コミットログ

関連するコミット履歴を提示する。

- [`be9fcf6` - feat: Do not detach before inserting](https://github.com/ongaeshi/previous-river/commit/be9fcf6f0eecf0920654c89f71aaf368d6d956a7)
- [`b6ca1db` - feat: Support group insertion in insertNoteToLastCommand and prevent cycles](https://github.com/ongaeshi/previous-river/commit/b6ca1dbf49eaa98b3c0ea441edaee3972fec3904)
- [`e63ea67` - feat: Support group insertion in insertNoteToFirstCommand](https://github.com/ongaeshi/previous-river/commit/e63ea67804254f162a12707e97d07595546c0a35)

---
[⬅️ previous 000_previous_property](000_previous_property.md) | [➡️ next 002_find_last_note_optimization](002_find_last_note_optimization.md)
