import React from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronRight, Clock, Play, Sparkles, X } from 'lucide-react';
import { getExercisePlacementLabel } from '../../data/exercisePlacement';
import { getTeacherVisibilityLabel, isTeacherContentNew } from '../../lib/teacherExerciseMetadata';
import type { TeacherExercise } from '../../lib/teacherContent';
import { COLOR, FONT, FONT_SIZE, RADIUS, SPACE, Z } from '../../lib/styles';
import { getTeacherExerciseLead } from './homeMenuUtils';

interface TeacherExerciseDetailSheetProps {
    exercise: TeacherExercise | null;
    onClose: () => void;
    onOpenMenuTab: (placement?: TeacherExercise['placement'] | null) => void;
    onStart: (exercise: TeacherExercise) => void;
    onCreatePersonalChallenge?: (exercise: TeacherExercise) => void;
}

export const TeacherExerciseDetailSheet: React.FC<TeacherExerciseDetailSheetProps> = ({
    exercise,
    onClose,
    onOpenMenuTab,
    onStart,
    onCreatePersonalChallenge,
}) => {
    const isNew = exercise ? isTeacherContentNew(exercise.createdAt) : false;

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
                        background: 'rgba(0,0,0,0.36)',
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
                            maxHeight: '78vh',
                            background: COLOR.white,
                            borderRadius: '24px 24px 0 0',
                            display: 'flex',
                            flexDirection: 'column',
                            overflow: 'hidden',
                        }}
                    >
                        <div
                            style={{
                                padding: '20px 20px 0',
                                background: 'linear-gradient(180deg, rgba(240,246,255,0.95) 0%, rgba(255,255,255,1) 100%)',
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                                <div
                                    style={{
                                        width: 56,
                                        height: 56,
                                        borderRadius: 18,
                                        background: 'linear-gradient(135deg, #EEF6FF, #F8FBFF)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexShrink: 0,
                                    }}
                                >
                                    <span style={{ fontSize: 30, lineHeight: 1 }}>{exercise.emoji}</span>
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                                        <Tag tone="teacher">先生</Tag>
                                        {exercise.recommended ? <Tag tone="primary">おすすめ</Tag> : null}
                                        {isNew ? <Tag tone="new">New</Tag> : null}
                                        {exercise.visibility !== 'public' ? (
                                            <Tag tone="muted">{getTeacherVisibilityLabel(exercise.visibility)}</Tag>
                                        ) : null}
                                    </div>
                                    <div
                                        style={{
                                            fontFamily: FONT.body,
                                            fontSize: FONT_SIZE['2xl'],
                                            fontWeight: 800,
                                            color: COLOR.dark,
                                            lineHeight: 1.25,
                                            paddingRight: 8,
                                        }}
                                    >
                                        {exercise.name}
                                    </div>
                                    <div
                                        style={{
                                            fontFamily: FONT.body,
                                            fontSize: FONT_SIZE.sm + 1,
                                            color: COLOR.text,
                                            marginTop: 8,
                                            lineHeight: 1.7,
                                        }}
                                    >
                                        {getTeacherExerciseLead(exercise)}
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={onClose}
                                    style={closeButtonStyle}
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
                                <MetaCard label="時間" value={`${exercise.sec}秒`} icon={<Clock size={14} />} />
                                <MetaCard label="タイプ" value={getExercisePlacementLabel(exercise.placement)} icon="🧩" />
                                <MetaCard
                                    label="つながり"
                                    value={isNew ? '先生の新着' : exercise.recommended ? '先生のおすすめ' : '先生から'}
                                    icon={<Sparkles size={14} />}
                                />
                            </div>

                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                <Tag tone="soft">{getExercisePlacementLabel(exercise.placement)}</Tag>
                                {exercise.hasSplit ? <Tag tone="soft">切替あり</Tag> : null}
                                {exercise.focusTags.map((tag) => (
                                    <Tag key={tag} tone="soft">{tag}</Tag>
                                ))}
                            </div>
                        </div>

                        <div
                            style={{
                                padding: '14px 20px calc(18px + env(safe-area-inset-bottom, 16px))',
                                display: 'grid',
                                gap: 10,
                                borderTop: `1px solid ${COLOR.border}`,
                                background: COLOR.white,
                            }}
                        >
                            {onCreatePersonalChallenge ? (
                                <button
                                    type="button"
                                    onClick={() => onCreatePersonalChallenge(exercise)}
                                    style={challengeShortcutButtonStyle}
                                >
                                    この種目で じぶんチャレンジをつくる
                                </button>
                            ) : null}
                            <div style={{ display: 'flex', gap: 10 }}>
                                <button
                                    type="button"
                                    onClick={() => {
                                        onClose();
                                        onOpenMenuTab(exercise.placement);
                                    }}
                                    style={secondaryButtonStyle}
                                >
                                    メニューへ
                                    <ChevronRight size={16} />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        onClose();
                                        onStart(exercise);
                                    }}
                                    style={primaryButtonStyle}
                                >
                                    <Play size={16} fill="white" />
                                    はじめる
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
        <div
            style={{
                borderRadius: 16,
                padding: '12px 12px 10px',
                background: '#F7F8FA',
                minWidth: 0,
            }}
        >
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontFamily: FONT.body,
                    fontSize: FONT_SIZE.xs + 1,
                    fontWeight: 700,
                    color: COLOR.muted,
                    marginBottom: 6,
                }}
            >
                <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</span>
                <span>{label}</span>
            </div>
            <div
                style={{
                    fontFamily: FONT.body,
                    fontSize: FONT_SIZE.md + 1,
                    fontWeight: 800,
                    color: COLOR.dark,
                    lineHeight: 1.35,
                    wordBreak: 'keep-all',
                }}
            >
                {value}
            </div>
        </div>
    );
}

