import React from 'react';
import { motion } from 'framer-motion';
import { DISPLAY_TERMS } from '../../../lib/terminology';
import { IndividualSectionHeading } from './IndividualSectionHeading';

interface PublicExerciseSectionProps {
    onOpenPublicExerciseBrowser: () => void;
}

export const PublicExerciseSection: React.FC<PublicExerciseSectionProps> = ({
    onOpenPublicExerciseBrowser,
}) => {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 16 }}>
            <IndividualSectionHeading>{DISPLAY_TERMS.publicExercise}</IndividualSectionHeading>
            <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={onOpenPublicExerciseBrowser}
                className="card"
                style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                    padding: '16px 20px',
                    border: 'none',
                    background: 'white',
                    cursor: 'pointer',
                    textAlign: 'left',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                }}
            >
                <div
                    style={{
                        width: 44,
                        height: 44,
                        borderRadius: 14,
                        background: 'linear-gradient(135deg, #E8F4FD, #BEE3F8)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        boxShadow: '0 2px 8px rgba(190, 227, 248, 0.5)',
                    }}
                >
                    <span style={{ fontSize: 22 }}>🌍</span>
                </div>
                <div style={{ flex: 1 }}>
                    <div
                        style={{
                            fontFamily: "'Noto Sans JP', sans-serif",
                            fontSize: 15,
                            fontWeight: 700,
                            color: '#2D3436',
                            marginBottom: 4,
                        }}
                    >
                        {DISPLAY_TERMS.publicExercise}を見る
                    </div>
                    <div
                        style={{
                            fontFamily: "'Noto Sans JP', sans-serif",
                            fontSize: 12,
                            color: '#8395A7',
                            lineHeight: 1.4,
                        }}
                    >
                        他の人が作った種目をもらおう
                    </div>
                </div>
            </motion.button>
        </div>
    );
};
