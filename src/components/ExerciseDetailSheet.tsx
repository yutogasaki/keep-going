import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Play, Loader2, Clock } from 'lucide-react';
import { getExercisePlacementLabel } from '../data/exercisePlacement';
import { type PersonalChallengeCreateSeed } from './PersonalChallengeFormSheet';
import {
    getImportedPublicExerciseId,
    type PublicExercise,
    importExercise,
} from '../lib/publicExercises';
import { Z } from '../lib/styles';

interface ExerciseDetailSheetProps {
    exercise: PublicExercise | null;
    onClose: () => void;
    onTry: (exerciseId: string) => void;
    onImported?: () => void;
    onCreatePersonalChallenge?: (seed: PersonalChallengeCreateSeed) => void | Promise<void>;
}

export const ExerciseDetailSheet: React.FC<ExerciseDetailSheetProps> = ({
    exercise,
    onClose,
    onTry,
    onImported,
    onCreatePersonalChallenge,
}) => {
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
        try {
            await importExercise(exercise);
            onImported?.();
        } catch {
            // ignore duplicate import failures
        }
        onClose();
        onTry(getImportedPublicExerciseId(exercise.id));
    };

    const handleCreatePersonalChallenge = async () => {
        if (!exercise || importing || !onCreatePersonalChallenge) return;

        setImporting(true);
        setError(false);
        try {
            await importExercise(exercise);
            setImported(true);
            onImported?.();
            await onCreatePersonalChallenge({
                challengeType: 'exercise',
                exerciseSource: 'custom',
                exerciseId: getImportedPublicExerciseId(exercise.id),
                description: exercise.description ?? '',
                iconEmoji: exercise.emoji,
            });
            onClose();
        } catch (err) {
            console.error('[ExerciseDetailSheet] create challenge failed:', err);
            const msg = err instanceof Error ? err.message : 'チャレンジ作成の準備に失敗しました';
            setError(msg);
            setTimeout(() => setError(false), 5000);
        } finally {
            setImporting(false);
        }
    };

    React.useEffect(() => {
        setImported(false);
        setError(false);
        setImporting(false);
    }, [exercise?.id]);

    return createPortal(
        <AnimatePresence>
            {exercise ? (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        zIndex: Z.modal + 10,
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
                        onClick={(event) => event.stopPropagation()}
                        style={{
                            width: '100%',
                            maxWidth: 480,
                            maxHeight: '75vh',
                            background: '#FFF',
                            borderRadius: '24px 24px 0 0',
                            display: 'flex',
                            flexDirection: 'column',
                            overflow: 'hidden',
                        }}
                    >
                        <div style={{ padding: '20px 20px 0' }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                                <div
                                    style={{
                                        width: 56,
                                        height: 56,
                                        borderRadius: 18,
                                        background: 'linear-gradient(135deg, #FFF6D6, #E8F8F0)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexShrink: 0,
                                    }}
                                >
                                    <span style={{ fontSize: 32, lineHeight: 1 }}>{exercise.emoji}</span>
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div
                                        style={{
                                            fontFamily: "'Noto Sans JP', sans-serif",
                                            fontSize: 22,
                                            fontWeight: 800,
                                            color: '#2D3436',
                                            lineHeight: 1.25,
                                            paddingRight: 8,
                                        }}
                                    >
                                        {exercise.name}
                                    </div>
                                    <div
                                        style={{
                                            fontFamily: "'Noto Sans JP', sans-serif",
                                            fontSize: 13,
                                            color: '#8395A7',
                                            marginTop: 6,
                                            lineHeight: 1.5,
                                        }}
                                    >
                                        👤 {exercise.authorName}
                                    </div>
                                </div>
                                <button
                                    onClick={onClose}
                                    style={{
                                        width: 40,
                                        height: 40,
                                        borderRadius: '50%',
                                        border: 'none',
                                        background: '#F4F6F8',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: 'pointer',
                                        color: '#8395A7',
                                        flexShrink: 0,
                                    }}
                                >
                                    <X size={18} />
                                </button>
                            </div>
                        </div>

                        <div
                            style={{
                                flex: 1,
                                overflowY: 'auto',
                                padding: '16px 20px 20px',
                            }}
                        >
                            <div
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                                    gap: 10,
                                    marginBottom: 16,
                                }}
                            >
                                <MetaCard label="人気" value={`${exercise.downloadCount}回`} icon="📥" />
                                <MetaCard label="時間" value={`${exercise.sec}秒`} icon={<Clock size={14} />} />
                                <MetaCard label="タイプ" value={getExercisePlacementLabel(exercise.placement)} icon="🧩" />
                            </div>

                            {exercise.description ? (
                                <p
                                    style={{
                                        fontFamily: "'Noto Sans JP', sans-serif",
                                        fontSize: 14,
                                        color: '#52606D',
                                        lineHeight: 1.7,
                                        margin: '0 0 16px',
                                    }}
                                >
                                    {exercise.description}
                                </p>
                            ) : null}

                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                <span
                                    style={{
                                        padding: '8px 12px',
                                        borderRadius: 999,
                                        background: '#EEF7F4',
                                        fontFamily: "'Noto Sans JP', sans-serif",
                                        fontSize: 12,
                                        fontWeight: 700,
                                        color: '#2BBAA0',
                                    }}
                                >
                                    {getExercisePlacementLabel(exercise.placement)}
                                </span>
                                {exercise.hasSplit ? (
                                    <span
                                        style={{
                                            padding: '8px 12px',
                                            borderRadius: 999,
                                            background: '#FFF3E0',
                                            fontFamily: "'Noto Sans JP', sans-serif",
                                            fontSize: 12,
                                            fontWeight: 700,
                                            color: '#C58B00',
                                        }}
                                    >
                                        切替あり
                                    </span>
                                ) : null}
                            </div>
                        </div>

                        <div
                            style={{
                                padding: '14px 20px calc(18px + env(safe-area-inset-bottom, 16px))',
                                display: 'grid',
                                gap: 10,
                                borderTop: '1px solid rgba(0,0,0,0.05)',
                                background: '#FFF',
                            }}
                        >
                            {onCreatePersonalChallenge ? (
                                <button
                                    onClick={handleCreatePersonalChallenge}
                                    disabled={importing}
                                    style={{
                                        width: '100%',
                                        padding: '13px 14px',
                                        borderRadius: 14,
                                        border: '1px solid rgba(43,186,160,0.18)',
                                        background: 'linear-gradient(135deg, #F8FFFD, #F0FBF7)',
                                        color: '#1E7F6D',
                                        fontFamily: "'Noto Sans JP', sans-serif",
                                        fontSize: 13,
                                        fontWeight: 800,
                                        cursor: importing ? 'default' : 'pointer',
                                    }}
                                >
                                    この種目で じぶんチャレンジをつくる
                                </button>
                            ) : null}
                            <div style={{ display: 'flex', gap: 10 }}>
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
                        </div>
                    </motion.div>
                </motion.div>
            ) : null}
        </AnimatePresence>,
        document.body,
    );
};

const metaCardBaseStyle: React.CSSProperties = {
    borderRadius: 16,
    padding: '12px 12px 10px',
    background: '#F7F8FA',
    minWidth: 0,
};

function MetaCard({
    label,
    value,
    icon,
}: {
    label: string;
    value: string;
    icon: React.ReactNode;
}) {
    return (
        <div style={metaCardBaseStyle}>
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontFamily: "'Noto Sans JP', sans-serif",
                    fontSize: 11,
                    fontWeight: 700,
                    color: '#8395A7',
                    marginBottom: 6,
                }}
            >
                <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</span>
                <span>{label}</span>
            </div>
            <div
                style={{
                    fontFamily: "'Noto Sans JP', sans-serif",
                    fontSize: 15,
                    fontWeight: 800,
                    color: '#2D3436',
                    lineHeight: 1.35,
                    wordBreak: 'keep-all',
                }}
            >
                {value}
            </div>
        </div>
    );
}
