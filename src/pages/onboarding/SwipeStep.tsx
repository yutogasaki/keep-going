import React from 'react';
import { motion } from 'framer-motion';

interface SwipeStepProps {
    onFinish: () => void;
}

export const SwipeStep: React.FC<SwipeStepProps> = ({ onFinish }) => {
    return (
        <motion.div
            key="swipe"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.5 }}
            style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 24,
                padding: '0 32px',
                maxWidth: 360,
                textAlign: 'center',
                width: '100%',
            }}
        >
            <h2
                style={{
                    fontFamily: "'Noto Sans JP', sans-serif",
                    fontSize: 22,
                    fontWeight: 700,
                    color: '#2D3436',
                }}
            >
                つかいかた
            </h2>

            <div
                style={{
                    width: '100%',
                    height: 200,
                    borderRadius: 24,
                    background: 'var(--glass-bg)',
                    backdropFilter: 'blur(var(--blur-md))',
                    WebkitBackdropFilter: 'blur(var(--blur-md))',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 12,
                    border: '2px dashed rgba(43, 186, 160, 0.3)',
                }}
            >
                <div style={{ textAlign: 'center' }}>
                    <span style={{ fontSize: 48 }}>🎉</span>
                    <p
                        style={{
                            fontFamily: "'Noto Sans JP', sans-serif",
                            fontSize: 16,
                            fontWeight: 700,
                            color: '#2BBAA0',
                            marginTop: 8,
                        }}
                    >
                        準備完了！
                    </p>
                </div>
            </div>

            <div
                style={{
                    fontFamily: "'Noto Sans JP', sans-serif",
                    fontSize: 16,
                    fontWeight: 700,
                    color: '#8395A7',
                    lineHeight: 1.8,
                    textAlign: 'center',
                    marginTop: 32,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 16,
                }}
            >
                <p>
                    準備ができたら<br />このボタンを押してスタート！
                </p>

                <motion.div
                    animate={{ y: [0, 10, 0] }}
                    transition={{ duration: 1, repeat: Infinity }}
                    style={{ color: '#2BBAA0' }}
                >
                    ↓
                </motion.div>

                <button
                    onClick={onFinish}
                    style={{
                        width: 72,
                        height: 72,
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #2BBAA0 0%, #1A937D 100%)',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 8px 32px rgba(43, 186, 160, 0.4), inset 0 2px 0 rgba(255,255,255,0.3)',
                        transform: 'scale(1)',
                        transition: 'transform 0.2s',
                    }}
                    onPointerDown={(event) => {
                        event.currentTarget.style.transform = 'scale(0.95)';
                    }}
                    onPointerUp={(event) => {
                        event.currentTarget.style.transform = 'scale(1)';
                    }}
                    onPointerLeave={(event) => {
                        event.currentTarget.style.transform = 'scale(1)';
                    }}
                >
                    <div
                        style={{
                            width: 0,
                            height: 0,
                            borderTop: '12px solid transparent',
                            borderBottom: '12px solid transparent',
                            borderLeft: '18px solid white',
                            marginLeft: 6,
                        }}
                    />
                </button>
            </div>
        </motion.div>
    );
};
