# Findora - フルテキスト検索ファイル管理ツール

Findora（ファインドラ）は、ローカルPC内のファイルを対象とした全文検索対応のファイル検索ツールです。

## 主な機能

- ディレクトリを指定してファイル名 + 内容の全文検索
- `.txt`, `.md`, `.docx`, `.pdf` などを対象に中身を抽出
- ファイルメタ情報（作成日、更新日、サイズ）でのフィルタリング
- 検索結果からファイルを即時オープン

## インストール

```bash
# 依存関係のインストール
npm install

# 開発モードで起動
npm run tauri dev

# ビルド
npm run tauri build
```

## 開発環境

- [VS Code](https://code.visualstudio.com/) + [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)
- Node.js 18以上
- Rust 1.70以上

## 技術スタック

- **Tauri**: クロスプラットフォームGUI
- **React + TypeScript**: フロントエンド
- **Rust**: バックエンド（高速ファイル探索とテキスト抽出）

## ライセンス

MIT
