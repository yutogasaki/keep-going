import type { ClassLevel } from './exerciseCatalog';

interface AutoStartProfile {
    requiredExerciseIds: string[];
}

const AUTO_START_PROFILES: Record<ClassLevel, AutoStartProfile> = {
    '先生': {
        requiredExerciseIds: ['S07', 'S02', 'S01', 'S03', 'S05', 'S10', 'C01'],
    },
    'プレ': {
        requiredExerciseIds: ['S07', 'S01', 'S02', 'S05', 'S06', 'S08'],
    },
    '初級': {
        requiredExerciseIds: ['S07', 'S02', 'S01', 'S03', 'S05', 'S10'],
    },
    '中級': {
        requiredExerciseIds: ['S07', 'S02', 'S01', 'S03', 'S05', 'S10', 'C01'],
    },
    '上級': {
        requiredExerciseIds: ['S07', 'S02', 'S01', 'S03', 'S05', 'S10', 'C01'],
    },
    'その他': {
        requiredExerciseIds: ['S07', 'S02', 'S01', 'S03', 'S05', 'S10'],
    },
};

export function getAutoStartProfile(classLevel: ClassLevel): AutoStartProfile {
    return AUTO_START_PROFILES[classLevel] ?? AUTO_START_PROFILES['初級'];
}

export function getAutoStartRequiredExerciseIds(classLevel: ClassLevel): string[] {
    return [...getAutoStartProfile(classLevel).requiredExerciseIds];
}
