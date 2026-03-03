import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';

type MilestoneModalState = 'egg' | 'fairy' | 'adult' | null;

interface HomeMilestoneModalProps {
    activeMilestoneModal: MilestoneModalState;
    onClose: () => void;
}

export const HomeMilestoneModal: React.FC<HomeMilestoneModalProps> = ({
    activeMilestoneModal,
    onClose,
}) => {
    return (
        <AnimatePresence>
            {activeMilestoneModal && (
                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        backgroundColor: 'rgba(0,0,0,0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 100,
                        padding: 24,
                    }}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: -20 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        style={{
                            width: '100%',
                            maxWidth: 320,
                            textAlign: 'center',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: 16,
                            padding: 32,
                            background: 'white',
                            borderRadius: 24,
                            boxShadow: '0 16px 48px rgba(0,0,0,0.1)',
                        }}
                    >
                        <span style={{ fontSize: 64 }}>
                            {activeMilestoneModal === 'egg' ? '🥚' : activeMilestoneModal === 'fairy' ? '🧚' : '🌟'}
                        </span>
                        <h2 style={{ fontFamily: "'Noto Sans JP', sans-serif", fontSize: 24, margin: 0, color: '#2D3436' }}>
                            {activeMilestoneModal === 'egg' ? 'たまごが やってきた！' :
                                activeMilestoneModal === 'fairy' ? 'たまごが かえった！' : 'おおきく そだったね！'}
                        </h2>
                        <p style={{ fontFamily: "'Noto Sans JP', sans-serif", fontSize: 14, color: '#8395A7', lineHeight: 1.6, margin: 0 }}>
                            {activeMilestoneModal === 'egg' ? 'これから、あなたと一緒に頑張るパートナーだよ。大切に育ててね！' :
                                activeMilestoneModal === 'fairy' ? '毎日の頑張りで、妖精の姿になったよ！これからもよろしくね！' : '毎日の頑張りで、立派な大人の姿に成長したよ！ここまで続けてこれてすごいね！'}
                        </p>
                        <button
                            onClick={onClose}
                            style={{
                                marginTop: 16,
                                width: '100%',
                                padding: '14px',
                                borderRadius: 99,
                                border: 'none',
                                background: '#2BBAA0',
                                color: 'white',
                                fontFamily: "'Noto Sans JP', sans-serif",
                                fontSize: 16,
                                fontWeight: 'bold',
                                cursor: 'pointer',
                            }}
                        >
                            わかった！
                        </button>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
