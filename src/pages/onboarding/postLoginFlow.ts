import type { EmailAuthMode } from '../../contexts/auth/types';

interface PostLoginFlowParams {
    authMode: EmailAuthMode;
    onboardingCompleted: boolean;
    userCount: number;
}

export function shouldFinishOnboardingAfterLogin({
    authMode,
    onboardingCompleted,
    userCount,
}: PostLoginFlowParams): boolean {
    if (onboardingCompleted && userCount > 0) {
        return true;
    }

    return authMode === 'signIn';
}
