import type { Challenge, ChallengeCompletion, ChallengeRewardGrant } from '../../lib/challenges';
import type { TeacherExercise } from '../../lib/teacherContent';

export interface ChallengeCardProps {
    challenge: Challenge;
    completions: ChallengeCompletion[];
    rewardGrants: ChallengeRewardGrant[];
    teacherExercises?: TeacherExercise[];
    onCompleted: () => void;
    expired?: boolean;
}
