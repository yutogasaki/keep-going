# メニュー・種目のスケーラブルUI設計

## 現状の問題

両タブとも同じ構造的問題を抱えている:

1. **3セクション分割** (標準 / 先生 / じぶん) — origin ベースの分類はユーザーにとって意味が薄い
2. **HighlightsStrip** — おすすめを別UIで表示し、下の一覧と重複
3. **折りたたみヘッダー** — メニュー増加時にセクションの開閉操作が煩雑
4. **GroupCard が縦に大きい** — 10件で 800px+ のスクロール

## 設計原則

- セクション分割 → **フラットリスト** (スキャンしやすい)
- origin 区別 → **バッジで表現** (先生 / じぶん)
- おすすめ → **ソートで上位に浮かせる** (別セクション不要)
- 5件超 → **初期4件 + 「あとN個」ボタン** で初期表示を管理

## くみあわせタブ (MenuGroupTab)

### Before
```
おまかせの設定
先生のおすすめ (HighlightsStrip, max 3)
今日つかうメニュー (collapsible section)
先生メニュー (collapsible section)
じぶんのメニュー (collapsible section + create)
みんなのメニュー
```

### After
```
おまかせの設定
メニュー (N個)          ← セクションヘッダー (件数表示、折りたたみなし)
  [recommended → new → standard → teacher → custom]
  (5件超: 最初4件 + 「あとN個を表示」ボタン)
新しくつくる            ← CreateGroupCard
みんなのメニューを見る   ← PublicMenuSection
```

### 変更内容
1. `MenuGroupTab.tsx` — 3セクション → 1フラットリスト。presets + customGroups を統合ソート
2. `MenuHighlightsStrip` 使用削除 — おすすめはバッジ + ソート上位で代替
3. `GroupCardMainRow.tsx` — じぶんバッジ追加 (isCustom prop で表示)
4. 新: `ShowMoreButton` 共通コンポーネント (5件超の折りたたみ用)
5. `group-tab/types.ts` — sectionState / onToggleSection 削除
6. `MenuPage.tsx` — groupSectionState 関連のprops/state 削除

## 種目タブ (MenuIndividualTab)

### Before
```
カテゴリフィルタ (placement)
先生のおすすめ (HighlightsStrip, max 3)
今日つかう種目 (collapsible section)
先生種目 (collapsible section)
じぶんの種目 (collapsible section + create)
みんなの種目
```

### After
```
カテゴリフィルタ (placement)   ← 維持 (placement フィルタは有用)
種目 (N個)
  [recommended → new → rest, filtered by active category]
  全 origin を統合、バッジで識別
  (じぶんの種目は末尾にまとめ、create カードも末尾)
みんなの種目を見る
```

### 変更内容
1. `MenuIndividualTab.tsx` — Standard/Teacher/Custom セクション → 1フラットリスト
2. `MenuHighlightsStrip` 使用削除
3. カテゴリフィルタはそのまま維持
4. selectionMode (ハイブリッドセッション) はそのまま維持
5. `individual-tab/types.ts` — sectionState / onToggleSection 削除
6. `MenuPage.tsx` — individualSectionState 関連のprops/state 削除

## 共通の新規コンポーネント

### `ShowMoreButton`
- 5件超のリストで「あと N 個を表示」ボタン表示
- タップで全件表示。再タップで折りたたみ
- 両タブで共有

## 不要になるファイル

| ファイル | 理由 |
|---------|------|
| `PresetGroupsSection.tsx` | フラットリストに統合 |
| `TeacherGroupsSection.tsx` | フラットリストに統合 |
| `CustomGroupsSection.tsx` | CreateGroupCard は直接使用 |
| `StandardExerciseSection.tsx` | フラットリストに統合 |
| `TeacherExerciseSection.tsx` | フラットリストに統合 |
| `CustomExerciseSection.tsx` | CreateCustomExerciseCard は直接使用 |
| `MenuHighlightsStrip.tsx` | ソート上位 + バッジで代替 |
| `CollapsibleSectionHeader.tsx` | 折りたたみセクション廃止 |
| `sectionVisibility.ts` + test | セクション状態管理不要 |

## ソート順

### くみあわせ
1. recommended (recommendedOrder 昇順)
2. new teacher content
3. standard presets (表示順維持)
4. teacher section menus
5. custom groups

### 種目
1. recommended (recommendedOrder 昇順)
2. new teacher content
3. placement 順 (prep → stretch → core → barre → ending)
4. 各 placement 内は現在の表示順維持
5. rest exercises (末尾にまとめカード)
6. custom exercises

## 実装順序

1. `ShowMoreButton` 共通コンポーネント作成
2. `GroupCardMainRow` に isCustom バッジ追加
3. `MenuGroupTab` フラットリスト化
4. `MenuIndividualTab` フラットリスト化
5. `MenuPage` から sectionState 関連を削除
6. 不要ファイル削除
7. テスト更新
8. プレビュー検証
