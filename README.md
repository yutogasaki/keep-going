# KeepGoing

バレエ教室向けストレッチ・トレーニング管理 PWA。子ども向けの「ふわふわ」育成体験、保護者の複数ユーザー管理、先生のメニュー管理機能を持つ。

## 必要環境

- Node.js 22+（`nvm use` で自動切替）
- npm

## セットアップ

```bash
nvm use                    # Node 22 を使用
npm install                # 依存パッケージのインストール
cp .env.example .env.local # 環境変数テンプレートをコピー
```

`.env.local` を編集し、Supabase の URL と anon key を設定:

```
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
VITE_WEB_PUSH_PUBLIC_KEY=BL...
```

```bash
npm run dev                # 開発サーバー起動
```

## DB セットアップ

[supabase/README.md](supabase/README.md) を参照。

## 主要コマンド

| コマンド | 説明 |
|---------|------|
| `npm run dev` | 開発サーバー |
| `npm run build` | 本番ビルド（tsc + vite build） |
| `npm test` | テスト実行（vitest） |
| `npm run verify` | lint + tsc + test + build（CI と同等） |
| `npm run verify:quick` | tsc + test |
| `npm run lint` | ESLint |
| `npm run format` | Prettier フォーマット |
| `npm run e2e:smoke` | E2E スモークテスト（要: `npx playwright install chromium`） |

## デプロイ

- Vercel に `main` ブランチへのプッシュで自動デプロイ
- PWA 対応（Service Worker 自動登録）

## Web Push セットアップ

毎日通知を有効にする場合は、追加で以下を設定する。

```
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
WEB_PUSH_PUBLIC_KEY=BL...
WEB_PUSH_PRIVATE_KEY=...
WEB_PUSH_SUBJECT=mailto:notify@example.com
CRON_SECRET=change-me
```

- Supabase には `supabase/deploy.sql` または `supabase/migration_web_push_notifications.sql` を適用する
- Web Push の鍵は `npx web-push generate-vapid-keys` で生成する
- `/api/cron/push-reminders` を 5 分おき程度で叩く cron を設定する
- Vercel Cron を使う場合は `CRON_SECRET` を設定すると、Vercel が自動で `Authorization: Bearer ...` を付ける
- Vercel の 2026-01-28 時点の公式仕様では Hobby は日次 cron のみ。5 分おきで送るなら Pro 以上か外部 scheduler が必要

## ドキュメント

- `CONSTITUTION.md` — 開発原則
- `docs/development-governance.md` — 開発運用ルール
- `docs/core-experience-spec.md` — UX 仕様
- `docs/logic-data-spec.md` — 技術仕様
- `docs/ui-spec.md` — UI 仕様
