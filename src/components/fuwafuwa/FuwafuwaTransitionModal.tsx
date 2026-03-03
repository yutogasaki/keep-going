import React from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import type { DepartingInfo, SayonaraModalState } from './types';

interface FuwafuwaTransitionModalProps {
    modalState: SayonaraModalState;
    departingInfo: DepartingInfo | null;
    userFuwafuwaType: number;
    onNewEggTransition: () => void;
    onWelcomeClose: () => void;
}

export const FuwafuwaTransitionModal: React.FC<FuwafuwaTransitionModalProps> = ({
    modalState,
    departingInfo,
    userFuwafuwaType,
    onNewEggTransition,
    onWelcomeClose,
}) => {
    if (!modalState) {
        return null;
    }

    return createPortal(
        <AnimatePresence mode="wait">
            {modalState === 'farewell' && departingInfo && (
                <FarewellModal
                    departingInfo={departingInfo}
                    onNewEggTransition={onNewEggTransition}
                />
            )}

            {modalState === 'welcome' && (
                <WelcomeModal
                    userFuwafuwaType={userFuwafuwaType}
                    onWelcomeClose={onWelcomeClose}
                />
            )}
        </AnimatePresence>,
        document.body,
    );
};

const FarewellModal: React.FC<{
    departingInfo: DepartingInfo;
    onNewEggTransition: () => void;
}> = ({ departingInfo, onNewEggTransition }) => {
    const isAdult = departingInfo.stage === 3;

    return (
        <motion.div
            key="farewell"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            style={{
                position: 'fixed',
                inset: 0,
                background: isAdult
                    ? 'linear-gradient(180deg, #FFFBEB 0%, #FFF8E1 50%, #FFF3E0 100%)'
                    : 'linear-gradient(180deg, #FFF5F5 0%, #FFF0F5 50%, #F8F0FF 100%)',
                zIndex: 200,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 32,
            }}
        >
            {[...Array(8)].map((_, index) => (
                <motion.div
                    key={`farewell-particle-${index}`}
                    animate={{
                        y: [0, -30, 0],
                        x: [0, index % 2 ? 10 : -10, 0],
                        opacity: [0.3, 0.7, 0.3],
                    }}
                    transition={{
                        duration: 3 + index * 0.5,
                        repeat: Infinity,
                        delay: index * 0.3,
                    }}
                    style={{
                        position: 'absolute',
                        fontSize: 20,
                        left: `${10 + (index * 12) % 80}%`,
                        top: `${15 + (index * 17) % 60}%`,
                        pointerEvents: 'none',
                    }}
                >
                    {isAdult
                        ? ['🏠', '✨', '🌟', '🎀', '💫', '🌈', '⭐', '🎉'][index]
                        : ['🌸', '✨', '💫', '🍃', '🌙', '💖', '⭐', '🦋'][index]
                    }
                </motion.div>
            ))}

            <motion.div
                initial={{ scale: 1, y: 0 }}
                animate={{ scale: [1, 1.05, 1], y: [0, -5, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                style={{ marginBottom: 24 }}
            >
                <div
                    style={{
                        width: 120,
                        height: 120,
                        borderRadius: '50%',
                        overflow: 'hidden',
                        border: isAdult
                            ? '4px solid rgba(255, 215, 0, 0.6)'
                            : '4px solid rgba(255,255,255,0.9)',
                        boxShadow: isAdult
                            ? '0 12px 40px rgba(255, 215, 0, 0.25)'
                            : '0 12px 40px rgba(232, 67, 147, 0.2)',
                        background: '#fff',
                    }}
                >
                    <img
                        src={`/ikimono/${departingInfo.type}-${departingInfo.stage}.png`}
                        alt="departing fuwafuwa"
                        style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scale(1.05)', display: 'block' }}
                    />
                </div>
            </motion.div>

            <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                style={{
                    fontFamily: "'Noto Sans JP', sans-serif",
                    fontSize: 22,
                    fontWeight: 800,
                    color: '#2D3436',
                    margin: '0 0 8px',
                    textAlign: 'center',
                }}
            >
                {isAdult
                    ? <>{departingInfo.name || 'ふわふわ'}は<br />お部屋にいくよ！</>
                    : <>{departingInfo.name || 'ふわふわ'}、<br />バイバイまたね！</>
                }
            </motion.h2>

            <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                style={{
                    fontFamily: "'Noto Sans JP', sans-serif",
                    fontSize: 14,
                    color: '#8395A7',
                    textAlign: 'center',
                    lineHeight: 1.8,
                    margin: '0 0 8px',
                }}
            >
                {departingInfo.activeDays}日間、いっしょにがんばったね。
            </motion.p>

            <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.9 }}
                style={{
                    fontFamily: "'Noto Sans JP', sans-serif",
                    fontSize: 13,
                    color: '#B2BEC3',
                    textAlign: 'center',
                    lineHeight: 1.6,
                    margin: '0 0 32px',
                }}
            >
                {isAdult
                    ? 'いつでも お部屋で会えるよ。'
                    : 'またいつか会えるかも。'
                }
            </motion.p>

            <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2 }}
                whileTap={{ scale: 0.95 }}
                onClick={onNewEggTransition}
                style={{
                    padding: '16px 40px',
                    borderRadius: 99,
                    border: 'none',
                    background: isAdult
                        ? 'linear-gradient(135deg, #F59E0B, #FBBF24)'
                        : 'linear-gradient(135deg, #E84393, #FD79A8)',
                    color: 'white',
                    fontFamily: "'Noto Sans JP', sans-serif",
                    fontSize: 16,
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: isAdult
                        ? '0 8px 24px rgba(245, 158, 11, 0.3)'
                        : '0 8px 24px rgba(232, 67, 147, 0.3)',
                    letterSpacing: 2,
                }}
            >
                {isAdult ? 'いってらっしゃい！' : 'バイバイ！'}
            </motion.button>
        </motion.div>
    );
};

