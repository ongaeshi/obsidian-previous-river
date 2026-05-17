# Previous River

Previous River は Obsidian のノート同士に「前後関係」を持たせることができるプラグインです。

フロントマターの `previous` プロパティに **前のノートへのリンク** を設定することで、ノートを連続したシーケンスとして繋ぎ合わせることができます。これにより、流れに沿ったスムーズなナビゲーションや、ネットワーク全体像の可視化が可能になります。

![Previous River Demo](https://github.com/user-attachments/assets/aebe81a9-5674-4cc8-8e65-660584197812)


## インストール

Obsidian の「設定」をクリックし、「コミュニティプラグイン」の「閲覧」から `previous river` で検索してください。

もしくは https://community.obsidian.md/plugins/previous-river からインストールしてください。

## 特徴

Previous River は単なるリンク移動プラグインに留まらず、ノートの連続性を活かす強力な機能を備えています。

### 1. プロパティビューとの統合
Obsidian のプロパティビューから簡単に前後のノートに移動することができます。

現在のノートの `previous` プロパティ行の右端に **「next」ボタン** が自動的に表示され、クリックするだけで直感的に次のノートへと進むことができます。

前のノートに戻るときは `previous` プロパティに設定されたリンクをクリックします。

![integration-with-property-view](https://github.com/user-attachments/assets/59da2149-82eb-4fee-b993-5d75528595b0)

### 2. Canvas へのネットワーク書き出し
繋がっているノート群をビジュアルなツリー構造として **Obsidian Canvas に書き出す** ことができます。
- 現在のノートから派生するすべての「次のノート」のツリー
- Vault 全体のすべての川（シーケンス）
- フィルタリングされた特定の川

これらを Canvas 上で簡単に俯瞰できます。また、ループ構造を自動的に検出し、起点のノートに `🔄` アイコンを付与するため、ネットワークの整合性確認にも役立ちます。

![](https://github.com/user-attachments/assets/c74cf77e-9fb7-459f-8c0a-590881e54128)

## コマンド一覧

### ナビゲーション
- **Go to previous note** (前のノートに移動):
  現在のノートの `previous` プロパティでリンクされたノートに移動します。
- **Go to next note** (次のノートに移動):
  現在のノートにバックリンクを持ち、かつその `previous` プロパティが現在のノートを指しているノートに移動します。候補が複数ある場合は、選択用のモーダルが表示されます。
- **Go to first note** (最初のノートに移動):
  `previous` プロパティのチェーンをたどり、シーケンス内の最初の（源流となる）ノートに移動します。
- **Go to last note** (最後のノートに移動):
  次のノートをたどり、シーケンス内の最後のノートに移動します。候補が複数ある場合は、選択用のモーダルが表示されます。

### ノートの操作・編集
- **Insert note** (ノートの挿入):
  選択したノートを現在の連続したシーケンスの間に挿入します。
- **Insert note to first** (先頭に挿入):
  選択したノートを現在のシーケンスの先頭に挿入します。
- **Insert note to last** (末尾に挿入):
  選択したノートを現在のシーケンスの末尾に挿入します。
- **Duplicate next note** (次のノートとして複製):
  現在アクティブなノートを複製し、新しいノートの `previous` プロパティを元のノートに自動的に設定して繋げます。
- **Detach note** (ノートの切り離し):
  現在のノートの `previous` プロパティを `ROOT` に設定することで、シーケンスから切り離します。
- **Set ROOT to previous property** (ROOT の設定):
  アクティブなノートの `previous` プロパティに `ROOT` をすばやく設定します。

### エクスポートと共有
- **Copy next notes list** (次のノート一覧をコピー):
  現在のノートから続く「次のノート」のシーケンスをクリップボードにコピーします。分岐がある場合は、自動的にツリー構造のテキストリストとしてフォーマットされます。
- **Export next notes to canvas** (次のノートをCanvasへ書き出し):
  現在のノートから派生する「次のノート」のツリー構造全体を Obsidian Canvas に書き出します。
- **Export all rivers to canvas** (すべての川をCanvasへ書き出し):
  Vault 全体の `previous` プロパティの繋がりを解析し、ネットワーク全体を Canvas ファイルとして書き出します。
- **Export filtered rivers to canvas** (フィルタリングした川をCanvasへ書き出し):
  特定の条件でフィルタリングされたノートのネットワークのサブセットを Canvas に書き出します。

## おすすめのホットキー

シーケンスを前後にたどる操作は、ホットキーを設定しておくと非常に快適になります。

- **Go to previous note**: `Alt+,`
- **Go to next note**: `Alt+.`
- **Go to first note**: `Alt+Shift+,`
- **Go to last note**: `Alt+Shift+.`
