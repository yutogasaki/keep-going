# /todo - タスク管理

`.agents/tasks/TASKS.md` と `.agents/tasks/DONE.md` を使ってタスクを管理する。

## 引数パターン

- **引数なし** → TASKS.md の未完了タスク一覧を表示
- **`add タスク内容`** → TODO セクションにタスク追加（今日の日付を自動付与）
- **`done N`** → N番目のタスクを完了 → DONE.md に移動（完了日付を付与）
- **`progress N`** → N番目のタスクを In Progress セクションに移動

## 手順

### 引数なし（一覧表示）
1. `.agents/tasks/TASKS.md` を読み込む
2. TODO と In Progress のタスクを表示
3. タスクがなければ「未完了タスクなし」と報告

### add
1. `.agents/tasks/TASKS.md` を読み込む
2. TODO セクションの末尾に `- [ ] タスク内容 (YYYY-MM-DD)` を追加
3. 追加したタスクを報告

### done N
1. `.agents/tasks/TASKS.md` を読み込む
2. N番目のタスク（TODO + In Progress を通し番号）を特定
3. そのタスクを TASKS.md から削除
4. `.agents/tasks/DONE.md` に `- [x] タスク内容 (完了: YYYY-MM-DD)` として追加
5. 完了を報告

### progress N
1. `.agents/tasks/TASKS.md` を読み込む
2. N番目のタスクを TODO セクションから In Progress セクションに移動
3. 移動を報告

## 注意
- 番号は TODO → In Progress の順に通し番号で数える
- 日付は実行時の日付を使う
