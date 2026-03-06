# Done

<!-- /cleanup で重要度に基づいて整理 -->

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

## 2026-03-06: コード品質・テスト改善
- バグ修正: publishMenuで種目公開失敗時にメニュー公開を中止するよう変更
- エラーハンドリング: SingleExerciseEditor保存失敗UI、teacherMenuSettings delete エラーチェック、signOut後匿名再サインイン失敗通知、useMenuPageData先生コンテンツ読み込み失敗トースト
- 型安全: mapper関数6箇所のany型をSupabase生成型に置換（teacherContent/teacherMenuSettings/teacherItemOverrides/publicMenus/publicExercises）
- 型定義: supabase-types.tsのteacher_item_overridesにemoji/sec/hasSplit/exerciseIdsカラム追加
- テスト: db.ts（25テスト: formatDateKey/parseDateKey/shiftDateKey/getTodayKey 3AM境界/calculateStreak）
- テスト: generateSession（18テスト）、migrateAppState（18テスト）
