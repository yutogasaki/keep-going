import type { Exercise } from '../../../data/exercises';
import type { ExercisePlacement } from '../../../data/exercisePlacement';
import type { CustomExercise } from '../../../lib/db';
import type { PublicExercise } from '../../../lib/publicExercises';
import type { MenuUsageStats } from '../menu-page/useMenuUsageStats';

export interface IndividualSelectionProps {
    selectionMode?: boolean;
    selectedIds?: Set<string>;
    onToggleSelect?: (exerciseId: string) => void;
}

export interface MenuIndividualTabProps {
    usageStats: MenuUsageStats;
    exercises: Exercise[];
    requiredExercises: string[];
    customExercises: CustomExercise[];
    isTogetherMode: boolean;
    getCreatorName: (creatorId?: string) => string | null;
    onStartExercise: (exerciseId: string) => void;
    onEditCustomExercise: (exercise: CustomExercise) => void;
    onDeleteCustomExercise: (exerciseId: string) => void;
    onStartCustomExercise: (exerciseId: string) => void;
    onCreateCustomExercise: () => void;
    teacherExerciseIds?: Set<string>;
    isNewTeacherContent?: (id: string) => boolean;
    canPublish?: boolean;
    findPublishedExercise?: (exercise: CustomExercise) => PublicExercise | undefined;
    onPublishExercise?: (exercise: CustomExercise) => void;
    onUnpublishExercise?: (exercise: CustomExercise) => void;
    onOpenPublicExerciseBrowser?: () => void;
    focusCategory?: ExercisePlacement | null;
    focusRequestId?: number;
}
