import type { Exercise } from '../../../data/exercises';
import type { CustomExercise } from '../../../lib/db';

export interface MenuIndividualTabProps {
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
}
