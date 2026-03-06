# Tasks

## TODO

### バグ・データ整合性
- [ ] pullAndMerge のコンフリクト処理実装（オフライン編集がクラウドで上書きされる問題）

### リファクタリング
- [ ] TeacherMenuEditor/ExerciseEditor/SingleExerciseEditor統一 → 共通シェル + 個別パーツ（1322→~600行）
- [ ] useMenuPageData分割 → useMenuUsers/useTeacherContent/useMenuPublishActions/useMenuExercises
- [ ] MenuSettingsSection（638行）のロジック分離 → useMenuSettingsData抽出
- [ ] デザイントークン未適用箇所の統一（TeacherMenuEditor等でFONT/COLOR直書き）

### テスト
- [ ] challenges.ts のテスト追加（countExerciseInPeriod等）
- [ ] teacherItemOverrides.ts のテスト追加（全nullなら削除ロジック）

### スケーラビリティ（将来対応）
- [ ] 先生メール管理をuser_rolesテーブルに移行（deploy.sql + teacher.ts の二重管理解消）
- [ ] initialSync の逐次await → 並列化（セッション数百件で遅い）
- [ ] fetchAllStudents のページネーション対応（5000件一括取得）
- [ ] アクセシビリティ改善（Editor系のrole/aria-modal/focusTrap、GroupCardのaria-expanded）

## In Progress
