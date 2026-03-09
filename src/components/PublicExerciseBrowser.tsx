import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, Clock, Download, ChevronRight } from 'lucide-react';
import { getExercisePlacementLabel } from '../data/exercisePlacement';
import { dedupeExercisesByIdentity } from '../lib/publicExerciseUtils';
import { fetchPopularExercises, type PublicExercise } from '../lib/publicExercises';
import { ExerciseDetailSheet } from './ExerciseDetailSheet';
import { DISPLAY_TERMS } from '../lib/terminology';
import { useAppStore } from '../store/useAppStore';
import { COLOR, FONT, FONT_SIZE, RADIUS, SPACE, Z } from '../lib/styles';

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
            setExercises(dedupeExercisesByIdentity(data));
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
            {createPortal(
                <AnimatePresence>
                    {open && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            style={{
                                position: 'fixed',
                                inset: 0,
                                zIndex: Z.modal,
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
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    padding: '20px 20px 12px',
                                    gap: 12,
                                    position: 'relative',
                                    zIndex: 1,
                                    background: '#F8F9FA',
                                    borderBottom: '1px solid rgba(0,0,0,0.05)',
                                }}>
                                    <h2 style={{
                                        fontFamily: "'Noto Sans JP', sans-serif",
                                        fontSize: 18,
                                        fontWeight: 800,
                                        color: '#2D3436',
                                        margin: 0,
                                        flex: 1,
                                    }}>
                                        {DISPLAY_TERMS.publicExercise}
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

                                <div style={{
                                    flex: 1,
                                    overflowY: 'auto',
                                    padding: '12px 20px 80px',
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
                                                まだ{DISPLAY_TERMS.publicExercise}がありません
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
                </AnimatePresence>,
                document.body,
            )}

            <ExerciseDetailSheet
                exercise={selectedExercise}
                onClose={() => setSelectedExercise(null)}
                onImported={onImported}
                onTry={handleTry}
            />
        </>
    );
};

const BrowserExerciseCard: React.FC<{
    exercise: PublicExercise;
    onTap: () => void;
}> = ({ exercise, onTap }) => {
    const subtitle = `${exercise.authorName} さんの種目`;
    const description = exercise.description || `${getExercisePlacementLabel(exercise.placement)}の ${exercise.sec}秒の種目`;

    return (
        <div
            className="card"
            style={{
                padding: 0,
                overflow: 'hidden',
                border: '1px solid rgba(43, 186, 160, 0.08)',
                boxShadow: '0 10px 24px rgba(31, 41, 55, 0.08)',
            }}
        >
            <button
                onClick={onTap}
                style={{
                    border: 'none',
                    background: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    padding: 0,
                }}
            >
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    padding: '16px 16px 12px',
                }}>
                    <div
                        style={{
                            width: 48,
                            height: 48,
                            borderRadius: 16,
                            background: 'linear-gradient(135deg, #E8F8F0, #FFE5D9)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                        }}
                    >
                        <span style={{ fontSize: 24, lineHeight: 1 }}>{exercise.emoji}</span>
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                            style={{
                                fontFamily: FONT.body,
                                fontSize: 16,
                                fontWeight: 700,
                                color: COLOR.dark,
                                lineHeight: 1.4,
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical' as const,
                                overflow: 'hidden',
                            }}
                        >
                            {exercise.name}
                        </div>
                        <div
                            style={{
                                fontFamily: FONT.body,
                                fontSize: 12,
                                color: COLOR.muted,
                                display: 'flex',
                                gap: 8,
                                alignItems: 'center',
                                flexWrap: 'wrap',
                                marginTop: 4,
                            }}
                        >
                            <span>👤 {exercise.authorName}</span>
                            <span aria-hidden="true">·</span>
                            <span>{exercise.sec}秒</span>
                            <span aria-hidden="true">·</span>
                            <span>{getExercisePlacementLabel(exercise.placement)}</span>
                        </div>
                    </div>

                    <div
                        aria-hidden="true"
                        style={{
                            width: 36,
                            height: 36,
                            borderRadius: 12,
                            background: 'rgba(43, 186, 160, 0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                        }}
                    >
                        <ChevronRight size={16} color={COLOR.primary} />
                    </div>
                </div>

                <div style={{
                    borderTop: '1px solid rgba(0,0,0,0.05)',
                    padding: '12px 16px 14px',
                    background: 'rgba(248, 249, 250, 0.72)',
                }}>
                    <div style={{
                        fontFamily: FONT.body,
                        fontSize: FONT_SIZE.sm,
                        color: COLOR.text,
                        lineHeight: 1.55,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical' as const,
                        overflow: 'hidden',
                    }}>
                        {description}
                    </div>

                    <div style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: 6,
                        marginTop: 10,
                    }}>
                        <MetaChip icon={<Download size={11} />} label={`${exercise.downloadCount}回もらわれた`} />
                        {exercise.hasSplit ? <AccentChip label="切替あり" /> : null}
                    </div>

                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginTop: 12,
                    }}>
                        <span style={{
                            fontFamily: FONT.body,
                            fontSize: FONT_SIZE.xs + 1,
                            fontWeight: 700,
                            color: COLOR.muted,
                        }}>
                            くわしく見る
                        </span>
                        <span style={{
                            fontFamily: FONT.heading,
                            fontSize: FONT_SIZE.sm,
                            fontWeight: 700,
                            color: COLOR.primary,
                        }}>
                            OPEN
                        </span>
                    </div>
                </div>
            </button>
        </div>
    );
};

const MetaChip: React.FC<{
    label: string;
    icon?: React.ReactNode;
}> = ({ label, icon }) => (
    <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '4px 8px',
        borderRadius: RADIUS.full,
        background: 'rgba(15, 23, 42, 0.05)',
        fontFamily: FONT.body,
        fontSize: FONT_SIZE.xs + 1,
        color: COLOR.light,
    }}>
        {icon}
        {label}
    </span>
);

const AccentChip: React.FC<{ label: string }> = ({ label }) => (
    <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '4px 8px',
        borderRadius: RADIUS.full,
        background: 'rgba(253, 203, 110, 0.15)',
        fontFamily: FONT.body,
        fontSize: FONT_SIZE.xs + 1,
        color: '#C58B00',
    }}>
        {label}
    </span>
);
