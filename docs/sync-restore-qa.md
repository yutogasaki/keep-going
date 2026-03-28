# Sync Restore Manual QA

`Sync 実機 restore` と `競合時 UX` を実機で最終確認するための短い runbook。

コード上の主要導線:

- オンボーディング login 後 restore: `src/pages/Onboarding.tsx`
- 設定画面 login 後 sync: `src/pages/settings/AccountSection.tsx`, `src/contexts/AuthContext.tsx`
- 競合モーダル: `src/components/SyncConflictModal.tsx`
- 分岐ロジック: `src/contexts/auth/syncFlows.ts`, `src/lib/sync/loginSync.ts`

## 事前準備

1. クラウド側に既存データがあるテスト用アカウントを 1 つ用意する
2. 内容をメモしておく
   - おこさま人数
   - session 件数と最新日
   - custom exercise / custom group 件数
   - app settings の特徴
3. 実機 A は「ローカル空」にする
   - 新端末 or アプリ初期化済み端末
4. 実機 B は「ローカル既存データあり」にする
   - クラウドと違うおこさま、記録、custom data を少なくとも 1 件ずつ作る

## Case 1: 新端末 restore

目的: `restore_from_cloud` が自動で走り、クラウドの内容で復元されること。

手順:

1. 実機 A でアプリを開く
2. オンボーディングの `ログインする` からテストアカウントでログインする
3. restore 完了後にホームへ入る
4. `せってい > ユーザー・クラス設定` とホーム/きろく/メニューを確認する

期待結果:

- 競合モーダルは出ない
- クラウドにあるおこさまが復元される
- きろく件数と最新日がクラウドと一致する
- custom menu / custom exercise が復元される
- onboarding が不要なら自動で終了する
- エラー文言 `復元に失敗しました` が出ない

## Case 2: 既存ローカルあり + クラウドあり + クラウドを使う

目的: `conflict` 分岐で `クラウドを使う` を選ぶと、ローカル未同期データを使わずクラウド内容に寄ること。

手順:

1. 実機 B でローカル専用データを追加しておく
2. `せってい > アカウント > ログイン` から同じテストアカウントでログインする
3. 競合モーダルが出ることを確認する
4. `クラウドを使う` を選ぶ
5. 同じ確認項目をホーム/きろく/メニュー/設定で見る

期待結果:

- モーダルに `クラウド` と `この端末` のサマリが出る
- `おすすめ` 表示が出ても出なくてもよいが、説明が破綻しない
- ローカルでだけ作ったおこさま/記録/custom data は残らない
- クラウド側の内容に一致する
- toast やエラーで止まらない

## Case 3: 既存ローカルあり + クラウドあり + 両方をまとめる

目的: `conflict` 分岐で `両方をまとめる` を選ぶと、ローカル内容を残しつつクラウド内容も入ること。

手順:

1. Case 2 の前に、実機 B を再度ローカル既存あり状態へ戻す
2. 同じアカウントでログインする
3. 競合モーダルで `両方をまとめる` を選ぶ
4. ホーム/きろく/メニュー/設定を確認する

期待結果:

- ローカル専用データが消えない
- クラウド側データも見える
- session が重複増殖しない
- custom exercise / custom group が不自然に二重化しない
- selected user / joined challenge 周りが壊れない

## Case 4: 失敗時の確認

目的: restore / merge 失敗時に、ユーザーが generic error ではなく文脈つきメッセージを見ること。

最低確認:

1. ネットワーク不安定時か、テスト環境で失敗を再現できるなら settings login を使う
2. restore 失敗時の toast を確認する

期待結果:

- `クラウドのデータ復元に失敗しました。この端末のデータはそのままです。`
- または merge 文脈に応じた失敗文言
- ローカルデータが消えたように見えない

## 見るべき差分

確認対象は最低でも次の 5 つ。

- users 数
- sessions 件数と最新日
- custom exercises 件数
- custom groups 件数
- app settings の代表値

## おかしかった時の確認先

ローカル確認:

- Zustand persist: `keepgoing-app-state`
- `syncedAccountKey`
- IndexedDB / localforage の `history`

クラウド確認:

- `family_members`
- `sessions`
- `custom_exercises`
- `menu_groups`
- `app_settings`

差分調査は `.agents/skills/sync-debug/SKILL.md` の手順を使う。

## ここまでの事前確認

2026-03-26 時点で、次はローカルで確認済み。

- オンボーディングの login 導線表示
- 設定画面の login 導線表示
- 競合モーダルの選択肢と説明文
- restore / conflict / failure message の関連 unit test

未完了なのは、実アカウントと実機での最終 restore / merge 確認のみ。
