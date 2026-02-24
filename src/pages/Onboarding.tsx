import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BalletShoeIcon } from '../components/BalletShoeIcon';
import { useAppStore } from '../store/useAppStore';
import type { ClassLevel } from '../data/exercises';

const CLASS_LEVELS: { id: ClassLevel; label: string; emoji: string; desc: string }[] = [
    { id: 'プレ', label: 'プレバレエ', emoji: '🐣', desc: 'はじめてのバレエ' },
    { id: '初級', label: '初級', emoji: '🌱', desc: 'たのしくストレッチ' },
    { id: '中級', label: '中級', emoji: '🌸', desc: 'もっとやわらかく' },
    { id: '上級', label: '上級', emoji: '⭐', desc: 'もっともっと上へ' },
];

export const Onboarding: React.FC = () => {
    const completeOnboarding = useAppStore((state) => state.completeOnboarding);
    const setClassLevel = useAppStore((state) => state.setClassLevel);
    const [step, setStep] = useState<'welcome' | 'class' | 'swipe'>('welcome');
    const [selectedClass, setSelectedClass] = useState<ClassLevel | null>(null);
    const [swiped, setSwiped] = useState(false);

    const handleClassSelect = (level: ClassLevel) => {
        setSelectedClass(level);
        setClassLevel(level);
    };

    const handleFinish = () => {
        completeOnboarding();
    };

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            background: 'linear-gradient(165deg, #FFF5F0 0%, #E8F8F0 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
        }}>
            <AnimatePresence mode="wait">
                {/* Step 1: Welcome */}
                {step === 'welcome' && (
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
                            <div style={{
                                width: 120,
                                height: 120,
                                borderRadius: 40,
                                background: 'rgba(43, 186, 160, 0.12)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}>
                                <BalletShoeIcon size={64} color="#2BBAA0" />
                            </div>
                        </motion.div>

                        <h1 style={{
                            fontFamily: "'Outfit', sans-serif",
                            fontSize: 32,
                            fontWeight: 800,
                            color: '#2D3436',
                        }}>
                            KeepGoing
                        </h1>
                        <p style={{
                            fontFamily: "'Noto Sans JP', sans-serif",
                            fontSize: 15,
                            color: '#8395A7',
                            lineHeight: 1.8,
                        }}>
                            今日やること、もう迷わない。<br />
                            がんばらなくていい。ただ、開くだけ。
                        </p>

                        <button
                            onClick={() => setStep('class')}
                            style={{
                                marginTop: 16,
                                padding: '14px 48px',
                                borderRadius: 9999,
                                border: 'none',
                                background: '#2BBAA0',
                                color: 'white',
                                fontFamily: "'Noto Sans JP', sans-serif",
                                fontSize: 16,
                                fontWeight: 700,
                                cursor: 'pointer',
                                boxShadow: '0 4px 16px rgba(43, 186, 160, 0.35)',
                            }}
                        >
                            はじめる
                        </button>
                    </motion.div>
                )}

                {/* Step 2: Class selection (spec §10.4) */}
                {step === 'class' && (
                    <motion.div
                        key="class"
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -30 }}
                        transition={{ duration: 0.5 }}
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: 24,
                            padding: '0 24px',
                            maxWidth: 400,
                            width: '100%',
                            textAlign: 'center',
                        }}
                    >
                        <h2 style={{
                            fontFamily: "'Noto Sans JP', sans-serif",
                            fontSize: 22,
                            fontWeight: 700,
                            color: '#2D3436',
                        }}>
                            クラスをえらんでね
                        </h2>
                        <p style={{
                            fontFamily: "'Noto Sans JP', sans-serif",
                            fontSize: 13,
                            color: '#8395A7',
                            marginTop: -12,
                        }}>
                            あとからでも変えられるよ
                        </p>

                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 10,
                            width: '100%',
                        }}>
                            {CLASS_LEVELS.map(({ id, label, emoji, desc }) => (
                                <motion.button
                                    key={id}
                                    onClick={() => handleClassSelect(id)}
                                    whileTap={{ scale: 0.97 }}
                                    className="card card-sm"
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 14,
                                        padding: '16px 20px',
                                        border: selectedClass === id ? '2px solid #2BBAA0' : '2px solid transparent',
                                        cursor: 'pointer',
                                        textAlign: 'left',
                                        transition: 'border 0.2s ease',
                                    }}
                                >
                                    <span style={{ fontSize: 28 }}>{emoji}</span>
                                    <div>
                                        <div style={{
                                            fontFamily: "'Noto Sans JP', sans-serif",
                                            fontSize: 16,
                                            fontWeight: 700,
                                            color: selectedClass === id ? '#2BBAA0' : '#2D3436',
                                        }}>{label}</div>
                                        <div style={{
                                            fontFamily: "'Noto Sans JP', sans-serif",
                                            fontSize: 12,
                                            color: '#8395A7',
                                        }}>{desc}</div>
                                    </div>
                                    {selectedClass === id && (
                                        <span style={{
                                            marginLeft: 'auto',
                                            color: '#2BBAA0',
                                            fontWeight: 700,
                                            fontSize: 18,
                                        }}>✓</span>
                                    )}
                                </motion.button>
                            ))}
                        </div>

                        <button
                            onClick={() => setStep('swipe')}
                            disabled={!selectedClass}
                            style={{
                                marginTop: 8,
                                padding: '14px 48px',
                                borderRadius: 9999,
                                border: 'none',
                                background: selectedClass ? '#2BBAA0' : '#B2BEC3',
                                color: 'white',
                                fontFamily: "'Noto Sans JP', sans-serif",
                                fontSize: 16,
                                fontWeight: 700,
                                cursor: selectedClass ? 'pointer' : 'not-allowed',
                                boxShadow: selectedClass ? '0 4px 16px rgba(43, 186, 160, 0.35)' : 'none',
                                transition: 'all 0.3s ease',
                            }}
                        >
                            つぎへ
                        </button>
                    </motion.div>
                )}

                {/* Step 3: Swipe tutorial (spec §10.3) */}
                {step === 'swipe' && (
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
                        <h2 style={{
                            fontFamily: "'Noto Sans JP', sans-serif",
                            fontSize: 22,
                            fontWeight: 700,
                            color: '#2D3436',
                        }}>
                            つかいかた
                        </h2>

                        {/* Swipe demo area */}
                        <motion.div
                            drag="y"
                            dragConstraints={{ top: -100, bottom: 100 }}
                            dragElastic={0.3}
                            onDragEnd={(_, { offset }) => {
                                if (Math.abs(offset.y) > 50) {
                                    setSwiped(true);
                                }
                            }}
                            style={{
                                width: '100%',
                                height: 200,
                                borderRadius: 24,
                                background: 'rgba(255,255,255,0.7)',
                                backdropFilter: 'blur(12px)',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 12,
                                cursor: 'grab',
                                border: '2px dashed rgba(43, 186, 160, 0.3)',
                            }}
                        >
                            {!swiped ? (
                                <>
                                    <motion.div
                                        animate={{ y: [-5, 5, -5] }}
                                        transition={{ duration: 1.5, repeat: Infinity }}
                                        style={{ fontSize: 32, color: '#2BBAA0' }}
                                    >
                                        ↕
                                    </motion.div>
                                    <p style={{
                                        fontFamily: "'Noto Sans JP', sans-serif",
                                        fontSize: 15,
                                        fontWeight: 600,
                                        color: '#2D3436',
                                    }}>
                                        上下にスワイプしてみよう！
                                    </p>
                                </>
                            ) : (
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    style={{ textAlign: 'center' }}
                                >
                                    <span style={{ fontSize: 48 }}>🎉</span>
                                    <p style={{
                                        fontFamily: "'Noto Sans JP', sans-serif",
                                        fontSize: 16,
                                        fontWeight: 700,
                                        color: '#2BBAA0',
                                        marginTop: 8,
                                    }}>
                                        かんぺき！
                                    </p>
                                </motion.div>
                            )}
                        </motion.div>

                        <div style={{
                            fontFamily: "'Noto Sans JP', sans-serif",
                            fontSize: 13,
                            color: '#8395A7',
                            lineHeight: 1.8,
                        }}>
                            <p>↑ スワイプ = つぎのストレッチへ</p>
                            <p>タップ = いちじていし</p>
                        </div>

                        <button
                            onClick={handleFinish}
                            disabled={!swiped}
                            style={{
                                marginTop: 8,
                                padding: '14px 48px',
                                borderRadius: 9999,
                                border: 'none',
                                background: swiped ? '#2BBAA0' : '#B2BEC3',
                                color: 'white',
                                fontFamily: "'Noto Sans JP', sans-serif",
                                fontSize: 16,
                                fontWeight: 700,
                                cursor: swiped ? 'pointer' : 'not-allowed',
                                boxShadow: swiped ? '0 4px 16px rgba(43, 186, 160, 0.35)' : 'none',
                                transition: 'all 0.3s ease',
                            }}
                        >
                            はじめよう！
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
