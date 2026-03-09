import { describe, expect, it } from 'vitest';
import { getAuthErrorMessage } from '../authErrorMessages';

describe('getAuthErrorMessage', () => {
    it('maps sign-in missing user errors to a clear next step', () => {
        expect(getAuthErrorMessage(
            { message: 'User not found', code: 'user_not_found' } as never,
            { phase: 'send_email', mode: 'signIn' },
        )).toBe('このメールアドレスはまだ登録されていません。アカウント作成を選んでください。');
    });

    it('maps expired otp errors to a resend instruction', () => {
        expect(getAuthErrorMessage(
            { message: 'OTP expired', code: 'otp_expired' } as never,
            { phase: 'verify_code', mode: 'signIn' },
        )).toBe('確認コードの有効期限が切れています。もう一度メールを送ってください。');
    });

    it('falls back to a Japanese network message for fetch failures', () => {
        expect(getAuthErrorMessage(
            new Error('Failed to fetch'),
            { phase: 'google' },
        )).toBe('通信できませんでした。電波のよい場所で、もう一度お試しください。');
    });
});
