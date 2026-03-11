import type { FC } from 'react';
import { motion } from 'framer-motion';

interface FuwafuwaSilentCueProps {
    onTap?: () => void;
}

export const FuwafuwaSilentCue: FC<FuwafuwaSilentCueProps> = ({ onTap }) => (
    <button
        type="button"
        onClick={onTap}
        aria-label="ふわふわが こっちを みてる"
        style={{
            minHeight: 74,
            minWidth: 120,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'transparent',
            border: 'none',
            cursor: onTap ? 'pointer' : 'default',
            padding: 0,
        }}
    >
        <div
            aria-hidden="true"
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                opacity: 0.36,
            }}
        >
            {[0, 1, 2].map((index) => (
                <motion.span
                    key={index}
                    animate={{ y: [0, -3, 0], opacity: [0.28, 0.68, 0.28] }}
                    transition={{
                        duration: 1.8,
                        repeat: Infinity,
                        ease: 'easeInOut',
                        delay: index * 0.18,
                    }}
                    style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: 'rgba(43, 186, 160, 0.48)',
                        boxShadow: '0 0 12px rgba(43, 186, 160, 0.14)',
                    }}
                />
            ))}
        </div>
    </button>
);
