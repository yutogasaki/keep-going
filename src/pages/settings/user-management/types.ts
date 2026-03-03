import type { ClassLevel } from '../../../data/exercises';
import type { UserProfileStore } from '../../../store/useAppStore';

export type NewUserInput = Omit<UserProfileStore, 'id' | 'dailyTargetMinutes' | 'excludedExercises' | 'requiredExercises'>;

export interface UserEditorValues {
    name: string;
    classLevel: ClassLevel;
}