function Tag({
    children,
    tone,
}: {
    children: React.ReactNode;
    tone: 'teacher' | 'primary' | 'new' | 'muted' | 'soft';
}) {
    const style = tagToneStyles[tone];

    return (
        <span
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '4px 9px',
                borderRadius: RADIUS.full,
                fontFamily: FONT.body,
                fontSize: FONT_SIZE.xs + 1,
                fontWeight: 700,
                ...style,
            }}
        >
            {children}
        </span>
    );
}

const tagToneStyles: Record<'teacher' | 'primary' | 'new' | 'muted' | 'soft', React.CSSProperties> = {
    teacher: {
        color: '#0984E3',
        background: 'rgba(9, 132, 227, 0.10)',
    },
    primary: {
        color: COLOR.primaryDark,
        background: 'rgba(43, 186, 160, 0.12)',
    },
    new: {
        color: COLOR.white,
        background: '#FF7A7A',
    },
    muted: {
        color: COLOR.text,
        background: '#F0F3F5',
    },
    soft: {
        color: '#B86A2C',
        background: '#FFF2E4',
    },
};

const closeButtonStyle: React.CSSProperties = {
    width: 40,
    height: 40,
    borderRadius: RADIUS.full,
    border: 'none',
    background: '#F4F6F8',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: COLOR.muted,
    flexShrink: 0,
};

const secondaryButtonStyle: React.CSSProperties = {
    flex: 1,
    padding: `${SPACE.md}px`,
    borderRadius: RADIUS.lg,
    border: '2px solid rgba(43, 186, 160, 0.2)',
    background: COLOR.white,
    color: COLOR.primaryDark,
    fontFamily: FONT.body,
    fontSize: FONT_SIZE.md,
    fontWeight: 700,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
};

const primaryButtonStyle: React.CSSProperties = {
    flex: 1,
    padding: `${SPACE.md}px`,
    borderRadius: RADIUS.lg,
    border: 'none',
    background: COLOR.primary,
    color: COLOR.white,
    fontFamily: FONT.body,
    fontSize: FONT_SIZE.md,
    fontWeight: 700,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
};

const challengeShortcutButtonStyle: React.CSSProperties = {
    width: '100%',
    minHeight: 48,
    borderRadius: RADIUS.lg,
    border: '1px solid rgba(9, 132, 227, 0.16)',
    background: 'linear-gradient(135deg, #F4F9FF, #EEF6FF)',
    color: '#0A6CC4',
    fontFamily: FONT.body,
    fontSize: FONT_SIZE.sm,
    fontWeight: 800,
    cursor: 'pointer',
};
