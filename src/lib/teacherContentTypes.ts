import type { ExercisePlacement } from '@/data/exercisePlacement';
import type {
    TeacherContentDisplayMode,
    TeacherExerciseVisibility,
    TeacherMenuVisibility,
} from './teacherExerciseMetadata';

export interface TeacherExercise {
    id: string;
    name: string;
    sec: number;
    emoji: string;
    placement: ExercisePlacement;
    hasSplit: boolean;
    description: string;
    classLevels: string[];
    visibility: TeacherExerciseVisibility;
    focusTags: string[];
    recommended: boolean;
    recommendedOrder: number | null;
    displayMode: TeacherContentDisplayMode;
    createdBy: string;
    createdAt: string;
}

export interface TeacherMenu {
    id: string;
    name: string;
    emoji: string;
    description: string;
    exerciseIds: string[];
    classLevels: string[];
    visibility: TeacherMenuVisibility;
    focusTags: string[];
    recommended: boolean;
    recommendedOrder: number | null;
    displayMode: TeacherContentDisplayMode;
    createdBy: string;
    createdAt: string;
}
