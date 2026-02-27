-- ============================================================
-- KeepGoing マイグレーション 2025-02-27
-- Supabase Dashboard > SQL Editor で実行してください
-- ============================================================

-- ─── 1. family_members に新カラム追加 ────────────────────────

ALTER TABLE family_members ADD COLUMN IF NOT EXISTS avatar_url text;
ALTER TABLE family_members ADD COLUMN IF NOT EXISTS chibifuwas jsonb NOT NULL DEFAULT '[]';

-- ─── 2. challenges テーブル ──────────────────────────────────

CREATE TABLE IF NOT EXISTS challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  exercise_id text NOT NULL,
  target_count int NOT NULL,
  start_date text NOT NULL,
  end_date text NOT NULL,
  created_by text NOT NULL,
  reward_fuwafuwa_type int NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- ─── 3. challenge_completions テーブル ───────────────────────

CREATE TABLE IF NOT EXISTS challenge_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id uuid REFERENCES challenges NOT NULL,
  account_id uuid REFERENCES auth.users NOT NULL,
  member_id uuid NOT NULL,
  completed_at timestamptz DEFAULT now(),
  UNIQUE(challenge_id, account_id, member_id)
);

-- ─── 4. public_menus テーブル ────────────────────────────────

CREATE TABLE IF NOT EXISTS public_menus (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  emoji text NOT NULL,
  description text,
  exercise_ids jsonb NOT NULL DEFAULT '[]',
  author_name text NOT NULL,
  account_id uuid REFERENCES auth.users NOT NULL,
  download_count int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- ─── 5. インデックス ─────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_challenges_dates ON challenges (start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_challenge_completions_account ON challenge_completions (account_id);
CREATE INDEX IF NOT EXISTS idx_public_menus_downloads ON public_menus (download_count DESC);

-- ─── 6. RLS 有効化 ──────────────────────────────────────────

ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public_menus ENABLE ROW LEVEL SECURITY;

-- ─── 7. 先生判定関数 ──────────────────────────────────────────
-- RLS ポリシーで使用。既に存在する場合は上書き。

CREATE OR REPLACE FUNCTION is_teacher()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT coalesce(
    (SELECT email FROM auth.users WHERE id = auth.uid()) = ANY(ARRAY[
      'yu.togasaki@gmail.com',
      'ayami.ballet.studio@gmail.com'
    ]),
    false
  );
$$;

-- ─── 8. RLS ポリシー: challenges ─────────────────────────────
-- 全ユーザーが読める、先生だけが作成・削除できる

CREATE POLICY "Anyone can read challenges" ON challenges
  FOR SELECT USING (true);

CREATE POLICY "Teachers can manage challenges" ON challenges
  FOR ALL USING (is_teacher()) WITH CHECK (is_teacher());

-- ─── 9. RLS ポリシー: challenge_completions ──────────────────
-- ユーザーは自分のデータのみ、先生は全員分を読める

CREATE POLICY "Users can manage own completions" ON challenge_completions
  FOR ALL USING (auth.uid() = account_id) WITH CHECK (auth.uid() = account_id);

CREATE POLICY "Teachers can read all completions" ON challenge_completions
  FOR SELECT USING (is_teacher());

-- ─── 10. RLS ポリシー: public_menus ─────────────────────────
-- 全員が読める、自分のメニューだけ書き込み・削除可

CREATE POLICY "Anyone can read public menus" ON public_menus
  FOR SELECT USING (true);

CREATE POLICY "Users can manage own public menus" ON public_menus
  FOR ALL USING (auth.uid() = account_id) WITH CHECK (auth.uid() = account_id);

-- ─── 11. RPC関数: increment_download_count ───────────────────

CREATE OR REPLACE FUNCTION increment_download_count(menu_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE public_menus SET download_count = download_count + 1 WHERE id = menu_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 完了！以下の手動設定も忘れずに:
-- 1. Storage > New Bucket > "avatars" (Public) を作成
-- 2. Storage > avatars > Policies で以下を設定:
--    - INSERT: authenticated users (path = auth.uid()::text || '/%')
--    - SELECT: public (バケットが Public なら自動)
--    - DELETE: authenticated users (path = auth.uid()::text || '/%')
-- 3. Authentication > Providers > Anonymous Sign-Ins を ON
-- ============================================================
