import type { AuthError } from '@supabase/supabase-js';
import type { EmailAuthMode } from './types';

type AuthPhase = 'send_email' | 'verify_code' | 'google';

interface AuthErrorContext {
    phase: AuthPhase;
    mode?: EmailAuthMode;
}

function extractMessage(error: unknown): string {
    if (!error) return '';
    if (typeof error === 'string') return error;
    if (typeof error === 'object' && error !== null && 'message' in error) {
        return String(error.message ?? '');
    }
    return String(error);
}

function extractCode(error: unknown): string | undefined {
    if (typeof error === 'object' && error !== null && 'code' in error && error.code) {
        return String(error.code);
    }
    return undefined;
}

function defaultMessage({ phase, mode }: AuthErrorContext): string {
    if (phase === 'verify_code') {
        return '確認コードを確かめられませんでした。もう一度お試しください。';
    }

    if (phase === 'google') {
        return 'Google で続けられませんでした。メールの確認コードをお試しください。';
    }

    return mode === 'signIn'
        ? 'ログイン用メールを送れませんでした。もう一度お試しください。'
        : '確認メールを送れませんでした。もう一度お試しください。';
}

export function getAuthErrorMessage(
    error: AuthError | Error | string | null | undefined,
    context: AuthErrorContext,
): string {
    if (!error) {
        return defaultMessage(context);
    }

    const code = extractCode(error);
    const message = extractMessage(error);
    const normalized = message.toLowerCase();

    switch (code) {
    case 'user_not_found':
        return context.mode === 'signIn'
            ? 'このメールアドレスはまだ登録されていません。アカウント作成を選んでください。'
            : 'このメールアドレスでは続けられません。';
    case 'user_already_exists':
    case 'email_exists':
        return context.mode === 'signUp'
            ? 'すでに登録されています。ログインを選んでください。'
            : 'このメールアドレスは登録ずみです。ログインを選んでください。';
    case 'otp_expired':
        return '確認コードの有効期限が切れています。もう一度メールを送ってください。';
    case 'invalid_credentials':
        return context.phase === 'verify_code'
            ? '確認コードが正しくありません。もう一度入力してください。'
            : 'メールアドレスを確認してください。';
    case 'over_request_rate_limit':
    case 'over_email_send_rate_limit':
        return '短時間に送りすぎました。少し待ってからもう一度お試しください。';
    case 'request_timeout':
        return '通信が混み合っています。少し待ってからもう一度お試しください。';
    case 'email_provider_disabled':
        return 'メールログインは現在使えません。';
    case 'provider_disabled':
        return context.phase === 'google'
            ? 'Google ログインは現在使えません。メールの確認コードをお試しください。'
            : '現在この方法では続けられません。';
    case 'email_address_invalid':
        return 'メールアドレスの形式を確認してください。';
    default:
        break;
    }

    if (normalized.includes('expired') && (normalized.includes('otp') || normalized.includes('code') || normalized.includes('token'))) {
        return '確認コードの有効期限が切れています。もう一度メールを送ってください。';
    }

    if ((normalized.includes('invalid') || normalized.includes('incorrect')) &&
        (normalized.includes('otp') || normalized.includes('code') || normalized.includes('token'))) {
        return '確認コードが正しくありません。もう一度入力してください。';
    }

    if (normalized.includes('network') || normalized.includes('fetch')) {
        return '通信できませんでした。電波のよい場所で、もう一度お試しください。';
    }

    return defaultMessage(context);
}
