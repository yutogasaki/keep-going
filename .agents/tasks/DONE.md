# Done

重要度の高い履歴だけを残す。
細かい修正は日単位・テーマ単位に要約する。
詳細履歴は `.agents/tasks/archive/YYYY-MM.md` に移す。

## 2026-03-16: developer dashboard の整理導線を強化
- developer dashboard に `整理しやすい候補` カードを追加し、休止候補の一括休止、整理候補ユーザーの一括削除、休止済み候補アカウントの一括削除を分けて実行できるようにした
- `一度も使っていないまま14日以上経過した account` と `リセマラ系の同名 duplicate` は同じ `未使用整理候補` としてまとめ、開発者向けの表示・確認ダイアログ・テストを一本化した
- 整理候補ユーザーの削除は member のみを削除し、account 自体は残すことを UI 文言と confirm dialog で明示した

## 2026-03-15: website の更新情報をチャレンジ導線に刷新
- `public/website/index.html` の更新情報を、チャレンジ刷新後の `参加する` と `じぶんチャレンジ作成` まで1枚で伝わる内容へ整理し、以前の更新は折りたたみで残した
- 後続でメニュー機能拡張の更新カードを追加し、`さっと追加` で作りやすくなった内容を主役にしつつ、最近のチャレンジ更新は折りたたまず visible のまま維持した
- Tips も `ホームのチャレンジをのぞこう` に更新し、`npm run build` と desktop / mobile の Playwright visual QA で静的 LP の見え方を確認した

## 2026-03-15: じぶんチャレンジ再挑戦導線
- `completed / ended_manual / ended_expired` の `じぶんチャレンジ` 詳細から `もう一回つくる` を出し、前回と同じ対象・説明・絵文字・プリセットで新しいチャレンジを作り直せるようにした
- `npx tsc --noEmit`、対象 vitest、`npm run build` を通した

## 2026-03-15: 先生チャレンジ再挑戦の MVP
- `always_on + rolling` の先生チャレンジだけ `もう一度やる` を出し、completion を外して新しい rolling 期間で再開できるようにした
- ごほうびの二重配布を防ぐため `challenge_reward_grants` を追加し、既存 completion からの backfill migration を用意した
- `npx tsc --noEmit`、対象 vitest、`npm run build` を通した

## 2026-03-14: じぶんチャレンジ reverse entry 追加
- 公開メニュー / 公開種目の詳細から、そのまま `じぶんチャレンジ` 作成フォームへ入れる導線を追加した
- public detail から作る時は一度 import して `もらったメニュー / もらった種目` として扱い、ホーム / 一覧 / 詳細カードでも target 名と絵文字が崩れないよう custom target 解決を追加した
- `npx tsc --noEmit`、`npm run build`、対象 vitest、Playwright smoke で `detail -> form` 導線を確認した

## 2026-03-14: チャレンジ管理の見え方を改善
- 先生ダッシュボードのチャレンジ一覧で、参加人数・クリア人数・参加中メンバーの進みぐあいを見えるようにした
- teacher / developer 向けの session snapshot を exercise / menu 判定に足りる形へ広げ、先生画面から `3 / 5日` などの状況を出せるようにした
- `じぶんチャレンジ` は進捗 0 のときだけ削除できるようにし、先生チャレンジ詳細の `報酬` 文言は `ごほうび` に寄せた
- `npx tsc --noEmit`、対象 vitest、`npm run build` を通した

## 2026-03-14: チャレンジ拡張の仕様整理
- 先生チャレンジと `じぶんチャレンジ` を同じ計算基盤で扱う方針、`参加 = 開始` / `作成 = 開始`、`種目 / メニュー` 両対応、じぶん報酬 `ほし1こ固定` を仕様・backlog・task queue に反映した
- UI / Logic / Operation のチャレンジ仕様書へ rolling / active_day とクラウド保存前提の拡張メモを追記し、`npm run governance:check` で terminology drift なしを確認した

