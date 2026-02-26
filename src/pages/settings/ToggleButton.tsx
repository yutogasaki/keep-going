import React from 'react';
import { motion } from 'framer-motion';

interface ToggleButtonProps {
    enabled: boolean;
    onToggle: () => void;
    color: string;
}

export const ToggleButton: React.FC<ToggleButtonProps> = ({ enabled, onToggle, color }) => (
    <button
        onClick={onToggle}
        style={{
            width: 44,
            height: 24,
            borderRadius: 12,
            background: enabled ? color : '#DFE6E9',
            border: 'none',
            position: 'relative',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            padding: 2,
            transition: 'background 0.3s ease',
            flexShrink: 0,
        }}
    >
        <motion.div
            animate={{ x: enabled ? 20 : 0 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            style={{
                width: 20,
                height: 20,
                borderRadius: '50%',
                background: 'white',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            }}
        />
    </button>
);
