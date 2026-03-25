# Supabase セットアップ

## 概要

KeepGoing は Supabase をバックエンドに使用。DB スキーマの管理は SQL ファイルで行い、Supabase SQL Editor にコピペして実行する。

## 初期セットアップ（新規プロジェクト）

1. Supabase でプロジェクトを作成
2. `schema.sql` を SQL Editor で実行（空 DB のブートストラップ）
3. `deploy.sql` を SQL Editor で実行（権限、関数、RLS、カラム追加など）

## 既存環境の更新

`deploy.sql` は冪等（何回実行しても安全）。既存環境のスキーマ更新にはこれを使う。

`schema.sql` は空 DB 向けなので、既存環境には流さない。

## マイグレーションファイル

個別マイグレーションは `deploy.sql` に統合済みのものが多い。以下は参考用の実行順序:

| # | ファイル | 内容 |
|---|---------|------|
| 1 | `deploy.sql` | 基盤（user_roles, 関数, RLS, カラム追加） |
| 2 | `migration_2025_0227.sql` | 初期マイグレーション |
| 3 | `migration_user_roles.sql` | ロール管理 |
| 4 | `migration_teacher_menus.sql` | 先生メニュー |
| 5 | `migration_exercise_placement.sql` | 種目配置 |
| 6 | `migration_public_exercises.sql` | 公開種目 |
| 7 | `migration_teacher_exercise_metadata.sql` | 先生：種目メタデータ |
| 8 | `migration_teacher_menu_metadata.sql` | 先生：メニューメタデータ |
| 9 | `migration_teacher_content_display_mode.sql` | コンテンツ表示モード |
| 10 | `migration_teacher_item_overrides_display_mode.sql` | アイテム上書き表示モード |
| 11 | `migration_challenge_v2a.sql` | チャレンジ v2a |
| 12 | `migration_menu_challenge_v2b.sql` | メニューチャレンジ v2b |
| 13 | `migration_challenge_rolling_v3.sql` | ローリングチャレンジ v3 |
| 14 | `migration_personal_challenges_v4.sql` | 個人チャレンジ v4 |
| 15 | `migration_challenge_duration_v5.sql` | チャレンジ期間 v5 |
| 16 | `migration_challenge_publish_v6.sql` | チャレンジ公開 v6 |
| 17 | `migration_challenge_retry_v7.sql` | チャレンジリトライ v7 |
| 18 | `migration_challenge_attempts_v8.sql` | チャレンジ試行 v8 |
| 19 | `migration_developer.sql` | 開発者ロール |
| 20 | `migration_menu_inline_items.sql` | メニューインラインアイテム |
| 21 | `migration_public_menu_items.sql` | 公開メニューアイテム |
| 22 | `migration_public_content_source_links.sql` | 公開コンテンツソースリンク |

すべてのマイグレーションは冪等（`IF NOT EXISTS`, `ON CONFLICT DO NOTHING` 等）で、再実行しても安全。

## 注意

- `deploy.sql` に主要なマイグレーション内容が統合されているため、通常は `deploy.sql` の実行だけで十分
- 個別マイグレーションファイルは履歴・参照用として残している
