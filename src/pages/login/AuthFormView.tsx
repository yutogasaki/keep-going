import React from 'react';
import { Chrome, KeyRound, Mail } from 'lucide-react';
import { PageHeader } from '../../components/PageHeader';
import { ScreenScaffold } from '../../components/ScreenScaffold';
import type { EmailAuthMode } from '../../contexts/auth/types';
import { SCREEN_PADDING_X } from '../../lib/styles';

interface AuthFormViewProps {
    mode: EmailAuthMode;
    email: string;
    code: string;
    error: string | null;
    loading: boolean;
    hasSentEmail: boolean;
    onBack: () => void;
    onStartEmailAuth: (event: React.FormEvent) => void;
    onVerifyCode: (event: React.FormEvent) => void;
    onGoogleLogin: () => void;
    onEmailChange: (email: string) => void;
    onCodeChange: (code: string) => void;
    onToggleMode: () => void;
    onResend: () => void;
    onEditEmail: () => void;
}

const sectionStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: 18,
    width: '100%',
    maxWidth: 420,
    margin: '0 auto',
    padding: `8px ${SCREEN_PADDING_X}px 0`,
    boxSizing: 'border-box',
};

const fieldStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '14px 18px',
    borderRadius: 14,
    border: '1px solid rgba(0,0,0,0.08)',
    background: '#F8F9FA',
};

const primaryButtonStyle = (disabled: boolean): React.CSSProperties => ({
    padding: '13px 16px',
    borderRadius: 14,
    border: 'none',
    background: disabled ? '#DFE6E9' : '#2BBAA0',
    color: disabled ? '#B2BEC3' : 'white',
    fontSize: 15,
    fontWeight: 700,
    cursor: disabled ? 'not-allowed' : 'pointer',
});

const secondaryButtonStyle: React.CSSProperties = {
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
};

const panelStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    padding: '16px 18px',
    borderRadius: 18,
    background: 'rgba(255,255,255,0.88)',
    border: '1px solid rgba(0,0,0,0.06)',
};

export const AuthFormView: React.FC<AuthFormViewProps> = ({
    mode,
    email,
    code,
    error,
    loading,
    hasSentEmail,
    onBack,
    onStartEmailAuth,
    onVerifyCode,
    onGoogleLogin,
    onEmailChange,
    onCodeChange,
    onToggleMode,
    onResend,
    onEditEmail,
}) => {
    const isSignUp = mode === 'signUp';
    const title = isSignUp ? 'アカウント作成' : 'ログイン';
    const subtitle = isSignUp
        ? '先に作っておくと、あとで名前やクラスを入れても消えません'
        : '前のデータをひきつぐときはこちら';

    return (
        <ScreenScaffold
            background="transparent"
            header={(
                <PageHeader
                    title={title}
                    onBack={onBack}
                    showBackLabel
                    background="transparent"
                />
            )}
        >
            <div style={sectionStyle}>
                <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <p style={{ color: '#8395A7', fontSize: 13, margin: 0, lineHeight: 1.6 }}>
                        {subtitle}
                    </p>
                </div>

                {!hasSentEmail ? (
                    <>
                        <button
                            onClick={onGoogleLogin}
                            disabled={loading}
                            style={{
                                ...secondaryButtonStyle,
                                opacity: loading ? 0.6 : 1,
                                cursor: loading ? 'not-allowed' : 'pointer',
                            }}
                        >
                            <Chrome size={18} />
                            Google で続ける
                        </button>

                        <p style={{ color: '#B2BEC3', fontSize: 11, margin: '-6px 0 0', lineHeight: 1.5 }}>
                            Google はブラウザが開きます。iPhone のホーム画面追加では、メールのコード方式のほうが安定します。
                        </p>

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

                        <div style={panelStyle}>
                            <div style={{ fontSize: 14, fontWeight: 700, color: '#2D3436' }}>
                                メールで続ける
                            </div>

                            <form onSubmit={onStartEmailAuth} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                <div style={fieldStyle}>
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

                                <button
                                    type="submit"
                                    disabled={loading || email.trim().length === 0}
                                    style={primaryButtonStyle(loading || email.trim().length === 0)}
                                >
                                    {loading ? '送信中...' : isSignUp ? 'メールを送る' : 'ログイン用メールを送る'}
                                </button>
                            </form>

                            <p style={{ color: '#8395A7', fontSize: 12, margin: 0, lineHeight: 1.6 }}>
                                メールに届く確認コードを、この画面で入力して続けます。
                            </p>
                            {!isSignUp && (
                                <p style={{ color: '#2B7A6A', fontSize: 12, margin: 0, lineHeight: 1.6 }}>
                                    パスワードを忘れていても、メールのコードで入れます。
                                </p>
                            )}
                        </div>
                    </>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        <div
                            style={{
                                padding: '16px 18px',
                                borderRadius: 18,
                                background: 'rgba(43, 186, 160, 0.08)',
                                border: '1px solid rgba(43, 186, 160, 0.14)',
                            }}
                        >
                            <div style={{ fontSize: 14, fontWeight: 700, color: '#1E7F6D' }}>メールを送りました</div>
                            <div style={{ fontSize: 13, color: '#52606D', lineHeight: 1.6, marginTop: 6 }}>
                                {email}
                                <br />
                                メールに届いた確認コードを、この画面の下に入力してください。
                            </div>
                        </div>

                        <form onSubmit={onVerifyCode} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            <div style={fieldStyle}>
                                <KeyRound size={16} color="#8395A7" />
                                <input
                                    type="text"
                                    placeholder="確認コード"
                                    aria-label="確認コード"
                                    value={code}
                                    inputMode="numeric"
                                    autoComplete="one-time-code"
                                    maxLength={8}
                                    onChange={(event) => onCodeChange(event.target.value.replace(/\D/g, '').slice(0, 8))}
                                    style={{
                                        flex: 1,
                                        border: 'none',
                                        outline: 'none',
                                        fontSize: 18,
                                        letterSpacing: '0.28em',
                                        background: 'transparent',
                                    }}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading || code.trim().length < 6}
                                style={primaryButtonStyle(loading || code.trim().length < 6)}
                            >
                                {loading ? '確認中...' : 'コードで続ける'}
                            </button>
                        </form>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            <button
                                onClick={onResend}
                                disabled={loading}
                                style={{
                                    ...secondaryButtonStyle,
                                    opacity: loading ? 0.6 : 1,
                                    cursor: loading ? 'not-allowed' : 'pointer',
                                }}
                            >
                                もう一度送る
                            </button>
                            <button
                                onClick={onEditEmail}
                                disabled={loading}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: '#2BBAA0',
                                    fontSize: 14,
                                    cursor: loading ? 'not-allowed' : 'pointer',
                                    opacity: loading ? 0.6 : 1,
                                }}
                            >
                                メールアドレスを変える
                            </button>
                        </div>
                        {!isSignUp && (
                            <p style={{ color: '#2B7A6A', fontSize: 12, margin: 0, lineHeight: 1.6 }}>
                                前にパスワードで使っていた方も、このメールコードでログインできます。
                            </p>
                        )}
                    </div>
                )}

                {error && (
                    <p style={{ color: '#E74C3C', fontSize: 13, margin: 0, lineHeight: 1.6 }}>{error}</p>
                )}

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
                    {isSignUp ? 'すでに登録ずみの方はこちら' : 'はじめて使うのでアカウントを作る'}
                </button>
            </div>
        </ScreenScaffold>
    );
};
