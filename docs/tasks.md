# KeepGoing — Product Backlog / Spec Gap

> このファイルは product backlog と仕様差分の整理用。
> Active execution queue は `.agents/tasks/TASKS.md` を使う。

> セッション間で進捗を共有するために `docs/` に保管。
> 4仕様書（Core v1.4 / UI v7 / Logic v2.0 / Operation v1.0）と照合済み。
> 最終更新: 2026-03-08

---

## 2026-03 今月の焦点

今月は「子どもに楽しい」「保護者に安全」を壊さず、まず信頼性と重い箇所を整える。

| 優先 | 項目 | 狙い | 注意点 |
|------|------|------|--------|
| P0 | Sync 実機 restore の最終確認 | core hardening と競合 UX 改善は進んだので、残りは手動 restore 確認を閉じる | 既存データあり端末とクラウド既存データの両ケースを見る |
| P1 | 巨大ファイル分割 | 修正精度と開発速度を上げる | 先に責務を切らないと分割だけで終わる |
| P1 | 先生 / 家族 UX の意味明確化 | 誤操作を減らす | 可愛さより明示性を優先する |
| P2 | オンボーディング login / restore UX polish | account step / restore flow / shared account guide は実装済みなので、残りの edge case と実機導線を磨く | settings 側の login error 導線と揃える |
| P2 | 音声 / 通知 / 演出 polish | TTS・音量・通知設定は実装済みなので、必要時だけ残りの体験調整を行う | 過剰演出で圧を出さない |

### 現在の未完了 backlog / spec gap

- [ ] Sync 実機 restore と競合時 UX の最終手動確認

### 今月確定した仕様判断

- [x] セッション仕様 §3.7 の `タブ移動時の再生停止` は、FAB overlay 前提で `セッション中は通常タブ移動なし` へ言い換える方針で確定
- [x] セッション仕様 §4.1 の `同日再起動時の再開` は、未完了なら前回セッションを先頭から再開し、完了後は新しいおまかせを開始する方針で確定
- [x] 育成 UI の呼称は `ぴよ` ではなく `ふわふわ` を正本にし、タブ構成も `home / record / menu / settings` を正本にする

---

## 2026-03 開発運用 backlog

プロダクト改善を継続しつつ、開発効率・精度・運用しやすさを落とさないための backlog。
active execution queue へ移すのは `.agents/tasks/TASKS.md` に限定する。

### 今すぐやる 5 項目

| 状況 | 優先 | 項目 | 狙い | 注意点 |
|------|------|------|------|--------|
| [x] | P0 | `AGENTS.md` / `CLAUDE.md` canonical 化 | guide の重複更新と context 消費を減らす | 参照先を増やしすぎず、入口は短く保つ |
| [x] | P0 | `.agents/tasks/DONE.md` 月次圧縮 | 履歴を要約ログへ戻し、探索コストを下げる | 大きな設計判断は消さずに残す |
| [x] | P1 | `docs/tasks.md` 軽量化 | 毎回読む backlog のコンテキスト量を下げる | archive を増やしすぎて single source を壊さない |
| [x] | P1 | skill / verify の必須化 | persist / UI / governance 変更の漏れを減らす | 儀式化しすぎて手数だけ増やさない |
| [x] | P1 | CI で `lint + tsc + test + build` 実行 | ローカル運用依存を減らし、精度を安定させる | 失敗時の修復コストが高い flaky check は避ける |

### 補足メモ

- UI 変更では desktop / mobile の visual QA を先に運用へ定着させ、その後に自動化を検討する
- design token の徹底は、一括置換より変更頻度の高い画面から段階的に進める
- security / privacy / observability は別軸で継続確認するが、今月の最優先は governance と verification の安定化

---

## 履歴 / 将来拡張

### 履歴 snapshot

- 2026-03 で閉じた項目、実装済み snapshot、当時の優先順は `docs/archive/tasks-2026-03.md` を参照する
- `docs/tasks.md` には current focus と未完了 backlog だけを残し、重い履歴は archive へ逃がす

### 今は後ろに置くもの

- [ ] E2E / visual snapshot の常設化
- [ ] coverage threshold の厳格化
- [ ] ADR / release runbook / rollback 手順の整備
- [ ] design token 直書き色の全画面一括掃除
- [ ] observability / privacy / accessibility / performance budget の制度化
- [ ] お部屋を「再会の場」として再設計する（実利用でふわふわが十分に集まってから検討する）

### 将来拡張（Operation §4）

- [ ] 継続時の選択肢拡張: 「体幹中心で続ける」「ストレッチ中心で続ける」

---

## 参照

- 詳細仕様: `docs/keep_going_*`
- current product backlog / spec gap: `docs/tasks.md`
- 履歴 snapshot: `docs/archive/tasks-2026-03.md`

---

*最終更新: 2026-03-14*
