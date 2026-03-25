# /perf - パフォーマンス計測とバンドル監視

PWA のパフォーマンスを計測し、劣化を早期検出する。

## 手順

1. **バンドルサイズ確認**
   - `npm run build` の出力からチャンク別サイズを収集する
   - 主要ページバンドルの gzip サイズを記録する:
     - HomeScreen, StretchSession, MenuPage, TeacherDashboard, RecordPage, SettingsPage
     - vendor-react, vendor-supabase, vendor-motion, vendor-misc
   - 前回計測との差分があれば警告する

2. **ランタイム計測**（dev server + preview tools）
   - ホーム画面の初回描画時間
   - セッション画面のインタラクション応答
   - メニュー画面のスクロール性能
   - console に `[PERF]` ログがあれば収集する

3. **改善提案**
   - 50KB 超のページバンドル → dynamic import / code splitting 候補
   - 不要な vendor の巻き込み → tree-shaking 漏れ
   - 画像/音声の最適化状態

## 現在のベースライン（2026-03-25 build）

| チャンク | gzip |
|---------|------|
| HomeScreen | 36.7 KB |
| TeacherDashboard | 27.0 KB |
| vendor-react | 66.8 KB |
| vendor-supabase | 44.0 KB |
| vendor-misc | 35.6 KB |
| MenuPage | 24.3 KB |
| SettingsPage | 15.8 KB |
