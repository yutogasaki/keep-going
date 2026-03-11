import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

interface MagicTankProps {
    currentSeconds: number;
    maxSeconds: number;
    onReset?: () => void; // Optional callback for when the tank is full and tapped
    label?: string;
    fullLabel?: string;
    fullHint?: string;
}

export const MagicTank: React.FC<MagicTankProps> = ({
    currentSeconds,
    maxSeconds,
    onReset,
    label = 'まほうエネルギー',
    fullLabel = 'まほうがいっぱい！✨',
    fullHint = 'ぽんって してみよう',
}) => {
    // Fill percentage capped at 100%
    const fillPercentage = Math.min((currentSeconds / maxSeconds) * 100, 100);
    const isFull = currentSeconds >= maxSeconds;

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 12,
            marginTop: 16,
        }}>
            <div
                onClick={isFull && onReset ? onReset : undefined}
                style={{
                    position: 'relative',
                    width: 60,
                    height: 70,
                    // Crystal bottle shape
                    borderRadius: '30px 30px 16px 16px',
                    background: 'rgba(255, 255, 255, 0.4)',
                    border: '3px solid rgba(255, 255, 255, 0.8)',
                    boxShadow: '0 8px 32px rgba(43, 186, 160, 0.15), inset 0 2px 10px rgba(255, 255, 255, 1)',
                    overflow: 'hidden',
                    backdropFilter: 'blur(8px)',
                    display: 'flex',
                    alignItems: 'flex-end',
                    justifyContent: 'center',
                    cursor: isFull && onReset ? 'pointer' : 'default', // indicate it can be tapped
                    transform: isFull ? 'scale(1.05)' : 'scale(1)',
                    transition: 'transform 0.3s ease',
                }}>
                {/* Bottle Neck overlay */}
                <div style={{
                    position: 'absolute',
                    top: -2,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: 24,
                    height: 12,
                    background: 'rgba(255, 255, 255, 0.7)',
                    borderRadius: '0 0 6px 6px',
                    zIndex: 3
                }} />

                {/* Liquid fill */}
                <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${fillPercentage}%` }}
                    transition={{ type: 'spring', damping: 15, stiffness: 100 }}
                    style={{
                        width: '100%',
                        background: isFull
                            ? 'linear-gradient(180deg, #FFEAA7 0%, #FDCB6E 100%)'
                            : 'linear-gradient(180deg, #A8E6CF 0%, #3AEDC6 100%)',
                        boxShadow: isFull ? '0 -4px 12px rgba(253, 203, 110, 0.6)' : '0 -4px 12px rgba(58, 237, 198, 0.4)',
                        position: 'relative',
                        zIndex: 1,
                        borderRadius: '0 0 12px 12px',
                    }}
                >
                    {/* Surface waves animation */}
                    {fillPercentage > 0 && !isFull && (
                        <motion.div
                            animate={{ x: ['-20%', '0%'] }}
                            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                            style={{
                                position: 'absolute',
                                top: -4,
                                left: 0,
                                width: '200%',
                                height: 8,
                                background: 'rgba(255, 255, 255, 0.4)',
                                borderRadius: '50%',
                            }}
                        />
                    )}
                </motion.div>

                {/* Sparkles when full */}
                {isFull && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: [0.5, 1, 0.5], scale: [0.9, 1.1, 0.9], rotate: [0, 10, -10, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        style={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            zIndex: 2,
                            color: '#FFF',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        <Sparkles size={24} fill="white" />
                    </motion.div>
                )}
            </div>

            {/* Status text */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                    fontFamily: "'Noto Sans JP', sans-serif",
                    fontSize: 13,
                    fontWeight: 700,
                    color: isFull ? '#F39C12' : '#2BBAA0',
                    textAlign: 'center',
                    background: 'var(--glass-bg)',
                    padding: '4px 16px',
                    borderRadius: 20,
                    boxShadow: 'var(--shadow-xs)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 4
                }}
            >
                {isFull ? (
                    <>
                        <span>{fullLabel}</span>
                        {onReset && <span style={{ fontSize: 10, color: '#E67E22', opacity: 0.8 }}>{fullHint}</span>}
                    </>
                ) : (
                    label
                )}
            </motion.div>
        </div>
    );
};
