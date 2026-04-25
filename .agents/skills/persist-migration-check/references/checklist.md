# persist-migration-check checklist

## Files

- `src/store/use-app-store/types.ts`
- `src/store/use-app-store/createState.ts`
- `src/store/use-app-store/migrate.ts`
- `src/store/useAppStore.ts`
- 関連テスト

## Questions

- 永続化するべき state か
- 既存ユーザーが読んだ時に default は安全か
- `partializeAppState` は更新したか
- `APP_STATE_VERSION` を上げる必要があるか
- user-visible な初回表示に影響しないか

## Minimum Verification

- `npm run typecheck`
- 対象 migrate テスト
- 既存データ想定の 1 ケース
- 空 state の 1 ケース

## KeepGoing Frequent Cases

- `hasSeen...` 既読フラグ
- `sessionUserIds` のような文脈 state
- `users[*]` 配下の追加フィールド
