import React from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

export const RestoringStep: React.FC = () => {
    return (
        <motion.div
            key="restoring"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.5 }}
            style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 20,
                padding: '0 32px',
                maxWidth: 360,
                textAlign: 'center',
            }}
        >
            <Loader2
                size={40}
                color="#2BBAA0"
                style={{ animation: 'spin 1s linear infinite' }}
            />
            <p
                style={{
                    fontFamily: "'Noto Sans JP', sans-serif",
                    fontSize: 16,
                    fontWeight: 600,
                    color: '#2D3436',
                }}
            >
                データを復元しています...
            </p>
        </motion.div>
    );
};
