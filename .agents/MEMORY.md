# Memory

再利用価値のある決定だけを残す。
一時メモ、進行中タスク、解決済みの細かい修正は書かない。

## UX / Product

- ホームは「ふわふわに会いに行く画面」を壊さない。強い常設 CTA より、状況に応じた軽い促しを優先する。
- 重要な文脈切替は hidden gesture より明示 UI を優先する。
- オンボーディングでは、実利用の主要導線を教える。KeepGoing の初回ガイドはスワイプではなくホーム下部中央の開始ボタンを中心にする。
- メニューの `ひとつ` タブはカテゴリで絞れて、`えらぶ` モードでは選択した種目を優先しておまかせ開始できる。custom exercise も対象に含める。
- 種目の分類は `準備 -> ストレッチ -> 体幹 -> バー -> おわり -> 休憩` の placement 軸を正本にし、`ひとつ` タブ・custom editor・おまかせ設定・custom/teacher/public exercise 保存で同じ語彙を使う。
- built-in では `ポイント＆フレックス` を準備、`ゆりかご / どんぐり` をストレッチ、`深呼吸` を 30 秒の `おわり` とし、おまかせは最後を `おわり` で締める。
- MainLayout は `home / record / menu / settings` を hidden mount で保持するため、teacher dashboard の保存反映は再マウント任せにせず `teacherContentUpdated` event で `メニュー` と `きろく` を再読込する。
- developer dashboard の運用基準は `新規14日保護`、`非アクティブ14日+`、`休止候補 = 作成日と最終利用の両方が30日超` を正本にする。同一アカウント内の同名 member は `session.user_ids` 未参照なら整理候補として区別するが、端末上の不在は断定せずヒューリスティックとして扱う。

## Engineering

- 永続 state 変更は `types/createState/migrate/test` をセットで扱う。
- user-visible な変更は desktop/mobile の visual QA を伴い、UI を触る場合は token 利用確認まで含める。
- `AGENTS.md` / `CLAUDE.md` は短い入口に保ち、共通の詳細は `.agents/agent-guide.md` に集約する。
- skill の正本は `.agents/skills/*/SKILL.md` とし、`.claude/skills/*` は legacy redirect のみを置く。
- `docs/tasks.md` は current focus と未完了 backlog を優先し、重い履歴 snapshot は `docs/archive/tasks-*.md` へ逃がす。
- CI の verify 正本は `.github/workflows/verify.yml` で、`lint -> tsc --noEmit -> test -> build` を `pull_request` と `main` push で回す。
- teacher / developer 判定は client の hardcoded email ではなく `user_roles` + `is_teacher` / `is_developer` RPC を正本にする。

## Known Traps

- agent 向け task queue と product backlog を同じファイルに混ぜると、精度と検索性が落ちる。
- `AGENTS.md` と `CLAUDE.md` に長い重複文書を戻すと、shared guide が形骸化してコンテキスト汚染が再発する。

