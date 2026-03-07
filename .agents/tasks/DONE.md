# Done

重要度の高い履歴だけを残す。
細かい修正は日単位・テーマ単位に要約する。

## 2026-03-07: Sync 競合解決と新端末 restore
- ログイン後 sync を `restore_from_cloud / push_local / merge / conflict` に分岐し、`SYNCED_ACCOUNT_KEY` による再ログイン時の自動 merge を追加
- `クラウドを使う / この端末を使う` の競合モーダルを追加し、settings と onboarding の両方で共通利用
- cloud restore を `merge` から分離し、ローカル history / custom exercises / menu groups / users を cloud snapshot で安全に置き換えるフローを追加
- テスト: login sync plan と restore store state を追加、`npm test -- --run` と `npm run build` を通過

## 2026-03-07: menuGroups / customGroups 循環依存解消
- `src/data/menuGroups.ts` から custom group CRUD の再 export を削除し、`preset/type は data`, `CRUD は lib` に責務分離
- `CreateGroupView`, `useMenuPageData`, `publicMenus` の import を `src/lib/customGroups.ts` へ切り替え
- `npx tsc --noEmit` と `npm run build` を通過し、以前の Rollup circular dependency warning は再現しないことを確認

## 2026-03-07: React Hook dependency warning 解消
- `RecordPage` の `filterSessionsByContext` を `useCallback` 化し、effect 依存を実際の参照に合わせて修正
- `useSessionSetup` の key 文字列依存をやめ、`sessionUserIds`, `globalExcludedIds`, `globalRequiredIds` を直接 deps に揃えた
- 対象ファイルの eslint warning を解消し、全体 lint warning 数を 26 → 23 に削減

## 2026-03-07: editor 共通シェル化
- `src/components/editor/EditorShell.tsx` を追加し、full-screen portal, header, section card, sticky submit button, action button style を共通化
- `TeacherMenuEditor`, `TeacherExerciseEditor`, `SingleExerciseEditor` を共通 shell に移行し、editor の枠組み重複を削減
- 行数は 3 editor 合計で `1338 -> 1044`、shell 追加後でも net 136 行削減
- `npx eslint` 対象確認、`npx tsc --noEmit`, `npm run build` を通過

## 2026-03-04: 初回一括改善（52タスク）
- データ整合性: Syncキュー耐性、Pull保護、Sync失敗UI
- UX: モーダル置換（ふわふわ名前、キャッシュクリア、削除確認）、認証エラーUI
- コード品質: console.log整理、エラーハンドリング統一、as any削減(16→5)
- パフォーマンス: useMemo追加、canvas-confetti遅延ロード
- セキュリティ: RLS追加、デバッグモード制限
- PWA: アイコン追加、SW更新統合
- アクセシビリティ: ARIAラベル、フォーカストラップ
- 用語統一: 保存/作成、編集、メニュー関連
- スタイル統一: カード、入力、ボタン（デザイントークン定義）
- アーキテクチャ: Sync簡素化(-260行)
- デザイン: Liquid Glass導入(21コンポーネント)

## 2026-03-05: バグ修正・UX改善（15タスク）
- バグ: S09 phantom ID、rewardFuwafuwaType範囲、UTC日付修正、空配列行削除、二重保存防止、Pull時sessionUserIds保持、iOS Safari TTS
- UX: 全削除操作に確認ダイアログ、セッション中X確認、native confirm廃止、保存中ローディング
- パフォーマンス: Footer個別セレクタ、ポーリング→イベント駆動、React.memo追加
- コード品質: calculateStreak統合、mappers型安全化、dead code削除、menuGroups分離
- コンテンツ: ヘルプセンター更新(9→12セクション)

## 2026-03-06: 休憩種目・UX改善
- 機能: 休憩3種（R01/R02/R03）追加、おまかせで5分ごとに15秒休憩自動挿入
- セッション: 休憩専用UI（💤アニメーション）、休憩をtotalRunningTime/completedIds/種目数から除外
- メニュー: GroupCard時間・種目数表示から休憩除外、CustomExerciseListを折りたたみ式に変更・秒数表示修正
- UX: カウントダウンTTSで数字読み上げ（5〜1+スタート！）
- テスト: generateSessionテスト3件追加、db.tsテスト25件追加

## 2026-03-06: コード品質・テスト改善
- バグ修正: publishMenuで種目公開失敗時にメニュー公開を中止するよう変更
- エラーハンドリング: SingleExerciseEditor保存失敗UI、teacherMenuSettings delete エラーチェック、signOut後匿名再サインイン失敗通知、useMenuPageData先生コンテンツ読み込み失敗トースト
- 型安全: mapper関数6箇所のany型をSupabase生成型に置換（teacherContent/teacherMenuSettings/teacherItemOverrides/publicMenus/publicExercises）
- 型定義: supabase-types.tsのteacher_item_overridesにemoji/sec/hasSplit/exerciseIdsカラム追加
- テスト: db.ts（25テスト: formatDateKey/parseDateKey/shiftDateKey/getTodayKey 3AM境界/calculateStreak）
- テスト: generateSession（18テスト）、migrateAppState（18テスト）
