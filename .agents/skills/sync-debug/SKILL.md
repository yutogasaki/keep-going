# /sync-debug - Sync 状態の可視化とデバッグ

sync / restore / conflict のトラブルシュートを高速化する。

## 使うタイミング

- sync 後にデータがおかしい
- restore で期待したデータが戻らない
- conflict modal の挙動を検証したい
- 「クラウドとローカルで何が違うか」を確認したい

## 手順

1. **ローカル状態の確認**
   - Zustand store から sync 関連の state を抽出する
     - `joinedChallengeIds`, `challengeEnrollmentWindows`, `challengeCompletions`
     - `users` (family members), `customGroups`, `customExercises`
     - `appSettings`, `syncedAccountKey`
   - IndexedDB の `sessions` の件数と最新日を確認する

2. **クラウド状態の確認**（Supabase）
   - 対象アカウントの `family_members` を取得
   - `sessions` の件数と最新日
   - `challenge_enrollments`, `challenge_completions`, `challenge_attempts`
   - `app_settings` の最新値

3. **差分レポート**
   - ローカル vs クラウドの差分を表形式で出す
   - 不整合があれば原因候補を推定する:
     - push 失敗（ネットワーク / RLS）
     - pull で上書きされた
     - conflict 解決で片方が捨てられた
     - migrate で構造が変わった

4. **修復オプションの提示**（実行はしない）
   - 「クラウドに合わせる」: pull snapshot を再適用
   - 「ローカルに合わせる」: push を再実行
   - 「手動マージ」: 差分を見て個別に修正

## 注意

- 本番データを変更する操作は、必ずユーザー確認を取ってから実行する
- デバッグ用の console.log は残さない
