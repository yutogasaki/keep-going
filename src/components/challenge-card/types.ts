import type { Challenge, ChallengeCompletion } from '../../lib/challenges';

export interface ChallengeCardProps {
    challenge: Challenge;
    completions: ChallengeCompletion[];
    onCompleted: () => void;
    expired?: boolean;
}
