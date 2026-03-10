# Done

重要度の高い履歴だけを残す。
細かい修正は日単位・テーマ単位に要約する。
詳細履歴は `.agents/tasks/archive/YYYY-MM.md` に移す。

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
