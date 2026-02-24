import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, User } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

export const CurrentContextBadge: React.FC = () => {
    const sessionUserIds = useAppStore(state => state.sessionUserIds);
    const users = useAppStore(state => state.users);

    const isTogetherMode = sessionUserIds.length > 1;

    let displayText = '';
    if (isTogetherMode) {
        displayText = 'みんなで！';
    } else if (sessionUserIds.length === 1) {
        const user = users.find(u => u.id === sessionUserIds[0]);
        displayText = user?.name || 'ゲスト';
    } else {
        return null; // Don't show if no users are selected
    }

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -10 }}
                style={{
                    position: 'absolute',
                    top: 16,
                    right: 20,
                    zIndex: 40,
                    background: 'rgba(255, 255, 255, 0.9)',
                    backdropFilter: 'blur(8px)',
                    padding: '6px 14px',
                    borderRadius: 20,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    border: '1px solid rgba(0,0,0,0.05)',
                    pointerEvents: 'none' // Let clicks pass through if needed, just a status indicator
                }}
            >
                {isTogetherMode ? (
                    <Users size={14} color="#0984E3" />
                ) : (
                    <User size={14} color="#2BBAA0" />
                )}
                <span style={{
                    fontFamily: "'Noto Sans JP', sans-serif",
                    fontSize: 13,
                    fontWeight: 700,
                    color: isTogetherMode ? '#0984E3' : '#2BBAA0'
                }}>
                    {displayText}
                </span>
            </motion.div>
        </AnimatePresence>
    );
};
