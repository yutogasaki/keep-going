import React from 'react';
import { motion } from 'framer-motion';
import { FuwafuwaCharacter } from '../../components/FuwafuwaCharacter';
import { MagicTank } from '../../components/MagicTank';
import type { SessionRecord } from '../../lib/db';
import type { UserProfileStore } from '../../store/useAppStore';
import type { PerUserMagic, SwipePage } from './types';

interface FuwafuwaHomeCardProps {
    isTogetherMode: boolean;
    perUserMagic: PerUserMagic[];
    displaySeconds: number;
    targetSeconds: number;
    onTankReset: () => void;
    swipePages: SwipePage[];
    currentPageIndex: number;
    onDragEnd: (_event: unknown, info: { offset: { x: number } }) => void;
    users: UserProfileStore[];
    allSessions: SessionRecord[];
}

export const FuwafuwaHomeCard: React.FC<FuwafuwaHomeCardProps> = ({
    isTogetherMode,
    perUserMagic,
    displaySeconds,
    targetSeconds,
    onTankReset,
    swipePages,
    currentPageIndex,
    onDragEnd,
    users,
    allSessions,
}) => {
    return (
        <div
            style={{
                width: 'calc(100% - 32px)',
                maxWidth: 400,
                background: 'var(--card-bg)',
                backdropFilter: 'blur(var(--blur-md))',
                WebkitBackdropFilter: 'blur(var(--blur-md))',
                borderRadius: 24,
                boxShadow: 'var(--card-shadow)',
                border: 'var(--glass-border)',
                padding: '16px 0 20px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
            }}
        >
            {isTogetherMode ? (
                <div
                    style={{
                        display: 'flex',
                        gap: 16,
                        justifyContent: 'center',
                        alignItems: 'flex-start',
                        marginBottom: 16,
                    }}
                >
                    {perUserMagic.map((userMagic) => (
                        <div
                            key={userMagic.userId}
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                            }}
                        >
                            <div
                                style={{
                                    transform: 'scale(0.75)',
                                    transformOrigin: 'top center',
                                    marginBottom: -33,
                                }}
                            >
                                <MagicTank
                                    currentSeconds={userMagic.displaySeconds}
                                    maxSeconds={userMagic.targetSeconds}
                                    onReset={onTankReset}
                                />
                            </div>
                            <span
                                style={{
                                    fontFamily: "'Noto Sans JP', sans-serif",
                                    fontSize: 11,
                                    fontWeight: 600,
                                    color: '#8395A7',
                                }}
                            >
                                {userMagic.userName}
                            </span>
                        </div>
                    ))}
                </div>
            ) : (
                <div style={{ marginBottom: 8 }}>
                    <MagicTank
                        currentSeconds={displaySeconds}
                        maxSeconds={targetSeconds}
                        onReset={onTankReset}
                    />
                </div>
            )}

            <div style={{ width: '100%', overflow: 'hidden', position: 'relative', flexShrink: 0 }}>
                <motion.div
                    drag="x"
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={0.2}
                    dragDirectionLock
                    onDragEnd={onDragEnd}
                    animate={{ x: `calc(-${currentPageIndex * 100}%)` }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    style={{ display: 'flex', width: '100%', alignItems: 'flex-start' }}
                >
                    {swipePages.map((page, index) => {
                        const isTogetherPage = page.kind === 'together';
                        const renderUsers = isTogetherPage ? users : [page.user];

                        return (
                            <div
                                key={page.id}
                                style={{
                                    width: '100%',
                                    flexShrink: 0,
                                    padding: '0 20px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: 8,
                                    opacity: currentPageIndex === index ? 1 : 0.5,
                                    transition: 'opacity 0.3s ease',
                                }}
                            >
                                <div
                                    style={{
                                        display: 'flex',
                                        gap: isTogetherPage ? 12 : 0,
                                        justifyContent: 'center',
                                        alignItems: isTogetherPage ? 'flex-start' : 'center',
                                        width: '100%',
                                    }}
                                >
                                    {renderUsers.map((user) => (
                                        <div
                                            key={user.id}
                                            style={{
                                                transform: isTogetherPage ? 'scale(0.85)' : 'scale(1)',
                                                transformOrigin: isTogetherPage ? 'top center' : undefined,
                                                position: 'relative',
                                            }}
                                        >
                                            <FuwafuwaCharacter
                                                user={user}
                                                sessions={allSessions}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </motion.div>
            </div>

            {swipePages.length > 1 && (
                <div
                    style={{
                        display: 'flex',
                        gap: 6,
                        marginTop: 8,
                        alignItems: 'center',
                    }}
                >
                    {swipePages.map((_, index) => (
                        <div
                            key={index}
                            style={{
                                width: currentPageIndex === index ? 20 : 6,
                                height: 6,
                                borderRadius: 3,
                                background: currentPageIndex === index ? '#2BBAA0' : 'rgba(43, 186, 160, 0.25)',
                                transition: 'all 0.3s ease',
                            }}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};
