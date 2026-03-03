import React from 'react';
import { Chrome, Lock, Mail } from 'lucide-react';
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
                        ログインするとデータがクラウドに<br />バックアップされます
                    </p>
                </div>

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
                        padding: '10px 14px',
                        borderRadius: 10,
                        border: '1px solid rgba(0,0,0,0.12)',
                        background: 'white',
                    }}>
                        <Mail size={16} color="#8395A7" />
                        <input
                            type="email"
                            placeholder="メールアドレス"
                            value={email}
                            onChange={(event) => onEmailChange(event.target.value)}
                            required
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
                        padding: '10px 14px',
                        borderRadius: 10,
                        border: '1px solid rgba(0,0,0,0.12)',
                        background: 'white',
                    }}>
                        <Lock size={16} color="#8395A7" />
                        <input
                            type="password"
                            placeholder="パスワード"
                            value={password}
                            onChange={(event) => onPasswordChange(event.target.value)}
                            required
                            minLength={6}
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
                            borderRadius: 12,
                            border: 'none',
                            background: '#2BBAA0',
                            color: 'white',
                            fontSize: 15,
                            fontWeight: 600,
                            cursor: loading ? 'not-allowed' : 'pointer',
                            opacity: loading ? 0.7 : 1,
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
