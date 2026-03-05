# Tasks

## TODO

### HIGH: データ整合性
- [x] Syncキュー処理のエラー耐性改善 - continue+リトライカウンタ（MAX_RETRIES=5） (2026-03-04)
- [x] Pull時のデータ保護 - write-first→remove-staleパターンに変更 (2026-03-04)
- [x] Sync失敗のUI通知 - useSyncStatusストア + OfflineBannerに統合表示 (2026-03-04)

### HIGH: UX
- [x] ふわふわ名前入力をアプリ内モーダルに置き換え (2026-03-04)
- [x] キャッシュクリアに確認ダイアログ追加 (2026-03-04)
- [x] 認証失敗時のエラーUI - 永久ローディング問題 (2026-03-04)

### MEDIUM: コード品質
- [x] console.log 19箇所の整理 (2026-03-04)
- [x] エラーハンドリングパターン統一 (2026-03-04)
- [x] as any 型安全性改善（16→5箇所、残りはブラウザAPI互換） (2026-03-04)

### MEDIUM: パフォーマンス
- [x] useMemo不足の改善 - FuwafuwaCharacter, ActivityHeatmap (2026-03-04)
- [x] canvas-confettiの遅延ロード（framer-motionは全体で使用のため対象外） (2026-03-04)

### MEDIUM: UI/UX
- [x] オフライン状態のUI表示 (2026-03-04)
- [x] フォームバリデーションフィードバック追加 (2026-03-04)

### LOW: セキュリティ
- [x] schema.sqlにRLS有効化を追加（deploy.sqlの6テーブル分を追記） (2026-03-04)
- [x] 開発者デバッグモードの本番アクセス制限（import.meta.env.DEV） (2026-03-04)

### LOW: PWA
- [x] PWAアイコンサイズ追加（iOS向け180px等） (2026-03-04)
- [x] SW更新の2系統を統合（version.jsonポーリング削除、SW updateに一本化） (2026-03-04)

### LOW: アクセシビリティ
- [x] ARIAラベル追加（Footer, ログインフォーム等） (2026-03-04)
- [x] モーダルのフォーカストラップ実装（useFocusTrapフック + 主要4モーダル適用） (2026-03-04)

### HIGH: 用語の不統一
- [x] 保存/作成ボタンの表記揺れ統一（ほぞん vs 保存、つくる！ vs 作成） (2026-03-04)
- [x] 編集ボタンの表記揺れ統一（へんしゅう vs 編集） (2026-03-04)
- [x] メニュー関連用語の統一（セットメニュー vs くみあわせ vs じぶんのメニュー） (2026-03-04)

### HIGH: UIスタイルの不統一
- [x] カードのpadding/shadow/border-radius統一 + デザイントークン定義 (2026-03-04)
- [x] 入力フィールドのスタイル統一（padding/border 3種類→1種類） (2026-03-04)
- [x] ボタンの無効化スタイル統一 (2026-03-04)
- [x] キャンセルボタンのスタイル統一 (2026-03-04)

### MEDIUM: アーキテクチャ
- [x] Sync簡素化 - conflict/merge削除、pullAndMerge統合（706→605行、関連込み~260行削減） (2026-03-04)

### MEDIUM: デザイン
- [x] Liquid Glass デザイン導入 - CSSトークン定義 + 21コンポーネント更新 (2026-03-04)

### HIGH: バグ修正
- [x] S09 phantom ID - preset-allメニューからS09削除 (2026-03-05)
- [x] rewardFuwafuwaType 0-11 → 0-9に修正 (2026-03-05)
- [x] fetchActiveChallenges UTC日付 → getTodayKey()に修正 (2026-03-05)
- [x] exerciseIdsOverride空配列で行削除される問題修正 (2026-03-05)
- [x] Session double-save防止（hasSavedRef guard追加） (2026-03-05)
- [x] Pull時のsessionUserIds保持（既存の有効なIDを維持） (2026-03-05)
- [x] iOS Safari TTS getVoices()対応（voiceschangedイベント+キャッシュ） (2026-03-05)

### HIGH: UX改善
- [x] チャレンジ削除に確認ダイアログ追加 (2026-03-05)
- [x] カスタムグループ/種目の削除に確認ダイアログ追加 (2026-03-05)
- [x] セッション中のXボタンに確認ダイアログ追加 (2026-03-05)
- [x] native confirm/alert → ConfirmDeleteModal/Toastに置換 (2026-03-05)
- [x] SingleExerciseEditor/CreateGroupViewに保存中ローディング状態追加 (2026-03-05)

### HIGH: パフォーマンス
- [x] Footer useAppStore()に個別セレクタ追加 (2026-03-05)

### MEDIUM: コンテンツ
- [x] ヘルプセンターの内容をアップデート（9→12セクション、40→50件Q&A） (2026-03-05)

### MEDIUM: パフォーマンス（追加）
- [x] useHomeSessions 5秒ポーリング → sessionSavedイベント駆動に変更 (2026-03-05)
- [x] React.memo追加（ExerciseIcon/PageHeader/ActivityHeatmap/MenuTabs/AutoMenuSettingsCard） (2026-03-05)

### MEDIUM: コード品質（追加）
- [x] calculateStreak重複統合（teacher.ts → db.tsからre-export） (2026-03-05)
- [x] mappers.tsの4関数の`any`型をSupabase型に置換 (2026-03-05)
- [x] dead code削除: UserProfile/profileDB/saveProfile/getProfile (db.ts) (2026-03-05)
- [x] menuGroups.tsのCRUD関数をsrc/lib/customGroups.tsに分離 (2026-03-05)

### LOW: テスト
- [ ] generateSessionのテスト追加（~125行の複雑なビジネスロジック）
- [ ] migrateAppStateのテスト追加

## In Progress
