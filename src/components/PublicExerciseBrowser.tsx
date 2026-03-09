import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2 } from 'lucide-react';
import { dedupeExercisesByIdentity } from '../lib/publicExerciseUtils';
import { fetchPopularExercises, type PublicExercise } from '../lib/publicExercises';
import { ExerciseDetailSheet } from './ExerciseDetailSheet';
import { DISPLAY_TERMS } from '../lib/terminology';
import { useAppStore } from '../store/useAppStore';
import { Z } from '../lib/styles';
import { PublicExerciseCard } from './PublicExerciseCard';

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
                                            <PublicExerciseCard
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
