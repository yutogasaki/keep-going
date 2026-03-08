import { CLASS_LEVELS, EXERCISES } from '../../../data/exercises';
import type { TeacherExercise } from '../../../lib/teacherContent';
import type { MenuSettingStatus } from '../../../lib/teacherMenuSettings';

export interface TeacherEditorStatusOption {
    status: MenuSettingStatus;
    bg: string;
    color: string;
    label: string;
}

export interface MenuEditorExerciseOption {
    id: string;
    name: string;
    emoji: string;
    sec: number;
    isTeacher: boolean;
}

export function buildDefaultStatusByClass(
    initialStatuses?: Record<string, MenuSettingStatus>,
): Record<string, MenuSettingStatus> {
    if (initialStatuses) {
        return { ...initialStatuses };
    }

    const defaults: Record<string, MenuSettingStatus> = {};
    for (const classLevel of CLASS_LEVELS) {
        defaults[classLevel.id] = 'optional';
    }
    return defaults;
}

export function deriveVisibleClassLevels(statusByClass: Record<string, MenuSettingStatus>): string[] {
    return Object.entries(statusByClass)
        .filter(([, status]) => status !== 'hidden')
        .map(([classLevel]) => classLevel);
}

export function buildMenuEditorExercises(teacherExercises: TeacherExercise[]): MenuEditorExerciseOption[] {
    return [
        ...EXERCISES.map((exercise) => ({
            id: exercise.id,
            name: exercise.name,
            emoji: exercise.emoji,
            sec: exercise.sec,
            isTeacher: false,
        })),
        ...teacherExercises.map((exercise) => ({
            id: exercise.id,
            name: exercise.name,
            emoji: exercise.emoji,
            sec: exercise.sec,
            isTeacher: true,
        })),
    ];
}
