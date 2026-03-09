import type { TeacherExercise } from '../../../lib/teacherContent';
import type { TeacherExerciseVisibility } from '../../../lib/teacherExerciseMetadata';
import type { MenuSettingStatus } from '../../../lib/teacherMenuSettings';

export interface UseMenuSettingsControllerParams {
    teacherEmail: string;
}

export interface DeleteTarget {
    id: string;
    type: 'exercise' | 'menu';
    name: string;
}

export interface ExerciseEditorValues {
    name: string;
    sec: number;
    emoji: string;
    placement: TeacherExercise['placement'];
    hasSplit: boolean;
    description: string;
    classLevels: string[];
    visibility: TeacherExerciseVisibility;
    focusTags: string[];
    recommended: boolean;
    recommendedOrder: number | null;
    statusByClass?: Record<string, MenuSettingStatus>;
}

export interface MenuEditorValues {
    name: string;
    emoji: string;
    description: string;
    exerciseIds: string[];
    classLevels: string[];
    statusByClass?: Record<string, MenuSettingStatus>;
}
