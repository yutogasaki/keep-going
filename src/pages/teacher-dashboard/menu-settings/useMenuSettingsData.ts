import { useCallback, useEffect, useState } from 'react';
import type { MenuGroup } from '../../../data/menuGroups';
import { getCustomGroups } from '../../../lib/customGroups';
import { fetchAllTeacherItemOverrides, type TeacherItemOverride } from '../../../lib/teacherItemOverrides';
import { fetchAllTeacherMenuSettings, type TeacherMenuSetting } from '../../../lib/teacherMenuSettings';
import {
    fetchTeacherExercises,
    fetchTeacherMenus,
    type TeacherExercise,
    type TeacherMenu,
} from '../../../lib/teacherContent';

export function useMenuSettingsData() {
    const [settings, setSettings] = useState<TeacherMenuSetting[]>([]);
    const [overrides, setOverrides] = useState<TeacherItemOverride[]>([]);
    const [teacherExercises, setTeacherExercises] = useState<TeacherExercise[]>([]);
    const [teacherMenus, setTeacherMenus] = useState<TeacherMenu[]>([]);
    const [customGroups, setCustomGroups] = useState<MenuGroup[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadAll = useCallback(async () => {
        setLoading(true);
        try {
            const [nextSettings, nextTeacherExercises, nextTeacherMenus, nextOverrides, nextCustomGroups] =
                await Promise.all([
                    fetchAllTeacherMenuSettings(true),
                    fetchTeacherExercises(true),
                    fetchTeacherMenus(true),
                    fetchAllTeacherItemOverrides(true),
                    getCustomGroups(),
                ]);
            setSettings(nextSettings);
            setTeacherExercises(nextTeacherExercises);
            setTeacherMenus(nextTeacherMenus);
            setOverrides(nextOverrides);
            setCustomGroups(nextCustomGroups);
            setError(null);
        } catch (err) {
            console.warn('[MenuSettings] load failed:', err);
            setError('データの読み込みに失敗しました。Supabase で deploy.sql を実行してテーブルを作成してください。');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadAll();
    }, [loadAll]);

    return {
        customGroups,
        error,
        loadAll,
        loading,
        overrides,
        setError,
        setSettings,
        settings,
        teacherExercises,
        teacherMenus,
    };
}
