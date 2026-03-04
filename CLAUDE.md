# KeepGoing - Claude Development Guide

## Overview
バレエ教室向けストレッチ・トレーニング管理PWA。日本語UI。
子供たちが毎日ストレッチを楽しく続けられるよう「ふわふわ」というペットキャラクターが成長するゲーミフィケーション要素がある。
先生が生徒のメニューをカスタマイズできるダッシュボード、家族で複数ユーザーを管理できるアカウントシステムを持つ。

## Tech Stack
- **Frontend**: React 19 + TypeScript 5.9 + Vite
- **State**: Zustand 5（localStorage永続化 + バージョンマイグレーション）
- **Styling**: インラインstyle中心（Noto Sans JP統一）、Tailwind CSS 4は一部のみ
- **Animation**: Framer Motion
- **Backend**: Supabase（PostgreSQL + Auth + RLS）
- **PWA**: vite-plugin-pwa（Service Worker自動更新）
- **Audio**: Web Audio API + SpeechSynthesis（日本語TTS）
- **Icons**: Lucide React

## Commands
```bash
npm run dev      # 開発サーバー (port 5173)
npm run build    # tsc -b && vite build
npx tsc --noEmit # 型チェックのみ
```

## Directory Structure
```
src/
├── App.tsx                  # ルート（テーマ検出: 昼/夕）
├── main.tsx                 # エントリ
├── layouts/MainLayout.tsx   # タブナビゲーション (home/record/menu/settings)
├── pages/                   # 各ページ（lazy load）
│   ├── HomeScreen.tsx       # ホーム（ふわふわ表示）
│   ├── MenuPage.tsx         # メニュー管理
│   ├── StretchSession.tsx   # セッション実行画面
│   ├── TeacherDashboard.tsx # 先生ダッシュボード
│   ├── teacher-dashboard/   # 先生UI（MenuSettingsSection等）
│   └── menu/                # メニュー関連コンポーネント
├── components/              # 共有コンポーネント
│   ├── fuwafuwa/           # ペットアニメーション
│   ├── ConfirmDeleteModal   # 汎用削除確認モーダル
│   └── ExerciseIcon等
├── contexts/
│   └── AuthContext.tsx      # 認証 + 同期コーディネーション
├── store/
│   └── useAppStore.ts       # メインストア（use-app-store/配下で定義）
├── lib/
│   ├── supabase.ts          # Supabaseクライアント初期化
│   ├── sync/                # 双方向オフライン同期システム
│   ├── audio.ts             # 音声・TTS
│   ├── fuwafuwa.ts          # ペット成長ロジック
│   ├── teacherContent.ts    # 先生の種目/メニューCRUD
│   ├── teacherMenuSettings.ts # クラスごと表示設定
│   └── teacherItemOverrides.ts # ビルトイン項目の上書き
└── data/
    ├── exercises.ts         # マスター種目データ（12種目）
    └── menuGroups.ts        # プリセットメニュー（5グループ）
```

## Architecture Patterns

### State Management
- `useAppStore` (Zustand) がアプリ全体の状態を管理
- localStorage永続化、バージョンマイグレーション付き (`store/use-app-store/migrate.ts`)
- 型定義: `store/use-app-store/types.ts`

### Offline-First Sync
- `lib/sync/` で双方向Supabase同期を実装
- IndexedDBキューでオフライン変更を蓄積、オンライン復帰時にpush
- コンフリクト検知: ローカルとクラウド両方に変更がある場合ユーザーに選択させる

### Teacher System
- `teacher_menu_settings`: クラスレベルごとの種目/メニュー表示設定（必須/おまかせ/除外/非表示）
- `teacher_item_overrides`: ビルトイン種目/メニューの全項目上書き（名前、説明、emoji、時間、切替、種目リスト）
- `teacher_exercises` / `teacher_menus`: 先生が作成したカスタム種目/メニュー
- エディター: `TeacherExerciseEditor`, `TeacherMenuEditor`（createPortalでフルスクリーン）
- カードUI: `MenuSettingsItemCard`（展開でクラストグル + [ためす][編集][削除]）

### Fuwafuwa Pet
- 28日ライフサイクル: 卵→妖精(2日)→大人(7日)→さよなら(29日目)
- 10種類のペットタイプ
- `lib/fuwafuwa.ts` で成長ロジック管理

### Class Levels
`先生 | プレ | 初級 | 中級 | 上級 | その他` (`data/exercises.ts`のCLASS_LEVELS)

## Coding Conventions

### スタイリング
- **インラインstyle**を主に使用（CSS-in-JS風）
- フォント: `fontFamily: "'Noto Sans JP', sans-serif"` 統一
- カラー: `#2D3436`(テキスト), `#2BBAA0`(プライマリ/緑), `#E17055`(危険/赤), `#8B5CF6`(紫), `#8395A7`(グレー)
- borderRadius: 10〜20px
- `className="card"` でカードスタイル（グローバルCSS）

### コンポーネント
- モーダル/エディター: `createPortal(jsx, document.body)` でbodyにマウント
- アニメーション: `framer-motion` の `motion.div`, `AnimatePresence`
- アイコン: `lucide-react` から個別import

### 型
- 明示的な型定義を使用（`interface` 推奨）
- Supabaseの型: `lib/supabase-types.ts`

### 日本語
- UI文字列はJSX内にハードコード（i18nなし）
- ひらがな中心（子供向け）

## Database (Supabase)
- スキーマ定義: `supabase/deploy.sql`
- DB変更時: deploy.sqlに追記 → Supabaseで実行
- RLS有効、`is_teacher()` 関数でアクセス制御
- 主要テーブル: `app_settings`, `teacher_exercises`, `teacher_menus`, `teacher_menu_settings`, `teacher_item_overrides`, `public_menus`, `public_exercises`

## Environment Variables
```
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
```

## タスク管理
- セッション開始時に `.claude/tasks/TASKS.md` の未完了タスクを確認し報告すること
- タスク完了時は `.claude/tasks/DONE.md` に移動すること
- `/todo` コマンドでタスクの追加・完了・一覧が可能
- `/cleanup` コマンドで DONE.md / MEMORY.md / CLAUDE.md の肥大化を整理

## Common Workflows

### 新しい種目を追加
1. `src/data/exercises.ts` の `EXERCISES` 配列に追加
2. 必要ならプリセットメニューの `exerciseIds` を更新

### 新しいDB テーブル追加
1. `supabase/deploy.sql` にCREATE TABLE追記
2. `src/lib/` に対応するCRUD関数作成
3. Supabaseダッシュボードで deploy.sql を実行

### Zustand stateに新フィールド追加
1. `src/store/use-app-store/types.ts` に型追加
2. `src/store/use-app-store/createState.ts` に初期値・アクション追加
3. クラウド同期が必要なら `src/lib/sync/` のmappers/push/pullを更新
4. `src/store/use-app-store/migrate.ts` にマイグレーション追加
