import React, { useMemo } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronRight, Clock, Play, Sparkles, X } from 'lucide-react';
import type { GroupExerciseMap } from '../menu/group-card/groupCardUtils';
import { buildGroupCardSummary } from '../menu/group-card/groupCardUtils';
import { getTeacherVisibilityLabel, isTeacherContentNew } from '../../lib/teacherExerciseMetadata';
import type { TeacherMenu } from '../../lib/teacherContent';
import { COLOR, FONT, FONT_SIZE, RADIUS, SPACE, Z } from '../../lib/styles';
import { getTeacherMenuLead, toTeacherMenuGroup } from './homeMenuUtils';

interface TeacherMenuDetailSheetProps {
    menu: TeacherMenu | null;
    exerciseMap: GroupExerciseMap;
    onClose: () => void;
    onOpenMenuTab: () => void;
    onStart: (menu: TeacherMenu) => void;
}

export const TeacherMenuDetailSheet: React.FC<TeacherMenuDetailSheetProps> = ({
    menu,
    exerciseMap,
    onClose,
    onOpenMenuTab,
    onStart,
}) => {
    const summary = useMemo(() => {
        if (!menu) {
            return null;
        }

        return buildGroupCardSummary(toTeacherMenuGroup(menu), exerciseMap);
    }, [exerciseMap, menu]);

    const isNew = menu ? isTeacherContentNew(menu.createdAt) : false;

    return createPortal(
        <AnimatePresence>
            {menu && summary ? (
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
                                background: 'linear-gradient(180deg, rgba(255,245,240,0.95) 0%, rgba(255,255,255,1) 100%)',
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                                <div
                                    style={{
                                        width: 56,
                                        height: 56,
                                        borderRadius: 18,
                                        background: 'linear-gradient(135deg, #FFF0E8, #FFF7D6)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexShrink: 0,
                                    }}
                                >
                                    <span style={{ fontSize: 30, lineHeight: 1 }}>{menu.emoji}</span>
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                                        <Tag tone="teacher">先生</Tag>
                                        {menu.recommended ? <Tag tone="primary">おすすめ</Tag> : null}
                                        {isNew ? <Tag tone="new">New</Tag> : null}
                                        {menu.visibility !== 'public' ? (
                                            <Tag tone="muted">{getTeacherVisibilityLabel(menu.visibility)}</Tag>
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
                                        {menu.name}
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
                                        {getTeacherMenuLead(menu)}
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
                                <MetaCard label="時間" value={`約${summary.minutes}分`} icon={<Clock size={14} />} />
                                <MetaCard label="種目" value={`${summary.exerciseCount}こ`} icon="🧩" />
                                <MetaCard
                                    label="つながり"
                                    value={menu.recommended ? '先生のおすすめ' : '先生から'}
                                    icon={<Sparkles size={14} />}
                                />
                            </div>

                            {menu.focusTags.length > 0 ? (
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                                    {menu.focusTags.map((tag) => (
                                        <Tag key={tag} tone="soft">{tag}</Tag>
                                    ))}
                                </div>
                            ) : null}

                            <div
                                style={{
                                    fontFamily: FONT.body,
                                    fontSize: FONT_SIZE.sm,
                                    fontWeight: 700,
                                    color: COLOR.muted,
                                    marginBottom: 8,
                                }}
                            >
                                しゅもく（{summary.exerciseCount}）
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                {summary.exercises.map((exercise) => (
                                    <span key={exercise.id} style={exerciseChipStyle}>
                                        {exercise.emoji} {exercise.name}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div
                            style={{
                                padding: '14px 20px calc(18px + env(safe-area-inset-bottom, 16px))',
                                display: 'flex',
                                gap: 10,
                                borderTop: `1px solid ${COLOR.border}`,
                                background: COLOR.white,
                            }}
                        >
                            <button
                                type="button"
                                onClick={() => {
                                    onClose();
                                    onOpenMenuTab();
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
                                    onStart(menu);
                                }}
                                style={primaryButtonStyle}
                            >
                                <Play size={16} fill="white" />
                                はじめる
                            </button>
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

const exerciseChipStyle: React.CSSProperties = {
    padding: '8px 12px',
    borderRadius: RADIUS.full,
    background: '#F7F8FA',
    fontFamily: FONT.body,
    fontSize: FONT_SIZE.sm,
    fontWeight: 700,
    color: COLOR.dark,
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
