import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, Edit2, Play, Trash2 } from 'lucide-react';
import { CLASS_LEVELS } from '../../../data/exercises';
import type { MenuSettingStatus } from '../../../lib/teacherMenuSettings';

interface MenuSettingsItemCardProps {
    emoji: string;
    name: string;
    categoryLabel?: string;
    statusByClass: Record<string, MenuSettingStatus>;
    expanded: boolean;
    onToggleExpand: () => void;
    onStatusChange: (classLevel: string, newStatus: MenuSettingStatus) => void;
    onEdit?: () => void;
    onDelete?: () => void;
    onPlay?: () => void;
    itemType?: 'exercise' | 'menu_group';
}

const STATUS_OPTIONS: { status: MenuSettingStatus; bg: string; color: string; label: string; dotColor: string }[] = [
    { status: 'required', bg: '#E8F8F0', color: '#2BBAA0', label: '必須', dotColor: '#2BBAA0' },
    { status: 'optional', bg: '#F8F9FA', color: '#8395A7', label: 'おまかせ', dotColor: '#B2BEC3' },
    { status: 'excluded', bg: '#FFE4E1', color: '#E17055', label: '除外', dotColor: '#E17055' },
    { status: 'hidden', bg: '#F0E6FF', color: '#8B5CF6', label: '非表示', dotColor: '#8B5CF6' },
];

const STATUS_DOT_MAP: Record<MenuSettingStatus, string> = Object.fromEntries(
    STATUS_OPTIONS.map(o => [o.status, o.dotColor])
) as Record<MenuSettingStatus, string>;

export const MenuSettingsItemCard: React.FC<MenuSettingsItemCardProps> = ({
    emoji,
    name,
    categoryLabel,
    statusByClass,
    expanded,
    onToggleExpand,
    onStatusChange,
    onEdit,
    onDelete,
    onPlay,
    itemType = 'exercise',
}) => {
    return (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            {/* ─── Collapsed header ─── */}
            <button
                onClick={onToggleExpand}
                style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '14px 16px',
                    border: 'none',
                    background: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                }}
            >
                <span style={{ fontSize: 18, flexShrink: 0 }}>{emoji}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                        fontFamily: "'Noto Sans JP', sans-serif",
                        fontSize: 14,
                        fontWeight: 700,
                        color: '#2D3436',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                    }}>
                        {name}
                    </div>
                    {categoryLabel && (
                        <div style={{
                            fontFamily: "'Noto Sans JP', sans-serif",
                            fontSize: 11,
                            fontWeight: 600,
                            color: '#8395A7',
                            marginTop: 2,
                        }}>
                            {categoryLabel}
                        </div>
                    )}
                </div>

                {/* Status dots */}
                <div style={{ display: 'flex', gap: 3, flexShrink: 0 }}>
                    {CLASS_LEVELS.map(cl => {
                        const status = statusByClass[cl.id] || 'optional';
                        return (
                            <div
                                key={cl.id}
                                style={{
                                    width: 8,
                                    height: 8,
                                    borderRadius: '50%',
                                    background: STATUS_DOT_MAP[status],
                                    transition: 'background 0.15s ease',
                                }}
                            />
                        );
                    })}
                </div>

                <ChevronDown
                    size={16}
                    color="#B2BEC3"
                    style={{
                        transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s ease',
                        flexShrink: 0,
                    }}
                />
            </button>

            {/* ─── Expanded content ─── */}
            <AnimatePresence>
                {expanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        style={{ overflow: 'hidden' }}
                    >
                        <div style={{
                            borderTop: '1px solid rgba(0,0,0,0.05)',
                            padding: 16,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 14,
                        }}>
                            {/* Per-class status rows */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                {CLASS_LEVELS.map(cl => {
                                    const currentStatus = statusByClass[cl.id] || 'optional';
                                    const visibleOptions = itemType === 'menu_group'
                                        ? STATUS_OPTIONS
                                            .filter(o => o.status === 'optional' || o.status === 'hidden')
                                            .map(o => o.status === 'optional' ? { ...o, label: '表示' } : o)
                                        : STATUS_OPTIONS;
                                    return (
                                        <div
                                            key={cl.id}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 8,
                                                padding: '6px 0',
                                                borderBottom: '1px solid rgba(0,0,0,0.04)',
                                            }}
                                        >
                                            <span style={{ fontSize: 14, flexShrink: 0 }}>{cl.emoji}</span>
                                            <span style={{
                                                fontFamily: "'Noto Sans JP', sans-serif",
                                                fontSize: 12,
                                                fontWeight: 600,
                                                color: '#636E72',
                                                width: 36,
                                                flexShrink: 0,
                                            }}>
                                                {cl.id}
                                            </span>
                                            <div style={{ display: 'flex', gap: 4, flex: 1 }}>
                                                {visibleOptions.map(opt => {
                                                    const isActive = currentStatus === opt.status;
                                                    return (
                                                        <button
                                                            key={opt.status}
                                                            onClick={() => onStatusChange(cl.id, opt.status)}
                                                            style={{
                                                                flex: 1,
                                                                padding: '5px 2px',
                                                                borderRadius: 8,
                                                                border: isActive ? `2px solid ${opt.color}` : '2px solid transparent',
                                                                background: isActive ? opt.bg : '#F8F9FA',
                                                                color: isActive ? opt.color : '#B2BEC3',
                                                                fontFamily: "'Noto Sans JP', sans-serif",
                                                                fontSize: 10,
                                                                fontWeight: 700,
                                                                cursor: 'pointer',
                                                                transition: 'all 0.15s ease',
                                                            }}
                                                        >
                                                            {opt.label}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Action buttons */}
                            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                                {onPlay && (
                                    <button
                                        onClick={onPlay}
                                        style={{
                                            padding: '8px 16px',
                                            borderRadius: 10,
                                            border: 'none',
                                            background: 'rgba(43,186,160,0.1)',
                                            color: '#2BBAA0',
                                            fontFamily: "'Noto Sans JP', sans-serif",
                                            fontSize: 13,
                                            fontWeight: 700,
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 4,
                                        }}
                                    >
                                        <Play size={12} />
                                        ためす
                                    </button>
                                )}
                                {onEdit && (
                                    <button
                                        onClick={onEdit}
                                        style={{
                                            padding: '8px 16px',
                                            borderRadius: 10,
                                            border: 'none',
                                            background: 'rgba(0,0,0,0.04)',
                                            color: '#636E72',
                                            fontFamily: "'Noto Sans JP', sans-serif",
                                            fontSize: 13,
                                            fontWeight: 700,
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 4,
                                        }}
                                    >
                                        <Edit2 size={12} />
                                        編集
                                    </button>
                                )}
                                {onDelete && (
                                    <button
                                        onClick={onDelete}
                                        style={{
                                            padding: '8px 16px',
                                            borderRadius: 10,
                                            border: 'none',
                                            background: 'rgba(225,112,85,0.08)',
                                            color: '#E17055',
                                            fontFamily: "'Noto Sans JP', sans-serif",
                                            fontSize: 13,
                                            fontWeight: 700,
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 4,
                                        }}
                                    >
                                        <Trash2 size={12} />
                                        削除
                                    </button>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
