import { getExercisesByClass, type ClassLevel } from './exercises';
import type { ExercisePlacement } from './exercisePlacement';
import type { TeacherContentDisplayMode, TeacherMenuVisibility } from '../lib/teacherExerciseMetadata';

export interface MenuGroupExerciseRefItem {
    id: string;
    kind: 'exercise_ref';
    exerciseId: string;
}

export interface MenuGroupInlineItem {
    id: string;
    kind: 'inline_only';
    name: string;
    sec: number;
    emoji: string;
    placement: ExercisePlacement;
    internal: string;
    reading?: string;
    description?: string;
}

export type MenuGroupItem = MenuGroupExerciseRefItem | MenuGroupInlineItem;

export interface MenuGroup {
    id: string;
    name: string;
    emoji: string;
    description: string;
    exerciseIds: string[];
    items?: MenuGroupItem[];
    isPreset: boolean;
    creatorId?: string; // If undefined, it's a family shared menu
    origin?: 'builtin' | 'teacher';
    visibility?: TeacherMenuVisibility;
    focusTags?: string[];
    recommended?: boolean;
    recommendedOrder?: number | null;
    displayMode?: TeacherContentDisplayMode;
}

// ─── Preset Groups ───────────────────────────────────
export const PRESET_GROUPS: MenuGroup[] = [
    {
        id: 'preset-quick',
        name: '今日の3分',
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
        exerciseIds: ['S07', 'S04', 'R02', 'C01', 'R02', 'C02', 'R02', 'C01'],
        isPreset: true,
    },
    {
        id: 'preset-all',
        name: '全部やる',
        emoji: '⭐',
        description: 'いろんな種目をひととおりやるしっかりメニュー',
        exerciseIds: ['S07', 'S01', 'S03', 'S02', 'S05', 'S06', 'S08', 'S04', 'S10', 'C01', 'C02'],
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

export function buildMenuGroupItemsFromExerciseIds(exerciseIds: string[]): MenuGroupItem[] {
    return exerciseIds.map((exerciseId) => ({
        id: exerciseId,
        kind: 'exercise_ref',
        exerciseId,
    }));
}

export function getMenuGroupItems(group: Pick<MenuGroup, 'exerciseIds' | 'items'>): MenuGroupItem[] {
    if (Array.isArray(group.items) && group.items.length > 0) {
        return group.items;
    }

    return buildMenuGroupItemsFromExerciseIds(group.exerciseIds);
}

export function getMenuGroupItemIds(group: Pick<MenuGroup, 'exerciseIds' | 'items'>): string[] {
    return getMenuGroupItems(group).map((item) => item.id);
}

export function hasInlineMenuItems(group: Pick<MenuGroup, 'exerciseIds' | 'items'>): boolean {
    return getMenuGroupItems(group).some((item) => item.kind === 'inline_only');
}
