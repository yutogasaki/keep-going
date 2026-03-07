# /persist-migration-check - Zustand 永続 state 変更の安全確認

`useAppStore` の persist state を変える時の漏れを防ぐ。
KeepGoing では localStorage 永続化と version migration を使っているため、state 変更はこの skill の対象。

## 使うタイミング

- `src/store/use-app-store/types.ts` を触る
- `createState.ts` を触る
- `migrate.ts` を触る
- persist されるフィールドや既読フラグを増減させる

手順を省略したくない時は `references/checklist.md` を読む。

## 手順

1. 変更が永続 state か一時 state かを先に切り分ける
2. 永続 state なら最低でも以下を確認する
   - `types.ts`
   - `createState.ts`
   - `migrate.ts`
   - `partializeAppState`
   - 既存テスト or 新規 migrate テスト
3. `APP_STATE_VERSION` が必要なら上げる
4. 旧データを読んだ時の fallback を考える
5. `npx tsc --noEmit` と対象テストを通す
6. user-visible な変更なら画面上でも確認する

## KeepGoing 固有の注意点

- `sessionUserIds` のような文脈状態は、永続化対象かどうかを意識して扱う
- `hasSeen...` 系の既読フラグは、初期値と移行時の既定値が体験に直結する
- migrate の変更は、空 state と既存 state の両方で考える

## 失敗パターン

- `types` だけ変えて `partialize` を直していない
- `createState` に初期値を入れたが migrate を忘れる
- migrate だけ直して対象テストがない
- 画面上の初回表示や既読状態を実機相当で確認していない
