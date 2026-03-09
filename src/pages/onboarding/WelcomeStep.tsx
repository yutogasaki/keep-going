import React from 'react';
import { motion } from 'framer-motion';
import { COLOR, FONT } from '../../lib/styles';

interface WelcomeStepProps {
    onNext: () => void;
}

export const WelcomeStep: React.FC<WelcomeStepProps> = ({ onNext }) => {
    return (
        <motion.div
            key="welcome"
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
            }}
        >
            <motion.div
                animate={{ rotate: [0, -5, 5, -3, 0] }}
                transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 1 }}
            >
                <img
                    src="/icon.png"
                    alt="KeepGoing"
                    style={{
                        width: 120,
                        height: 120,
                        borderRadius: 40,
                        objectFit: 'cover',
                    }}
                />
            </motion.div>

            <h1
                style={{
                    fontFamily: FONT.heading,
                    fontSize: 32,
                    fontWeight: 800,
                    color: COLOR.dark,
                }}
            >
                KeepGoing
            </h1>
            <p
                style={{
                    fontFamily: FONT.body,
                    fontSize: 15,
                    color: COLOR.muted,
                    lineHeight: 1.8,
                }}
            >
                ログインするか そのままはじめるか
                <br />
                えらんだら、すぐにじゅんびできるよ。
            </p>

            <button
                onClick={onNext}
                style={{
                    marginTop: 16,
                    padding: '14px 48px',
                    borderRadius: 9999,
                    border: 'none',
                    background: COLOR.primary,
                    color: 'white',
                    fontFamily: FONT.body,
                    fontSize: 16,
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 4px 16px rgba(43, 186, 160, 0.35)',
                }}
            >
                はじめる
            </button>
        </motion.div>
    );
};
