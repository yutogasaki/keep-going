import React from 'react';
import { motion } from 'framer-motion';

export const StretchLoadingScreen: React.FC = () => (
    <div style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        background: 'linear-gradient(165deg, #FFD5C8 0%, #B8E6D4 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    }}>
        <span style={{ fontFamily: "'Noto Sans JP', sans-serif", fontSize: 16, color: '#2D3436' }}>
            準備中...
        </span>
    </div>
);

interface StretchNoExercisesScreenProps {
    onBack: () => void;
}

export const StretchNoExercisesScreen: React.FC<StretchNoExercisesScreenProps> = ({ onBack }) => (
    <div style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        background: 'linear-gradient(165deg, #FFD5C8 0%, #B8E6D4 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
    }}>
        <span style={{ fontFamily: "'Noto Sans JP', sans-serif", fontSize: 16, color: '#2D3436' }}>
            種目が見つかりませんでした
        </span>
        <button
            onClick={onBack}
            style={{
                padding: '12px 24px',
                borderRadius: 99,
                border: 'none',
                background: 'white',
                fontFamily: "'Noto Sans JP', sans-serif",
                fontWeight: 700,
                cursor: 'pointer',
            }}
        >
            もどる
        </button>
    </div>
);

interface StretchCompletionScreenProps {
    totalRunningTime: number;
}

export const StretchCompletionScreen: React.FC<StretchCompletionScreenProps> = ({ totalRunningTime }) => {
    const minutes = Math.floor(totalRunningTime / 60);

    return (
        <div className="stretch-session">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 16,
                    background: 'linear-gradient(165deg, #E8F8F0 0%, #FFE5D9 100%)',
                }}
            >
                <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                    style={{ fontSize: 64 }}
                >
                    🌸
                </motion.span>
                <h2 style={{
                    fontFamily: "'Noto Sans JP', sans-serif",
                    fontSize: 28,
                    fontWeight: 700,
                    color: '#2D3436',
                }}>
                    おつかれさま
                </h2>
                <p style={{
                    fontFamily: "'Noto Sans JP', sans-serif",
                    fontSize: 14,
                    color: '#8395A7',
                }}>
                    {minutes > 0 ? `${minutes}分がんばったね` : 'がんばったね'}
                </p>
            </motion.div>
        </div>
    );
};