const WelcomeModal: React.FC<{
    userFuwafuwaType: number;
    onWelcomeClose: () => void;
}> = ({ userFuwafuwaType, onWelcomeClose }) => {
    return (
        <motion.div
            key="welcome"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            style={{
                position: 'fixed',
                inset: 0,
                background: 'linear-gradient(180deg, #F0FDFA 0%, #E0F7FA 50%, #F0F4FF 100%)',
                zIndex: 200,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 32,
            }}
        >
            {[...Array(10)].map((_, index) => (
                <motion.div
                    key={`welcome-particle-${index}`}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{
                        opacity: [0, 1, 0],
                        scale: [0, 1, 0],
                        y: [0, -20, 0],
                    }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        delay: index * 0.2,
                    }}
                    style={{
                        position: 'absolute',
                        fontSize: 16,
                        left: `${5 + (index * 11) % 90}%`,
                        top: `${10 + (index * 13) % 70}%`,
                        pointerEvents: 'none',
                    }}
                >
                    ✨
                </motion.div>
            ))}

            <motion.div
                initial={{ scale: 0, rotate: -10 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', damping: 12, stiffness: 100, delay: 0.2 }}
                style={{ marginBottom: 24 }}
            >
                <div
                    style={{
                        width: 130,
                        height: 130,
                        borderRadius: '50%',
                        overflow: 'hidden',
                        border: '4px solid rgba(255,255,255,0.95)',
                        boxShadow: '0 16px 48px rgba(43, 186, 160, 0.25)',
                        background: '#fff',
                    }}
                >
                    <motion.img
                        animate={{
                            scale: [1.05, 1.1, 1.05],
                            rotate: [0, 2, -2, 0],
                        }}
                        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                        src={`/ikimono/${userFuwafuwaType}-1.png`}
                        alt="new egg"
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    />
                </div>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                style={{ fontSize: 48, marginBottom: 8 }}
            >
                🎉
            </motion.div>

            <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                style={{
                    fontFamily: "'Noto Sans JP', sans-serif",
                    fontSize: 22,
                    fontWeight: 800,
                    color: '#2D3436',
                    margin: '0 0 12px',
                    textAlign: 'center',
                }}
            >
                あたらしい たまごが<br />やってきたよ！
            </motion.h2>

            <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.0 }}
                style={{
                    fontFamily: "'Noto Sans JP', sans-serif",
                    fontSize: 14,
                    color: '#8395A7',
                    textAlign: 'center',
                    lineHeight: 1.8,
                    margin: '0 0 32px',
                }}
            >
                まいにち がんばって<br />たいせつに そだてよう！
            </motion.p>

            <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.3 }}
                whileTap={{ scale: 0.95 }}
                onClick={onWelcomeClose}
                style={{
                    padding: '16px 40px',
                    borderRadius: 99,
                    border: 'none',
                    background: 'linear-gradient(135deg, #2BBAA0, #3AEDC6)',
                    color: 'white',
                    fontFamily: "'Noto Sans JP', sans-serif",
                    fontSize: 16,
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 8px 24px rgba(43, 186, 160, 0.3)',
                    letterSpacing: 2,
                }}
            >
                よろしくね！
            </motion.button>
        </motion.div>
    );
};
