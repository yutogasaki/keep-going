import React, { useEffect, useState } from 'react';
import { Cloud, LogIn, LogOut, Loader2, UserPlus } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { SyncAccountGuideCard } from '../../components/SyncAccountGuideCard';
import { LoginPage } from '../LoginPage';
import type { EmailAuthMode } from '../../contexts/auth/types';

export const AccountSection: React.FC = () => {
    const { user, isAnonymous, isSyncing, signOut, setLoginContext } = useAuth();
    const [showLogin, setShowLogin] = useState(false);
    const [authMode, setAuthMode] = useState<EmailAuthMode>('signIn');

    useEffect(() => {
        if (showLogin && user && !user.is_anonymous) {
            setShowLogin(false);
        }
    }, [showLogin, user]);

    if (showLogin) {
        return (
            <div
                style={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: 100,
                    background: 'linear-gradient(165deg, #FFF5F0 0%, #E8F8F0 100%)',
                    overflow: 'auto',
                }}
            >
                <LoginPage
                    onBack={() => {
                        setLoginContext(null);
                        setShowLogin(false);
                    }}
                    onLoginSuccess={() => setShowLogin(false)}
                    initialMode={authMode}
                />
            </div>
        );
    }

    const isRealAccount = user && !isAnonymous;

    return (
        <>
            {isRealAccount ? (
                // Real account (logged in with email/Google)
                <div className="card" style={{ padding: '0', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Cloud size={16} color="#2BBAA0" />
                            <span style={{ fontSize: 14, fontWeight: 600 }}>アカウント</span>
                        </div>
                    </div>
                    <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div>
                                <div style={{ fontSize: 14, color: '#333' }}>{user.email}</div>
                                <div style={{ fontSize: 12, color: '#8395A7', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                                    {isSyncing ? (
                                        <>
                                            <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} />
                                            同期中...
                                        </>
                                    ) : (
                                        <>
                                            <Cloud size={12} />
                                            クラウド同期 ON
                                        </>
                                    )}
                                </div>
                            </div>
                            <button
                                onClick={() => signOut()}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 4,
                                    padding: '8px 12px',
                                    borderRadius: 8,
                                    border: '1px solid rgba(0,0,0,0.08)',
                                    background: 'white',
                                    fontSize: 13,
                                    color: '#8395A7',
                                    cursor: 'pointer',
                                }}
                            >
                                <LogOut size={14} />
                                ログアウト
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                // Anonymous user or no Supabase
                <div className="card" style={{ padding: '0', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Cloud size={16} color={isAnonymous ? '#2BBAA0' : '#8395A7'} />
                            <span style={{ fontSize: 14, fontWeight: 600 }}>アカウント</span>
                        </div>
                    </div>
                    <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {isAnonymous ? (
                            <div style={{ fontSize: 12, color: '#8395A7', display: 'flex', alignItems: 'center', gap: 4 }}>
                                <Cloud size={12} />
                                データは自動で保存されています
                            </div>
                        ) : (
                            <p style={{ fontSize: 13, color: '#8395A7', margin: 0, lineHeight: 1.5 }}>
                                ログインするとデータがクラウドにバックアップされます。
                            </p>
                        )}
                        <SyncAccountGuideCard compact />
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                            <button
                                onClick={() => {
                                    setLoginContext('settings');
                                    setAuthMode('signIn');
                                    setShowLogin(true);
                                }}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 6,
                                    padding: '11px 14px',
                                    borderRadius: 12,
                                    border: '1px solid rgba(43, 186, 160, 0.18)',
                                    background: 'rgba(255,255,255,0.95)',
                                    color: '#1E7F6D',
                                    fontSize: 14,
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                }}
                            >
                                <LogIn size={16} />
                                ログイン
                            </button>
                            <button
                                onClick={() => {
                                    setLoginContext('settings');
                                    setAuthMode('signUp');
                                    setShowLogin(true);
                                }}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 6,
                                    padding: '11px 14px',
                                    borderRadius: 12,
                                    border: 'none',
                                    background: '#2BBAA0',
                                    color: 'white',
                                    fontSize: 14,
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                }}
                            >
                                <UserPlus size={16} />
                                アカウント作成
                            </button>
                        </div>
                        {isAnonymous && (
                            <p style={{ fontSize: 11, color: '#B2BEC3', margin: 0, lineHeight: 1.4 }}>
                                先に作成しておくと、機種変更やホーム画面追加でも引きつぎしやすくなります
                            </p>
                        )}
                    </div>
                </div>
            )}
        </>
    );
};
