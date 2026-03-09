import { getExercisesByClass, type ClassLevel } from './exercises';
import type { TeacherMenuVisibility } from '../lib/teacherExerciseMetadata';

export interface MenuGroup {
    id: string;
    name: string;
    emoji: string;
    description: string;
    exerciseIds: string[];
    isPreset: boolean;
    creatorId?: string; // If undefined, it's a family shared menu
    origin?: 'builtin' | 'teacher';
    visibility?: TeacherMenuVisibility;
    focusTags?: string[];
    recommended?: boolean;
    recommendedOrder?: number | null;
}

// ─── Preset Groups ───────────────────────────────────
export const PRESET_GROUPS: MenuGroup[] = [
    {
        id: 'preset-quick',
        name: '今日の3ふん',
        emoji: '☀️',
        description: 'まずはこれ。今日も3分だけやってみよう',
        exerciseIds: ['S07', 'S01', 'S02', 'S06', 'S08'],
        isPreset: true,
    },
    {
        id: 'preset-basic',
        name: '基本ストレッチ',
        emoji: '🌸',
        description: 'まいにちの基本をひととおりやるメニュー',
        exerciseIds: ['S07', 'S01', 'S03', 'S02', 'S05', 'S06', 'S08', 'S04', 'S10'],
        isPreset: true,
    },
    {
        id: 'preset-splits',
        name: '開脚じゅうてん',
        emoji: '🦵',
        description: '開脚をしっかりがんばりたい日に',
        exerciseIds: ['S07', 'S01', 'S03', 'S02', 'S01', 'S10'],
        isPreset: true,
    },
    {
        id: 'preset-core',
        name: '体幹つよくなる',
        emoji: '💪',
        description: '休憩をはさみながら体幹をきたえるメニュー',
        exerciseIds: ['S07', 'S04', 'R02', 'C01', 'R02', 'C02'],
        isPreset: true,
    },
    {
        id: 'preset-ballet',
        name: 'バレエのまえに',
        emoji: '🩰',
        description: 'レッスン前にやりやすい立ち上がりメニュー',
        exerciseIds: ['S07', 'S01', 'S02', 'S03', 'S10'],
        isPreset: true,
    },
];

// Filter preset groups to only include exercises available for the class
export function getPresetsForClass(classLevel: ClassLevel): MenuGroup[] {
    const available = getExercisesByClass(classLevel);
    const availableIds = new Set(available.map(e => e.id));

    return PRESET_GROUPS.map(group => ({
        ...group,
        exerciseIds: group.exerciseIds.filter(id => availableIds.has(id)),
    })).filter(group => group.exerciseIds.length > 0);
}
