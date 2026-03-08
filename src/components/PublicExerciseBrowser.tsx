import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, Clock } from 'lucide-react';
import { getExercisePlacementLabel } from '../data/exercisePlacement';
import { fetchPopularExercises, type PublicExercise } from '../lib/publicExercises';
import { ExerciseDetailSheet } from './ExerciseDetailSheet';
import { useAppStore } from '../store/useAppStore';

interface PublicExerciseBrowserProps {
    open: boolean;
    onClose: () => void;
    onImported?: () => void;
}

export const PublicExerciseBrowser: React.FC<PublicExerciseBrowserProps> = ({ open, onClose, onImported }) => {
    const [exercises, setExercises] = useState<PublicExercise[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [selectedExercise, setSelectedExercise] = useState<PublicExercise | null>(null);
    const startSessionWithExercises = useAppStore(s => s.startSessionWithExercises);

    useEffect(() => {
        if (!open) return;
        setLoading(true);
        setError(false);
        fetchPopularExercises(20).then(data => {
            // Deduplicate by name + emoji + sec
            const seen = new Set<string>();
            const deduped = data.filter(ex => {
                const key = `${ex.name}|${ex.emoji}|${ex.sec}|${ex.placement}`;
                if (seen.has(key)) return false;
                seen.add(key);
                return true;
            });
            setExercises(deduped);
        }).catch(err => {
            console.error('[PublicExerciseBrowser] fetch failed:', err);
            setError(true);
        }).finally(() => {
            setLoading(false);
        });
    }, [open]);

    const handleTry = (exerciseId: string) => {
        setSelectedExercise(null);
        onClose();
        startSessionWithExercises([exerciseId]);
    };

    return (
        <>
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                            position: 'fixed',
                            inset: 0,
                            zIndex: 100,
                            background: 'rgba(0,0,0,0.4)',
                            display: 'flex',
                            alignItems: 'flex-end',
                            justifyContent: 'center',
                        }}
                        onClick={onClose}
                    >
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                            onClick={e => e.stopPropagation()}
                            style={{
                                width: '100%',
                                maxWidth: 480,
                                maxHeight: '80vh',
                                background: '#F8F9FA',
                                borderRadius: '20px 20px 0 0',
                                display: 'flex',
                                flexDirection: 'column',
                                overflow: 'hidden',
                            }}
                        >
                            {/* Header */}
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                padding: '20px 20px 12px',
                                gap: 12,
                            }}>
                                <h2 style={{
                                    fontFamily: "'Noto Sans JP', sans-serif",
                                    fontSize: 18,
                                    fontWeight: 800,
                                    color: '#2D3436',
                                    margin: 0,
                                    flex: 1,
                                }}>
                                    みんなの種目
                                </h2>
                                <button
                                    onClick={onClose}
                                    style={{
                                        width: 32,
                                        height: 32,
                                        borderRadius: '50%',
                                        border: 'none',
                                        background: '#F0F3F5',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: 'pointer',
                                        color: '#8395A7',
                                    }}
                                >
                                    <X size={16} />
                                </button>
                            </div>

                            {/* Content */}
                            <div style={{
                                flex: 1,
                                overflowY: 'auto',
                                padding: '0 20px 80px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 10,
                            }}>
                                {loading ? (
                                    <div style={{
                                        textAlign: 'center',
                                        padding: 48,
                                        color: '#8395A7',
                                    }}>
                                        <Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} />
                                        <p style={{
                                            fontFamily: "'Noto Sans JP', sans-serif",
                                            fontSize: 14,
                                            margin: '12px 0 0',
                                        }}>
                                            読み込み中...
                                        </p>
                                    </div>
                                ) : error ? (
                                    <div style={{
                                        textAlign: 'center',
                                        padding: 48,
                                        color: '#E84393',
                                    }}>
                                        <p style={{
                                            fontFamily: "'Noto Sans JP', sans-serif",
                                            fontSize: 14,
                                            margin: 0,
                                        }}>
                                            読み込みに失敗しました
                                        </p>
                                    </div>
                                ) : exercises.length === 0 ? (
                                    <div style={{
                                        textAlign: 'center',
                                        padding: 48,
                                        color: '#8395A7',
                                    }}>
                                        <p style={{
                                            fontFamily: "'Noto Sans JP', sans-serif",
                                            fontSize: 14,
                                            margin: 0,
                                        }}>
                                            まだ公開種目がありません
                                        </p>
                                    </div>
                                ) : (
                                    exercises.map(ex => (
                                        <BrowserExerciseCard
                                            key={ex.id}
                                            exercise={ex}
                                            onTap={() => setSelectedExercise(ex)}
                                        />
                                    ))
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <ExerciseDetailSheet
                exercise={selectedExercise}
                onClose={() => setSelectedExercise(null)}
                onImported={onImported}
                onTry={handleTry}
            />
        </>
    );
};

// ─── Tappable exercise card ────────────────────────

const BrowserExerciseCard: React.FC<{
    exercise: PublicExercise;
    onTap: () => void;
}> = ({ exercise, onTap }) => {
    return (
        <button
            onClick={onTap}
            style={{
                background: '#FFF',
                borderRadius: 14,
                padding: '14px 16px',
                boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
                width: '100%',
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 24 }}>{exercise.emoji}</span>
                <div style={{ flex: 1 }}>
                    <div style={{
                        fontFamily: "'Noto Sans JP', sans-serif",
                        fontSize: 14,
                        fontWeight: 700,
                        color: '#2D3436',
                    }}>
                        {exercise.name}
                    </div>
                    <div style={{
                        fontFamily: "'Noto Sans JP', sans-serif",
                        fontSize: 11,
                        color: '#8395A7',
                        display: 'flex',
                        gap: 6,
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        marginTop: 2,
                    }}>
                        <span>{exercise.authorName}</span>
                        <span>·</span>
                        <span>{exercise.downloadCount}回もらわれた</span>
                        <span>·</span>
                        <Clock size={10} />
                        <span>{exercise.sec}秒</span>
                        <span>·</span>
                        <span>{getExercisePlacementLabel(exercise.placement)}</span>
                    </div>
                </div>
            </div>
            {exercise.description && (
                <div style={{
                    fontFamily: "'Noto Sans JP', sans-serif",
                    fontSize: 12,
                    color: '#636E72',
                    lineHeight: 1.5,
                    marginTop: 6,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical' as const,
                    overflow: 'hidden',
                }}>
                    {exercise.description}
                </div>
            )}
        </button>
    );
};
