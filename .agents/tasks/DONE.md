# Done

重要度の高い履歴だけを残し、細かい修正は日単位・テーマ単位に要約する。
詳細履歴は `.agents/tasks/archive/YYYY-MM.md` に移す。

## 2026-03-13: `fuwafuwaHomeCardCopy` を content bank へ分割
- `fuwafuwaHomeCardCopy.ts` を façade に戻し、型・shared helper・family speech・user speech を別モジュールへ分割した
- speech copy を topic / domain 単位で逃がし、governance の critical warning だった `fuwafuwaHomeCardCopy.ts` を解消した
- `npx tsc --noEmit`、home speech 系の関連テスト、`npm run governance:check` を通した

## 2026-03-13: `ChallengeFormCard` を責務分割
- `ChallengeFormCard.tsx` から styles、form primitives、selection state hook、target / reward section を分離し、組み立て役へ整理した
- `ChallengeFormCard.tsx` は `842 -> 179` 行になり、`ChallengeFormCard` の critical warning を解消した
- `npx tsc --noEmit`、`npm run build`、`npm run governance:check` を通した

## 2026-03-13: `FuwafuwaHomeCard` の speech state を hook へ分離
- speech / daily conversation / poke state を `useFuwafuwaSpeechState` へ切り出し、`FuwafuwaHomeCard.tsx` は描画中心の組み立て役へ整理した
- `FuwafuwaHomeCard.tsx` は `560 -> 134` 行になり、governance warning 対象から外れた
- `npx tsc --noEmit`、home speech 系の関連テスト、`npm run build`、`npm run governance:check` を通した

## 2026-03-13: `HomeScreen` の local state/effect を hook 群へ分離
- `HomeScreen.tsx` から modal / browser / afterglow / visit recency / session user normalization を hook 群へ逃がし、画面本体を組み立て役へ整理した
- `HomeScreen.tsx` は `596 -> 364` 行、`useHomeScreenState.ts` は `190` 行になり、`HomeScreen` 系は governance warning 対象から外れた
- `npx tsc --noEmit`、`npm run build`、`npm run governance:check` を通した

## 2026-03-13: `migrateHelpers` を sanitize ドメイン別に分割
- `migrateHelpers.ts` を façade に戻し、primitive / user / session / home visit sanitize を `migrate-helpers/` 配下へ分離した
- `migrateHelpers.ts` は `360 -> 47` 行になり、migration helper の governance warning を解消した
- `npx tsc --noEmit`、migration テスト 33 本、`npm run build`、`npm run governance:check` を通した

## 2026-03-13: `createState` を store slice へ分割
- `createState.ts` を compose 専用に戻し、user / session / settings / home / debug slice を `create-state/` 配下へ分離した
- `createState.ts` は `303 -> 15` 行になり、store createState の governance warning を解消した
- `npx tsc --noEmit`、`createState` テスト 11 本、`npm run build`、`npm run governance:check` を通した

## 2026-03-11: ホームの先生/みんな導線を再設計
- ホームの情報設計を `チャレンジ -> 先生のメニュー -> みんなのメニュー` に整理し、`先生` と `みんな` を同じカードファミリーの別バリアントとして扱う方針を仕様書と実装で揃えた
- ホームから新しいメニュー / 種目を見つける導線を、詳細シートを含めて自然につながる形へ再設計した
- `npx tsc --noEmit`、`npm test`、`npm run build`、desktop/mobile の Playwright 画面確認を通した

## 2026-03-08: 開発運用の canonical 化と verify 整備
- `AGENTS.md` / `CLAUDE.md` を短い入口に整理し、shared guide・task / done / memory / backlog の役割を canonical path へ揃えた
- `npm run governance:check`、required skill / verify matrix、CI の `lint -> tsc --noEmit -> test -> build` を整備し、詳細履歴は `.agents/tasks/archive/2026-03.md` と `docs/archive/tasks-2026-03.md` に退避した

## 2026-03: 月次サマリ
- sync / restore / teacher data まわりの信頼性改善をまとめて実施し、競合解決・restore・初回同期並列化・ページネーションを強化
- menu / editor / session / record 周辺の責務分離と UX 改善を進め、循環依存解消、hook 分割、editor shell 共通化、同日再開、記録正規化、アクセシビリティ、TTS 音量整理を反映
- record summary、sync conflict 要約、restore/login 文言、account sync guide、公開種目 migration 補完、teacher menu 即時反映、StretchSession smoke QA、overlay aria-label、旧呼称整理まで進めた
- 詳細履歴は `.agents/tasks/archive/2026-03.md` を参照する
