import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Play, Loader2, Clock } from 'lucide-react';
import { type PublicExercise, importExercise } from '../lib/publicExercises';

interface ExerciseDetailSheetProps {
    exercise: PublicExercise | null;
    onClose: () => void;
    onTry: (exerciseId: string) => void;
    onImported?: () => void;
}

export const ExerciseDetailSheet: React.FC<ExerciseDetailSheetProps> = ({ exercise, onClose, onTry, onImported }) => {
    const [importing, setImporting] = useState(false);
    const [imported, setImported] = useState(false);
    const [error, setError] = useState<string | false>(false);

    const handleImport = async () => {
        if (!exercise || importing) return;
        setImporting(true);
        setError(false);
        setImported(false);
        try {
            await importExercise(exercise);
            setImported(true);
            onImported?.();
            setTimeout(() => setImported(false), 2000);
        } catch (err) {
            console.error('[ExerciseDetailSheet] import failed:', err);
            const msg = err instanceof Error ? err.message : '保存に失敗しました';
            setError(msg);
            setTimeout(() => setError(false), 5000);
        } finally {
            setImporting(false);
        }
    };

    const handleTry = async () => {
        if (!exercise) return;
        // 自動インポートしてからセッション開始
        try {
            await importExercise(exercise);
            onImported?.();
        } catch {
            // 既にインポート済みの場合のエラーは無視
        }
        onClose();
        onTry(`imported-ex-${exercise.id}`);
    };

    React.useEffect(() => {
        setImported(false);
        setError(false);
        setImporting(false);
    }, [exercise?.id]);

    return (
        <AnimatePresence>
            {exercise && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        zIndex: 110,
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
                            maxHeight: '75vh',
                            background: '#FFF',
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
                            padding: '20px 20px 0',
                            gap: 12,
                        }}>
                            <span style={{ fontSize: 32 }}>{exercise.emoji}</span>
                            <div style={{ flex: 1 }}>
                                <div style={{
                                    fontFamily: "'Noto Sans JP', sans-serif",
                                    fontSize: 18,
                                    fontWeight: 800,
                                    color: '#2D3436',
                                }}>
                                    {exercise.name}
                                </div>
                                <div style={{
                                    fontFamily: "'Noto Sans JP', sans-serif",
                                    fontSize: 12,
                                    color: '#8395A7',
                                    display: 'flex',
                                    gap: 8,
                                    alignItems: 'center',
                                    marginTop: 2,
                                }}>
                                    <span>👤 {exercise.authorName}</span>
                                    <span>·</span>
                                    <span>📥 {exercise.downloadCount}回</span>
                                    <span>·</span>
                                    <Clock size={11} />
                                    <span>{exercise.sec}秒</span>
                                </div>
                            </div>
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
                                    flexShrink: 0,
                                }}
                            >
                                <X size={16} />
                            </button>
                        </div>

                        {/* Scrollable content: Description + Details */}
                        <div style={{
                            flex: 1,
                            overflowY: 'auto',
                            padding: '16px 20px',
                        }}>
                            {exercise.description && (
                                <p style={{
                                    fontFamily: "'Noto Sans JP', sans-serif",
                                    fontSize: 13,
                                    color: '#636E72',
                                    lineHeight: 1.6,
                                    margin: '0 0 12px',
                                }}>
                                    {exercise.description}
                                </p>
                            )}

                            <div style={{
                                display: 'flex',
                                gap: 12,
                                flexWrap: 'wrap',
                            }}>
                                <span style={{
                                    padding: '6px 12px',
                                    borderRadius: 10,
                                    background: '#F0F3F5',
                                    fontFamily: "'Noto Sans JP', sans-serif",
                                    fontSize: 13,
                                    color: '#2D3436',
                                }}>
                                    ⏱ {exercise.sec}秒
                                </span>
                                {exercise.hasSplit && (
                                    <span style={{
                                        padding: '6px 12px',
                                        borderRadius: 10,
                                        background: 'rgba(43, 186, 160, 0.1)',
                                        fontFamily: "'Noto Sans JP', sans-serif",
                                        fontSize: 13,
                                        color: '#2BBAA0',
                                    }}>
                                        切替あり
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div style={{
                            padding: '12px 20px calc(24px + env(safe-area-inset-bottom, 20px))',
                            display: 'flex',
                            gap: 10,
                            borderTop: '1px solid rgba(0,0,0,0.05)',
                            paddingBottom: 80,
                        }}>
                            <button
                                onClick={handleImport}
                                disabled={importing}
                                style={{
                                    flex: 1,
                                    padding: '14px',
                                    borderRadius: 14,
                                    border: '2px solid #2BBAA0',
                                    background: error ? '#FFE0E0' : imported ? '#E8F8F0' : 'white',
                                    color: error ? '#E84393' : '#2BBAA0',
                                    fontFamily: "'Noto Sans JP', sans-serif",
                                    fontSize: 14,
                                    fontWeight: 700,
                                    cursor: imported ? 'default' : 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 6,
                                }}
                            >
                                {importing ? (
                                    <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                                ) : error ? (
                                    typeof error === 'string' ? `失敗: ${error.slice(0, 20)}` : '失敗…'
                                ) : imported ? (
                                    '追加済み ✓'
                                ) : (
                                    <>
                                        <Download size={16} />
                                        もらう
                                    </>
                                )}
                            </button>
                            <button
                                onClick={handleTry}
                                style={{
                                    flex: 1,
                                    padding: '14px',
                                    borderRadius: 14,
                                    border: 'none',
                                    background: '#2BBAA0',
                                    color: 'white',
                                    fontFamily: "'Noto Sans JP', sans-serif",
                                    fontSize: 14,
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 6,
                                }}
                            >
                                <Play size={16} fill="white" />
                                ためしてみる
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
