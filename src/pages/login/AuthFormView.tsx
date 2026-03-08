import React from 'react';
import { Chrome, Lock, Mail } from 'lucide-react';
import { SyncAccountGuideCard } from '../../components/SyncAccountGuideCard';
import { LoginBackButton } from './LoginBackButton';

interface AuthFormViewProps {
    isSignUp: boolean;
    email: string;
    password: string;
    error: string | null;
    loading: boolean;
    onBack: () => void;
    onSubmit: (event: React.FormEvent) => void;
    onGoogleLogin: () => void;
    onEmailChange: (email: string) => void;
    onPasswordChange: (password: string) => void;
    onToggleMode: () => void;
}

export const AuthFormView: React.FC<AuthFormViewProps> = ({
    isSignUp,
    email,
    password,
    error,
    loading,
    onBack,
    onSubmit,
    onGoogleLogin,
    onEmailChange,
    onPasswordChange,
    onToggleMode,
}) => {
    return (
        <div style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            padding: '0 20px',
        }}>
            <LoginBackButton onBack={onBack} />

            <div style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                gap: 20,
                paddingTop: 20,
                paddingBottom: 100,
            }}>
                <div style={{ textAlign: 'center' }}>
                    <h2 style={{ fontSize: 20, fontWeight: 600, margin: '0 0 8px' }}>
                        {isSignUp ? 'アカウント作成' : 'ログイン'}
                    </h2>
                    <p style={{ color: '#8395A7', fontSize: 13, margin: 0, lineHeight: 1.5 }}>
                        この端末のデータを残したまま<br />ほかの端末でも使えるようにします
                    </p>
                </div>

                <SyncAccountGuideCard compact />

                <button
                    onClick={onGoogleLogin}
                    disabled={loading}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                        padding: '12px 16px',
                        borderRadius: 12,
                        border: '1px solid rgba(0,0,0,0.12)',
                        background: 'white',
                        fontSize: 15,
                        fontWeight: 500,
                        cursor: 'pointer',
                        color: '#333',
                    }}
                >
                    <Chrome size={18} />
                    Google でログイン
                </button>

                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    color: '#CCC',
                    fontSize: 12,
                }}>
                    <div style={{ flex: 1, height: 1, background: '#EEE' }} />
                    <span>または</span>
                    <div style={{ flex: 1, height: 1, background: '#EEE' }} />
                </div>

                <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '14px 18px',
                        borderRadius: 14,
                        border: '1px solid rgba(0,0,0,0.08)',
                        background: '#F8F9FA',
                    }}>
                        <Mail size={16} color="#8395A7" />
                        <input
                            type="email"
                            placeholder="メールアドレス"
                            aria-label="メールアドレス"
                            value={email}
                            onChange={(event) => onEmailChange(event.target.value)}
                            required
                            autoComplete="email"
                            style={{
                                flex: 1,
                                border: 'none',
                                outline: 'none',
                                fontSize: 15,
                                background: 'transparent',
                            }}
                        />
                    </div>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '14px 18px',
                        borderRadius: 14,
                        border: '1px solid rgba(0,0,0,0.08)',
                        background: '#F8F9FA',
                    }}>
                        <Lock size={16} color="#8395A7" />
                        <input
                            type="password"
                            placeholder="パスワード"
                            aria-label="パスワード"
                            value={password}
                            onChange={(event) => onPasswordChange(event.target.value)}
                            required
                            minLength={6}
                            autoComplete={isSignUp ? 'new-password' : 'current-password'}
                            style={{
                                flex: 1,
                                border: 'none',
                                outline: 'none',
                                fontSize: 15,
                                background: 'transparent',
                            }}
                        />
                    </div>

                    {error && (
                        <p style={{ color: '#E74C3C', fontSize: 13, margin: 0 }}>{error}</p>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            padding: '12px 16px',
                            borderRadius: 14,
                            border: 'none',
                            background: loading ? '#DFE6E9' : '#2BBAA0',
                            color: loading ? '#B2BEC3' : 'white',
                            fontSize: 15,
                            fontWeight: 600,
                            cursor: loading ? 'not-allowed' : 'pointer',
                        }}
                    >
                        {loading ? '...' : isSignUp ? 'アカウントを作成' : 'ログイン'}
                    </button>
                </form>

                <button
                    onClick={onToggleMode}
                    style={{
                        background: 'none',
                        border: 'none',
                        color: '#2BBAA0',
                        fontSize: 14,
                        cursor: 'pointer',
                        textAlign: 'center',
                    }}
                >
                    {isSignUp ? 'すでにアカウントをお持ちの方' : 'アカウントを新規作成'}
                </button>
            </div>
        </div>
    );
};
