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
| P0 | Sync 競合解決 / pull restore | データ喪失と不信感を防ぐ | 正常系だけでなく既存データと競合時 UX まで決める |
| P0 | persist / migrate 安全性 | 状態追加時の事故を防ぐ | `types/createState/migrate/test` を常にセットで更新 |
| P0 | `menuGroups` / `customGroups` 循環依存解消 | build warning を実害化させない | import の責務を整理しないと再発する |
| P0 | effect warning 解消 | 見えにくい UI バグを減らす | `useEffect` を黙らせるだけの修正は禁止 |
| P1 | 巨大ファイル分割 | 修正精度と開発速度を上げる | 先に責務を切らないと分割だけで終わる |
| P1 | セッション再開 / 戻り先の一貫性 | 「終わったあとどうなるか」を明確にする | FAB 方式と仕様差分を整理してから決める |
| P1 | 記録データ強化 | 保護者と先生に説明しやすくする | 内部ログを増やしすぎると実装が重くなる |
| P1 | 先生 / 家族 UX の意味明確化 | 誤操作を減らす | 可愛さより明示性を優先する |
| P2 | アクセシビリティとレスポンシブ | 長期運用の事故を減らす | modal / focus / aria を横断で見る必要がある |
| P2 | TTS / 音量 / 演出 polish | 継続体験を上げる | 過剰演出で圧を出さない |

### 現在の未完了 backlog / spec gap

- [ ] レスポンシブ対応
- [ ] BGM の本格導入
- [ ] Figma 前提のデザイン運用

### 今月確定した仕様判断

- [x] セッション仕様 §3.7 の `タブ移動時の再生停止` は、FAB overlay 前提で `セッション中は通常タブ移動なし` へ言い換える方針で確定
- [x] セッション仕様 §4.1 の `同日再起動時の再開` は、未完了なら前回セッションを先頭から再開し、完了後は新しいおまかせを開始する方針で確定

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

### 将来拡張（Operation §4）

- [ ] 継続時の選択肢拡張: 「体幹中心で続ける」「ストレッチ中心で続ける」
- [ ] 育成（ぴよ）機能の本格 UI 展開

---

## 参照

- 詳細仕様: `docs/keep_going_*`
- current product backlog / spec gap: `docs/tasks.md`
- 履歴 snapshot: `docs/archive/tasks-2026-03.md`

---

*最終更新: 2026-03-08*


