import React from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, LogIn, UserPlus } from 'lucide-react';
import { SyncAccountGuideCard } from '../../components/SyncAccountGuideCard';

interface AccountStepProps {
    restoreError: string | null;
    onLogin: () => void;
    onCreateAccount: () => void;
    onSkip: () => void;
    onBack: () => void;
}

const buttonBaseStyle: React.CSSProperties = {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: '15px 16px',
    borderRadius: 16,
    fontSize: 15,
    fontWeight: 700,
    fontFamily: "'Noto Sans JP', sans-serif",
    cursor: 'pointer',
};

export const AccountStep: React.FC<AccountStepProps> = ({
    restoreError,
    onLogin,
    onCreateAccount,
    onSkip,
    onBack,
}) => {
    return (
        <motion.div
            key="account"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.5 }}
            style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 16,
                padding: '0 32px',
                maxWidth: 360,
                width: '100%',
                textAlign: 'center',
            }}
        >
            <button
                onClick={onBack}
                style={{
                    alignSelf: 'flex-start',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: 0,
                    background: 'none',
                    border: 'none',
                    color: '#8395A7',
                    fontSize: 14,
                    fontFamily: "'Noto Sans JP', sans-serif",
                    cursor: 'pointer',
                }}
            >
                <ChevronLeft size={18} />
                もどる
            </button>

            <h2
                style={{
                    fontFamily: "'Noto Sans JP', sans-serif",
                    fontSize: 24,
                    fontWeight: 700,
                    color: '#2D3436',
                    margin: 0,
                }}
            >
                さいしょに えらんでね
            </h2>

            <p
                style={{
                    fontFamily: "'Noto Sans JP', sans-serif",
                    fontSize: 13,
                    color: '#8395A7',
                    lineHeight: 1.7,
                    margin: 0,
                }}
            >
                先にログインやアカウント作成をしておくと、
                <br />
                あとで名前やクラスが消えません。
            </p>

            <SyncAccountGuideCard />

            {restoreError && (
                <p
                    style={{
                        fontSize: 13,
                        color: '#E74C3C',
                        margin: 0,
                        lineHeight: 1.6,
                    }}
                >
                    {restoreError}
                </p>
            )}

            <button
                onClick={onLogin}
                style={{
                    ...buttonBaseStyle,
                    border: 'none',
                    background: 'linear-gradient(135deg, #2BBAA0 0%, #238F7B 100%)',
                    color: 'white',
                    boxShadow: '0 8px 20px rgba(43, 186, 160, 0.22)',
                }}
            >
                <LogIn size={18} />
                ログインする
            </button>

            <button
                onClick={onCreateAccount}
                style={{
                    ...buttonBaseStyle,
                    border: '1px solid rgba(43, 186, 160, 0.18)',
                    background: 'rgba(255,255,255,0.92)',
                    color: '#1E7F6D',
                    boxShadow: '0 3px 10px rgba(0,0,0,0.04)',
                }}
            >
                <UserPlus size={18} />
                アカウントを作る
            </button>

            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    width: '100%',
                    color: '#CCC',
                    fontSize: 12,
                    margin: '4px 0',
                }}
            >
                <div style={{ flex: 1, height: 1, background: '#DDD' }} />
                <span style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>または</span>
                <div style={{ flex: 1, height: 1, background: '#DDD' }} />
            </div>

            <button
                onClick={onSkip}
                style={{
                    ...buttonBaseStyle,
                    border: 'none',
                    background: 'rgba(0,0,0,0.04)',
                    color: '#8395A7',
                }}
            >
                そのまま始める
            </button>

            <p
                style={{
                    fontFamily: "'Noto Sans JP', sans-serif",
                    fontSize: 11,
                    color: '#B2BEC3',
                    marginTop: -8,
                }}
            >
                アカウントはあとからでもつなげられます
            </p>
        </motion.div>
    );
};