## 2026-03-11: ホームの先生/みんな導線を再設計
- ホームの情報設計を `チャレンジ -> 先生のメニュー -> みんなのメニュー` に整理し、仕様書でも `先生` と `みんな` を同じカードファミリーの別バリアントとして扱う方針を明文化した
- `先生のメニュー` はホーム専用カード + 詳細シートに組み替え、`teacher_section` のみを対象にして「くわしく見る」と「はじめる」を分離した
- `みんなのメニュー` は公開メニュー3件を主役にしたカード群へ再設計し、ホームから `みんなの種目` 発見を途切れさせない導線を同セクション内へ追加した
- 公開メニュー詳細に「このメニューで見つかる みんなの種目」を表示し、公開種目の発見価値をカードと詳細の両方で伝わるようにした
- `npx tsc --noEmit`、`npm test`、`npm run build` を通し、desktop/mobile の Playwright スクリーンショットで先生/みんなカードと詳細シートの見た目を確認した

## 2026-03-08: agent guide canonical 化と done 圧縮
- `AGENTS.md` / `CLAUDE.md` を短い入口にし、共通の詳細を `.agents/agent-guide.md` へ集約
- `docs/development-governance.md` と governance skill / script を shared guide + done archive 方針へ更新
- local verify を CI / governance と同じ `lint -> tsc --noEmit -> test -> build` 順に揃え、`npm run governance:check` で canonical path / stale path / size 監査を実行できるようにした
- skill の正本を `.agents/skills/*/SKILL.md` に固定し、`.claude/skills/*` は legacy redirect に寄せた
- 2026-03 の詳細完了履歴を `.agents/tasks/archive/2026-03.md` へ移し、`DONE.md` を要約ログへ圧縮
- `docs/tasks.md` を current focus と未完了 backlog 中心に再編し、履歴 snapshot を `docs/archive/tasks-2026-03.md` へ分離
- `docs/development-governance.md` に required skill / verify matrix を追加し、UI 変更の `visual-qa` 必須化と token 利用確認を明文化
- `.github/workflows/verify.yml` を追加し、`lint -> tsc --noEmit -> test -> build` を PR / main push で自動実行する CI 導線を追加
- `user_roles` テーブルと migration / deploy を追加し、teacher / developer 判定を hardcoded email から Supabase role 判定へ移行
- オンボーディングを `welcome -> name -> class -> start -> account -> notification` に再設計し、主要導線をスワイプ説明から開始ボタン体験へ切り替え
- メニューの `ひとつ` タブにカテゴリビューと `えらぶ` モードの優先実行フローを追加し、custom exercise を含む組み合わせ開始を可能にした
- `みんなのメニュー` のホームおすすめカードと一覧カードを縦構成に組み替え、長いタイトルでも小さく潰れずにはみ出しにくい表示へ調整した
- 種目分類を `準備 -> ストレッチ -> 体幹 -> バー -> おわり -> 休憩` の placement 軸へ統一し、custom / teacher / public exercise、`ひとつ` タブ、おまかせ設定、セッション生成を同じ語彙で扱うよう整理した
- built-in placement を調整し、`ゆりかご / どんぐり` をストレッチへ移動、`深呼吸` を 30 秒の `おわり` 種目として追加して、おまかせの最後に来るようにした
- teacher dashboard での種目/メニュー保存・表示設定変更のあとに `teacherContentUpdated` を通知し、hidden mount の `メニュー` / `きろく` が再読込して保存内容をすぐ反映するようにした
- teacher dashboard の生徒一覧は初回ロード時だけ自動展開し、クラスカードを閉じたあとに勝手に再展開しないよう修正した。developer dashboard は `新規14日 / 非アクティブ14日+ / 休止候補30日+ / 同名あり` の層別へ整理し、同名かつ session 未参照メンバーを整理候補として見分けられるようにした

