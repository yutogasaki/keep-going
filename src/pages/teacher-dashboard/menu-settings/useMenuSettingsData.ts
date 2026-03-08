import { useCallback, useEffect, useState } from 'react';
import {
    fetchAllTeacherItemOverrides,
    type TeacherItemOverride,
} from '../../../lib/teacherItemOverrides';
import {
    fetchAllTeacherMenuSettings,
    type TeacherMenuSetting,
} from '../../../lib/teacherMenuSettings';
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
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadAll = useCallback(async () => {
        setLoading(true);
        try {
            const [nextSettings, nextTeacherExercises, nextTeacherMenus, nextOverrides] = await Promise.all([
                fetchAllTeacherMenuSettings(true),
                fetchTeacherExercises(true),
                fetchTeacherMenus(true),
                fetchAllTeacherItemOverrides(true),
            ]);
            setSettings(nextSettings);
            setTeacherExercises(nextTeacherExercises);
            setTeacherMenus(nextTeacherMenus);
            setOverrides(nextOverrides);
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
