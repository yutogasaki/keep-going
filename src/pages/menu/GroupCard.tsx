import React, { useId, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, Clock, Download, Edit2, EyeOff, Play, Trash2, Upload } from 'lucide-react';
import { ExerciseIcon } from '../../components/ExerciseIcon';
import { getExerciseById } from '../../data/exercises';
import type { MenuGroup } from '../../data/menuGroups';

interface GroupCardProps {
    group: MenuGroup;
    index: number;
    exerciseMap?: Map<string, { name: string; emoji: string; sec: number }>;
    creatorName?: string | null;
    onTap: () => void;
    onEdit?: () => void;
    onDelete?: () => void;
    onPublish?: () => void;
    onUnpublish?: () => void;
    isCustom?: boolean;
    isPublished?: boolean;
    downloadCount?: number;
    isTeacher?: boolean;
    isNew?: boolean;
}

export const GroupCard: React.FC<GroupCardProps> = ({ group, index, exerciseMap, creatorName, onTap, onEdit, onDelete, onPublish, onUnpublish, isCustom, isPublished, downloadCount, isTeacher, isNew }) => {
    const [expanded, setExpanded] = useState(false);
    const detailsId = useId();

    const resolveEx = (id: string) => {
        const builtIn = getExerciseById(id);
        if (builtIn) return { name: builtIn.name, emoji: builtIn.emoji, sec: builtIn.sec, type: builtIn.type };
        const mapped = exerciseMap?.get(id);
        return mapped ? { ...mapped, type: 'stretch' as const } : null;
    };

    // Exclude rest exercises from total time display
    const totalSec = group.exerciseIds.reduce((sum, id) => {
        const ex = resolveEx(id);
        return sum + (ex && ex.type !== 'rest' ? ex.sec : 0);
    }, 0);
    const minutes = Math.ceil(totalSec / 60);
    const exerciseCount = group.exerciseIds.filter(id => resolveEx(id)?.type !== 'rest').length;
    const openDetailsLabel = expanded ? `${group.name}の詳細を閉じる` : `${group.name}の詳細を開く`;
    const playLabel = `${group.name}をはじめる。約${minutes}分、${exerciseCount}種目`;

    return (
        <motion.div
            className="card"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            style={{ padding: 0, overflow: 'hidden' }}
        >
            {/* Main row */}
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    padding: '16px 16px',
                }}
            >
                <button
                    type="button"
                    onClick={onTap}
                    aria-label={playLabel}
                    style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 14,
                        border: 'none',
                        background: 'none',
                        padding: 0,
                        cursor: 'pointer',
                        textAlign: 'left',
                    }}
                >
                    <div style={{
                        width: 48,
                        height: 48,
                        borderRadius: 16,
                        background: 'linear-gradient(135deg, #E8F8F0, #FFE5D9)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                    }}>
                        <ExerciseIcon id={group.exerciseIds[0] || 'S01'} emoji={group.emoji} size={24} color="#2BBAA0" />
                    </div>

                    <div style={{ flex: 1 }}>
                        <div style={{
                            fontFamily: "'Noto Sans JP', sans-serif",
                            fontSize: 16,
                            fontWeight: 700,
                            color: '#2D3436',
                            marginBottom: 2,
                        }}>
                            {group.name}
                            {isTeacher && (
                                <span style={{
                                    fontFamily: "'Noto Sans JP', sans-serif",
                                    fontSize: 9,
                                    fontWeight: 700,
                                    color: '#0984E3',
                                    background: 'rgba(9, 132, 227, 0.1)',
                                    padding: '1px 5px',
                                    borderRadius: 6,
                                    marginLeft: 6,
                                    display: 'inline-block',
                                    verticalAlign: 'middle',
                                }}>
                                    先生
                                </span>
                            )}
                            {isNew && (
                                <span style={{
                                    fontFamily: "'Outfit', sans-serif",
                                    fontSize: 9,
                                    fontWeight: 700,
                                    color: '#FFF',
                                    background: '#FF6B6B',
                                    padding: '1px 5px',
                                    borderRadius: 6,
                                    marginLeft: 4,
                                    display: 'inline-block',
                                    verticalAlign: 'middle',
                                }}>
                                    New
                                </span>
                            )}
                            {creatorName && (
                                <span style={{
                                    fontFamily: "'Noto Sans JP', sans-serif",
                                    fontSize: 10,
                                    fontWeight: 600,
                                    color: '#2BBAA0',
                                    background: 'rgba(43, 186, 160, 0.1)',
                                    padding: '2px 6px',
                                    borderRadius: 8,
                                    marginLeft: 8,
                                    display: 'inline-block',
                                    verticalAlign: 'middle',
                                }}>
                                    👤 {creatorName}
                                </span>
                            )}
                        </div>
                        <div style={{
                            fontFamily: "'Noto Sans JP', sans-serif",
                            fontSize: 12,
                            color: '#8395A7',
                            display: 'flex',
                            gap: 8,
                            alignItems: 'center',
                        }}>
                            <Clock size={12} aria-hidden="true" />
                            <span>約{minutes}分</span>
                            <span aria-hidden="true">·</span>
                            <span>{exerciseCount}種目</span>
                        </div>
                    </div>

                    <div
                        aria-hidden="true"
                        style={{
                            width: 32,
                            height: 32,
                            borderRadius: '50%',
                            background: '#2BBAA0',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <Play size={14} color="white" fill="white" />
                    </div>
                </button>

                <button
                    type="button"
                    onClick={() => setExpanded(!expanded)}
                    aria-expanded={expanded}
                    aria-controls={detailsId}
                    aria-label={openDetailsLabel}
                    style={{
                        width: 32,
                        height: 32,
                        borderRadius: 10,
                        border: 'none',
                        background: 'rgba(0,0,0,0.04)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                    }}
                >
                    <ChevronDown
                        size={16}
                        color="#B2BEC3"
                        aria-hidden="true"
                        style={{
                            transform: expanded ? 'rotate(180deg)' : 'rotate(0)',
                            transition: 'transform 0.2s ease',
                        }}
                    />
                </button>
            </div>

            {/* Expanded exercise list */}
            <AnimatePresence>
                {expanded && (
                    <motion.div
                        id={detailsId}
                        role="region"
                        aria-label={`${group.name}の詳細`}
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        style={{ overflow: 'hidden', borderTop: '1px solid rgba(0,0,0,0.05)' }}
                    >
                        <div style={{ padding: '10px 16px 12px' }}>
                            {group.description && (
                                <p style={{
                                    fontFamily: "'Noto Sans JP', sans-serif",
                                    fontSize: 12,
                                    color: '#8395A7',
                                    marginBottom: 8,
                                }}>
                                    {group.description}
                                </p>
                            )}
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                {group.exerciseIds.map((id, i) => {
                                    const ex = resolveEx(id);
                                    if (!ex) return null;
                                    return (
                                        <span key={`${id}-${i}`} style={{
                                            padding: '4px 10px',
                                            borderRadius: 8,
                                            background: 'rgba(0,0,0,0.04)',
                                            fontFamily: "'Noto Sans JP', sans-serif",
                                            fontSize: 12,
                                            color: '#2D3436',
                                        }}>
                                            {ex.emoji} {ex.name}
                                        </span>
                                    );
                                })}
                            </div>
                            {isCustom && isPublished && downloadCount != null && (
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 4,
                                    marginTop: 8,
                                    fontFamily: "'Noto Sans JP', sans-serif",
                                    fontSize: 11,
                                    color: '#0984E3',
                                }}>
                                    <Download size={11} />
                                    {downloadCount}人がつかってるよ
                                </div>
                            )}
                            {isCustom && (
                                <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                                    <button
                                        type="button"
                                        onClick={() => onEdit?.()}
                                        aria-label={`${group.name}をへんしゅう`}
                                        style={{
                                            padding: '6px 12px',
                                            borderRadius: 8,
                                            border: '1px solid rgba(0,0,0,0.1)',
                                            background: 'white',
                                            cursor: 'pointer',
                                            fontFamily: "'Noto Sans JP', sans-serif",
                                            fontSize: 12,
                                            color: '#8395A7',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 4,
                                        }}
                                    >
                                        <Edit2 size={12} />
                                        へんしゅう
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => onDelete?.()}
                                        aria-label={`${group.name}をさくじょ`}
                                        style={{
                                            padding: '6px 12px',
                                            borderRadius: 8,
                                            border: 'none',
                                            background: 'rgba(225, 112, 85, 0.08)',
                                            cursor: 'pointer',
                                            fontFamily: "'Noto Sans JP', sans-serif",
                                            fontSize: 12,
                                            color: '#E17055',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 4,
                                        }}
                                    >
                                        <Trash2 size={12} />
                                        さくじょ
                                    </button>
                                    {isPublished ? (
                                        <button
                                            type="button"
                                            onClick={() => onUnpublish?.()}
                                            aria-label={`${group.name}をひこうかいにする`}
                                            style={{
                                                padding: '6px 12px',
                                                borderRadius: 8,
                                                border: 'none',
                                                background: 'rgba(225, 112, 85, 0.08)',
                                                cursor: 'pointer',
                                                fontFamily: "'Noto Sans JP', sans-serif",
                                                fontSize: 12,
                                                color: '#E17055',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 4,
                                            }}
                                        >
                                            <EyeOff size={12} />
                                            ひこうかい
                                        </button>
                                    ) : onPublish && (
                                        <button
                                            type="button"
                                            onClick={() => onPublish()}
                                            aria-label={`${group.name}をこうかいする`}
                                            style={{
                                                padding: '6px 12px',
                                                borderRadius: 8,
                                                border: 'none',
                                                background: 'rgba(9, 132, 227, 0.08)',
                                                cursor: 'pointer',
                                                fontFamily: "'Noto Sans JP', sans-serif",
                                                fontSize: 12,
                                                color: '#0984E3',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 4,
                                            }}
                                        >
                                            <Upload size={12} />
                                            こうかい
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};
