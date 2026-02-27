import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { UserAvatar } from './UserAvatar';

export const CurrentContextBadge: React.FC = () => {
    const sessionUserIds = useAppStore(state => state.sessionUserIds);
    const users = useAppStore(state => state.users);
    const setSessionUserIds = useAppStore(state => state.setSessionUserIds);

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

    const handleCycleContext = () => {
        if (users.length <= 1) return; // Cannot cycle if 1 or 0 users

        // Define the cycle order: User 0 -> User 1 -> ... -> Together -> User 0
        const swipePages = [...users];
        if (users.length >= 2) {
            swipePages.push({ id: 'TOGETHER', name: 'みんなで！', classLevel: '初級' } as any);
        }

        // Find current index
        let currentIndex = 0;
        if (isTogetherMode) {
            currentIndex = swipePages.findIndex(p => p.id === 'TOGETHER');
        } else {
            currentIndex = swipePages.findIndex(p => p.id === sessionUserIds[0]);
        }

        // Next index
        const nextIndex = (currentIndex + 1) % swipePages.length;
        const nextPage = swipePages[nextIndex];

        if (nextPage.id === 'TOGETHER') {
            setSessionUserIds(users.map(u => u.id));
        } else {
            setSessionUserIds([nextPage.id]);
        }
    };

    return (
        <AnimatePresence>
            <motion.div
                onClick={handleCycleContext}
                initial={{ opacity: 0, scale: 0.9, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -10 }}
                whileTap={{ scale: 0.95 }}
                style={{
                    background: 'rgba(255, 255, 255, 0.9)',
                    backdropFilter: 'blur(8px)',
                    padding: '6px 14px',
                    borderRadius: 20,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    border: '1px solid rgba(0,0,0,0.05)',
                    cursor: users.length > 1 ? 'pointer' : 'default',
                    pointerEvents: 'auto'
                }}
            >
                {isTogetherMode ? (
                    <Users size={14} color="#0984E3" />
                ) : (
                    <UserAvatar
                        avatarUrl={users.find(u => u.id === sessionUserIds[0])?.avatarUrl}
                        name={displayText}
                        size={20}
                    />
                )}
                <span style={{
                    fontFamily: "'Noto Sans JP', sans-serif",
                    fontSize: 13,
                    fontWeight: 700,
                    color: isTogetherMode ? '#0984E3' : '#2BBAA0',
                    userSelect: 'none'
                }}>
                    {displayText}
                </span>
            </motion.div>
        </AnimatePresence>
    );
};
