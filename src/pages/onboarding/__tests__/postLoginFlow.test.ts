import { describe, expect, it } from 'vitest';
import { shouldFinishOnboardingAfterLogin } from '../postLoginFlow';

describe('shouldFinishOnboardingAfterLogin', () => {
    it('finishes immediately when a sign-in restored an existing account with no child profiles', () => {
        expect(shouldFinishOnboardingAfterLogin({
            authMode: 'signIn',
            onboardingCompleted: false,
            userCount: 0,
        })).toBe(true);
    });

    it('finishes when onboarding was already completed and users exist', () => {
        expect(shouldFinishOnboardingAfterLogin({
            authMode: 'signUp',
            onboardingCompleted: true,
            userCount: 2,
        })).toBe(true);
    });

    it('continues onboarding after sign-up when no child profiles exist yet', () => {
        expect(shouldFinishOnboardingAfterLogin({
            authMode: 'signUp',
            onboardingCompleted: false,
            userCount: 0,
        })).toBe(false);
    });
});
