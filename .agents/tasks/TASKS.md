# Tasks

Active execution queue only.
Backlog や仕様差分は `docs/tasks.md` を使う。

## TODO
- [ ] iPhone Safari / PWA 追加状態で safe area の最終確認をする (`main tabs / settings detail / editor / onboarding`)
- [ ] Sync 実機 restore の最終確認をして、競合時 UX の手動確認を完了する
- [ ] 共通チャレンジエンジンを追加し、`calendar / rolling` と `total_count / active_day` の進捗計算をテスト込みで固める
- [ ] 先生チャレンジを rolling 日数型に対応させ、`参加 = 開始` の enrollment 保存を Supabase 側へ追加する
- [ ] 先生ダッシュボードと生徒側チャレンジUIを rolling 表示に対応させ、既存固定期間チャレンジの回帰を防ぐ
- [ ] `じぶんチャレンジ` の Supabase 保存基盤を追加し、アカウント復元後も継続できるようにする
- [ ] `じぶんチャレンジ` の作成 / 詳細 / 終了UIとチャレンジ一覧を追加する
- [ ] ホームに `先生 -> じぶん -> おわった` の順で統合し、desktop / mobile の visual QA を完了する

## In Progress
- [ ] Safe area 統一後の実機 visual QA と微調整を進める
