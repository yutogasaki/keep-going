# /split - 大きいファイルの責務分割

governance:check でサイズ警告が出たファイルを、安全に分割する。

## 引数

- ファイルパス（必須）: 分割対象のファイル
- 抽出対象（任意）: 特定の関数/コンポーネント群を指定

## 手順

1. 対象ファイルを読み、export されている関数/コンポーネント/型を一覧化する
2. 責務ごとにグループ分けする（UI / ロジック / 型 / ヘルパー / 定数）
3. 依存グラフを確認し、循環依存が生まれない分割案を設計する
4. 分割案をユーザーに提示して確認を取る
5. 承認後、以下を実行する:
   - 新ファイルを作成し、関連する export を移動
   - 元ファイルから re-export するか、import 元を一括更新
   - テストファイルがあれば対応するテストも移動
6. 検証する:
   - `npm run typecheck`
   - 対象テストを実行
   - `npm run governance:check` でサイズ閾値を確認

## 分割の判断基準

- React page/modal/editor: 500 行超で検討、700 行超は原則分割
- Hook/service/data/lib: 250-300 行超で責務分離を検討
- re-export より import 先の一括更新を優先する（re-export は一時的な移行手段）
- 分割後のファイルが 50 行未満になる場合は、分割しすぎの可能性

## 現在の要分割候補（governance:check より）

- `src/pages/teacher-dashboard/challenge-management/ChallengeFormCard.tsx` (1359行)
- `src/lib/challenges.ts` (1103行)
- `src/pages/HomeScreen.tsx` (1007行)
- `src/components/PersonalChallengeFormSheet.tsx` (926行)
