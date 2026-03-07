import { getExercisesByClass, type ClassLevel } from './exercises';

export interface MenuGroup {
    id: string;
    name: string;
    emoji: string;
    description: string;
    exerciseIds: string[];
    isPreset: boolean;
    creatorId?: string; // If undefined, it's a family shared menu
}

// ─── Preset Groups ───────────────────────────────────
export const PRESET_GROUPS: MenuGroup[] = [
    {
        id: 'preset-basic',
        name: '基本ストレッチ',
        emoji: '🌸',
        description: 'まいにちの基本メニュー',
        exerciseIds: ['S01', 'S02', 'S05', 'S06', 'S07', 'S08', 'S04', 'S01', 'S02', 'S05', 'S06', 'S08'],
        isPreset: true,
    },
    {
        id: 'preset-splits',
        name: '開脚じゅうてん',
        emoji: '🦵',
        description: '開脚をしっかりやるメニュー',
        exerciseIds: ['S01', 'S03', 'S02', 'S01', 'S03', 'S02', 'S05', 'S01', 'S03'],
        isPreset: true,
    },
    {
        id: 'preset-core',
        name: '体幹つよくなる',
        emoji: '💪',
        description: '体幹とバランスを強化',
        exerciseIds: ['C01', 'C02', 'S04', 'C01', 'C02', 'S04', 'C01', 'S06', 'C02'],
        isPreset: true,
    },
    {
        id: 'preset-ballet',
        name: 'バレエのまえに',
        emoji: '🩰',
        description: 'レッスン前のウォームアップ',
        exerciseIds: ['S07', 'S01', 'S03', 'S05', 'S10', 'S06', 'S02', 'S07', 'S01', 'S03'],
        isPreset: true,
    },
    {
        id: 'preset-all',
        name: 'ぜんぶやる！',
        emoji: '⭐',
        description: '全種目をひととおり',
        exerciseIds: ['S01', 'S02', 'S03', 'S04', 'S05', 'S06', 'S07', 'S08', 'S10', 'C01', 'C02'],
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
