import React, { useState } from 'react';
import { Cloud, CloudOff, LogOut, Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { LoginPage } from '../LoginPage';

export const AccountSection: React.FC = () => {
    const { user, isSyncing, signOut } = useAuth();
    const [showLogin, setShowLogin] = useState(false);

    if (showLogin) {
        return <LoginPage onBack={() => setShowLogin(false)} />;
    }

    if (user) {
        // Logged in state
        return (
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
        );
    }

    // Not logged in
    return (
        <div className="card" style={{ padding: '0', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <CloudOff size={16} color="#8395A7" />
                    <span style={{ fontSize: 14, fontWeight: 600 }}>アカウント</span>
                </div>
            </div>
            <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                <p style={{ fontSize: 13, color: '#8395A7', margin: 0, lineHeight: 1.5 }}>
                    ログインするとデータがクラウドにバックアップされます。
                    ログインしなくてもアプリは使えます。
                </p>
                <button
                    onClick={() => setShowLogin(true)}
                    style={{
                        padding: '10px 16px',
                        borderRadius: 10,
                        border: 'none',
                        background: '#2BBAA0',
                        color: 'white',
                        fontSize: 14,
                        fontWeight: 600,
                        cursor: 'pointer',
                    }}
                >
                    ログイン / アカウント作成
                </button>
            </div>
        </div>
    );
};
