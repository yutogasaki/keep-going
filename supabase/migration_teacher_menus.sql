-- ─── 先生メニュー設定 ─────────────────────────────────

-- クラス別の必須/おまかせ/除外設定
CREATE TABLE teacher_menu_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id TEXT NOT NULL,
    item_type TEXT NOT NULL CHECK (item_type IN ('exercise', 'menu_group')),
    class_level TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'optional' CHECK (status IN ('required', 'optional', 'excluded')),
    created_by TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (item_id, item_type, class_level)
);

ALTER TABLE teacher_menu_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read teacher_menu_settings" ON teacher_menu_settings
    FOR SELECT USING (true);
CREATE POLICY "Teachers can manage teacher_menu_settings" ON teacher_menu_settings
    FOR ALL USING (is_teacher()) WITH CHECK (is_teacher());

CREATE INDEX idx_teacher_menu_settings_class
    ON teacher_menu_settings (class_level, item_type);

CREATE TRIGGER teacher_menu_settings_updated_at
    BEFORE UPDATE ON teacher_menu_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── 先生が作ったオリジナル種目 ──────────────────────

CREATE TABLE teacher_exercises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    sec INT NOT NULL DEFAULT 30,
    emoji TEXT NOT NULL DEFAULT '🌸',
    has_split BOOLEAN DEFAULT false,
    description TEXT,
    class_levels TEXT[] NOT NULL DEFAULT '{}',
    created_by TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE teacher_exercises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read teacher_exercises" ON teacher_exercises
    FOR SELECT USING (true);
CREATE POLICY "Teachers can manage teacher_exercises" ON teacher_exercises
    FOR ALL USING (is_teacher()) WITH CHECK (is_teacher());

-- ─── 先生が作ったセットメニュー ──────────────────────

CREATE TABLE teacher_menus (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    emoji TEXT NOT NULL DEFAULT '📋',
    description TEXT,
    exercise_ids JSONB NOT NULL DEFAULT '[]',
    class_levels TEXT[] NOT NULL DEFAULT '{}',
    created_by TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE teacher_menus ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read teacher_menus" ON teacher_menus
    FOR SELECT USING (true);
CREATE POLICY "Teachers can manage teacher_menus" ON teacher_menus
    FOR ALL USING (is_teacher()) WITH CHECK (is_teacher());
