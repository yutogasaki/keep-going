import React from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, Chrome, Mail } from 'lucide-react';
import { SyncAccountGuideCard } from '../../components/SyncAccountGuideCard';

interface AccountStepProps {
    restoreError: string | null;
    onGoogleLogin: () => void;
    onEmailLogin: () => void;
    onSkip: () => void;
    onBack: () => void;
}

export const AccountStep: React.FC<AccountStepProps> = ({
    restoreError,
    onGoogleLogin,
    onEmailLogin,
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
                    fontSize: 22,
                    fontWeight: 700,
                    color: '#2D3436',
                }}
            >
                ほごしゃの かたへ
            </h2>
            <p
                style={{
                    fontFamily: "'Noto Sans JP', sans-serif",
                    fontSize: 13,
                    color: '#8395A7',
                    lineHeight: 1.6,
                    marginTop: -4,
                }}
            >
                ログインすると データをひきついだり
                <br />
                クラウドにほぞんできます
            </p>

            <SyncAccountGuideCard />

            {restoreError && (
                <p
                    style={{
                        fontSize: 13,
                        color: '#E74C3C',
                        margin: 0,
                    }}
                >
                    {restoreError}
                </p>
            )}

            <button
                onClick={onGoogleLogin}
                style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    padding: '14px 16px',
                    borderRadius: 14,
                    border: '1px solid rgba(0,0,0,0.1)',
                    background: 'white',
                    fontSize: 15,
                    fontWeight: 600,
                    fontFamily: "'Noto Sans JP', sans-serif",
                    cursor: 'pointer',
                    color: '#333',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                }}
            >
                <Chrome size={18} />
                Google でログイン
            </button>

            <button
                onClick={onEmailLogin}
                style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    padding: '14px 16px',
                    borderRadius: 14,
                    border: '1px solid rgba(0,0,0,0.1)',
                    background: 'white',
                    fontSize: 15,
                    fontWeight: 600,
                    fontFamily: "'Noto Sans JP', sans-serif",
                    cursor: 'pointer',
                    color: '#333',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                }}
            >
                <Mail size={18} />
                メールでログイン
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
                    width: '100%',
                    padding: '14px 16px',
                    borderRadius: 14,
                    border: 'none',
                    background: 'rgba(0,0,0,0.04)',
                    fontSize: 15,
                    fontWeight: 600,
                    fontFamily: "'Noto Sans JP', sans-serif",
                    cursor: 'pointer',
                    color: '#8395A7',
                }}
            >
                ログインせずに始める
            </button>
            <p
                style={{
                    fontFamily: "'Noto Sans JP', sans-serif",
                    fontSize: 11,
                    color: '#B2BEC3',
                    marginTop: -8,
                }}
            >
                あとから設定で つなげられます
            </p>
        </motion.div>
    );
};