## 2026-03: 月次サマリ
- sync / restore / teacher data まわりの信頼性改善をまとめて実施し、競合解決・restore・初回同期並列化・ページネーションを強化
- menu / editor / session / record 周辺の責務分離と UX 改善を進め、循環依存解消、hook 分割、editor shell 共通化、同日再開、記録正規化、アクセシビリティ、TTS 音量整理を反映
- restore settings sanitize、session visibility helper 化、`MenuIndividualTab` / `GroupCard` 分割を追加し、sync fallback と MenuPage の保守性をさらに改善
- record tab に `いま見ている記録` summary を追加し、保護者・先生向けに `だれの記録か / どれくらい続いているか / 参加した人` を一目で読める形へ整理した
- sync conflict modal に `おすすめ` と要約理由を追加し、persist / migrate は `users` sanitize と persisted key 正本化で状態追加時の崩れにくさを上げた
- login / restore 成功・失敗文言を summary-aware にして、`何を復元・同期したか` と `この端末のデータはそのまま` を settings / onboarding で同じ基準に揃えた
- onboarding / settings / login に共通の account sync guide card を追加し、`この端末 / ログイン後 / データが重なったら` の説明を同じ語彙へ統一した
- 2026-03-04 から 2026-03-07 までの詳細履歴は `.agents/tasks/archive/2026-03.md` を参照
- StretchSession の desktop / mobile smoke QA を追加し、`npm run e2e:smoke` で footer navigation、pause / background resume、big break modal の確認を build 付きで再実行できるようにした
- session overlay の主要ボタンへ aria-label を追加し、background resume countdown 完了時に再生を戻す修正を入れた
- 旧仕様書に残っていた `ぴよ` 呼称を主要仕様書から除去し、`ふわふわ` / `お部屋` ベースへ統一した

## 2026-03-10: 公開種目 migration 補完
- `supabase/migration_public_exercises.sql` を追加し、既存 Supabase 環境でも `public_exercises` / `exercise_downloads` / 公開種目 RPC を後追い適用できるようにした
- `じぶん種目` の公開失敗要因だった公開種目用 migration 抜けを埋め、`npm run verify:quick` で型チェックとテスト通過を確認した

## 2026-03-10: 先生メニューの表示整理
- メニュー画面の先生メニューを `先生のおすすめ` と通常欄へ分割せず、`先生メニュー` の1セクションへ集約して折りたたみ可能にした
- ホームに `先生から` の気づき導線を追加し、先生メニューの `NEW` / `おすすめ` を最大2件まで表示する構成にした
- `NEW` 判定を 14 日の共通 helper に寄せ、型チェック・218件のテスト・desktop/mobile の visual QA で空状態の崩れなしを確認した

## 2026-03-11: 先生メニューのクラス設定即時反映
- 先生ダッシュボードのカード上クラス設定変更で、`teacher_menu_settings` だけでなく先生作成メニュー/種目本体の `classLevels` も同時更新するように修正した
- 編集画面を開いて保存しなくても、カード上の `おまかせ` / `非表示` 変更がクラス別表示に即時反映されるようにし、helper テスト追加のうえ `tsc` / `test` / `build` を通した
- ホームの `先生のメニュー` セクションに `先生の新しい種目` 発見パネルと詳細シートを追加し、公開メニュー側と同じくメニュー主役 + 種目発見1件の構成へ揃えた
- `homeMenuUtils` に先生種目 discovery helper を追加し、`npm run verify` と desktop/mobile の Playwright 画面確認でホーム表示と詳細シート遷移を確認した

## 2026-03-15: 先生チャレンジ再挑戦の履歴化
- `challenge_attempts` を追加して、先生チャレンジの参加/再挑戦/クリアを append-only に記録する土台を入れた
- join / retry / complete で current state の `challenge_enrollments` / `challenge_completions` を維持したまま、attempt 履歴も同期して記録するようにした
- 先生ダッシュボードのチャレンジ一覧で `これまでの挑戦回数`、`再挑戦中の人数`、`もう一回クリア回数` と、参加者ごとの `2回目` 表示を出せるようにした
- 先生ダッシュボードの参加者表示を `名前 / 何回目 / 進みぐあい / いつまで` の行表示に寄せ、`いつでもチャレンジ` の過去カードと詳細文言も `またできる / 新しい期間ではじめられる` に整えた
- 参加者行を押すと `いまの状況 / 最近クリア / これまでの挑戦` が見える detail sheet を追加して、先生が個別の続き方を追いやすくした
- 参加者 detail sheet から `生徒一覧で記録を見る` を追加し、先生ダッシュボード内でチャレンジ状況からその子の記録へ飛べるようにした
- `getChallengePublishLabel` を `今だけチャレンジ / いつでもチャレンジ` 表記に揃え、teacher 一覧の掲載ラベルも世界観に合わせて整理した
