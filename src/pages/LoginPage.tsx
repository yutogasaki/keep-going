import React, { useState } from 'react';
import { ArrowLeft, Mail, Lock, Chrome } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface LoginPageProps {
    onBack: () => void;
    onLoginSuccess?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onBack, onLoginSuccess }) => {
    const { signIn, signUp, signInWithGoogle } = useAuth();
    const [isSignUp, setIsSignUp] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [signUpSuccess, setSignUpSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            if (isSignUp) {
                const { error } = await signUp(email, password);
                if (error) {
                    setError(error.message);
                } else {
                    setSignUpSuccess(true);
                }
            } else {
                const { error } = await signIn(email, password);
                if (error) {
                    setError(error.message);
                } else {
                    (onLoginSuccess ?? onBack)();
                }
            }
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setError(null);
        const { error } = await signInWithGoogle();
        if (error) {
            setError(error.message);
        }
    };

    if (signUpSuccess) {
        return (
            <div style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                padding: '0 20px',
            }}>
                <div style={{ padding: '16px 0' }}>
                    <button
                        onClick={onBack}
                        style={{
                            background: 'none',
                            border: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                            color: '#8395A7',
                            cursor: 'pointer',
                            padding: 0,
                            fontSize: 14,
                        }}
                    >
                        <ArrowLeft size={18} />
                        もどる
                    </button>
                </div>
                <div style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 16,
                    paddingBottom: 100,
                }}>
                    <div style={{ fontSize: 48 }}>&#x2709;</div>
                    <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>
                        メールを確認してください
                    </h2>
                    <p style={{ color: '#8395A7', textAlign: 'center', fontSize: 14, lineHeight: 1.6 }}>
                        {email} に確認メールを送りました。<br />
                        メール内のリンクをクリックして登録を完了してください。
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            padding: '0 20px',
        }}>
            <div style={{ padding: '16px 0' }}>
                <button
                    onClick={onBack}
                    style={{
                        background: 'none',
                        border: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        color: '#8395A7',
                        cursor: 'pointer',
                        padding: 0,
                        fontSize: 14,
                    }}
                >
                    <ArrowLeft size={18} />
                    もどる
                </button>
            </div>

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

                {/* Google login */}
                <button
                    onClick={handleGoogleLogin}
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

                {/* Email/password form */}
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
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
                            onChange={(e) => setEmail(e.target.value)}
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
                            onChange={(e) => setPassword(e.target.value)}
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
                    onClick={() => {
                        setIsSignUp(!isSignUp);
                        setError(null);
                    }}
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
