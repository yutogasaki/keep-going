import type { Challenge, ChallengeCompletion } from '../../lib/challenges';
import type { TeacherExercise } from '../../lib/teacherContent';

export interface ChallengeCardProps {
    challenge: Challenge;
    completions: ChallengeCompletion[];
    teacherExercises?: TeacherExercise[];
    onCompleted: () => void;
    expired?: boolean;
}
