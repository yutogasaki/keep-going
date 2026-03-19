import type { Challenge, ChallengeCompletion, ChallengeRewardGrant } from '../../lib/challenges';
import type { TeacherExercise } from '../../lib/teacherContent';
import type { ChallengeRewardScene } from '../../pages/home/challengeRewardUtils';

export interface ChallengeCardProps {
    challenge: Challenge;
    completions: ChallengeCompletion[];
    rewardGrants: ChallengeRewardGrant[];
    teacherExercises?: TeacherExercise[];
    onCompleted: () => void;
    onRewardGranted?: (scene: ChallengeRewardScene) => void;
    expired?: boolean;
}
