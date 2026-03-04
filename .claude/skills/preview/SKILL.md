# /preview - プレビュー確認

開発サーバーを起動してスクリーンショットを取得する。

## 手順

1. `preview_start` で dev サーバーを起動（.claude/launch.json の "dev" 設定を使用）
2. サーバーが起動したら `preview_screenshot` でスクリーンショットを取得
3. コンソールエラーがあれば `preview_console_logs` で確認
4. 結果をユーザーに共有

## 引数
- パスが指定された場合は `preview_eval` で `window.location.href = 'パス'` してからスクショ
- "mobile" が指定された場合は `preview_resize` でモバイルサイズに変更してからスクショ
