import React from 'react';
import { Edit2, Trash2 } from 'lucide-react';
import { CLASS_LEVELS } from '../../../data/exercises';
import type { MenuSettingStatus } from '../../../lib/teacherMenuSettings';

interface MenuSettingsItemRowProps {
    emoji: string;
    name: string;
    /** Map of classLevel -> current status */
    statusByClass: Record<string, MenuSettingStatus>;
    onCycle: (classLevel: string) => void;
    /** If editable (teacher-created items) */
    onEdit?: () => void;
    onDelete?: () => void;
}

const STATUS_STYLES: Record<MenuSettingStatus, { bg: string; color: string; label: string }> = {
    required: { bg: '#E8F8F0', color: '#2BBAA0', label: '★' },
    optional: { bg: '#F8F9FA', color: '#8395A7', label: '⚪' },
    excluded: { bg: '#FFE4E1', color: '#E17055', label: '✕' },
};

export const MenuSettingsItemRow: React.FC<MenuSettingsItemRowProps> = ({
    emoji,
    name,
    statusByClass,
    onCycle,
    onEdit,
    onDelete,
}) => {
    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 0',
            borderBottom: '1px solid rgba(0,0,0,0.04)',
        }}>
            {/* Name */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                minWidth: 0,
                flex: '0 0 auto',
                width: 120,
            }}>
                <span style={{ fontSize: 16, flexShrink: 0 }}>{emoji}</span>
                <span style={{
                    fontFamily: "'Noto Sans JP', sans-serif",
                    fontSize: 12,
                    fontWeight: 600,
                    color: '#2D3436',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                }}>
                    {name}
                </span>
            </div>

            {/* Status buttons per class */}
            <div style={{ display: 'flex', gap: 4, flex: 1, justifyContent: 'center' }}>
                {CLASS_LEVELS.map(cl => {
                    const status = statusByClass[cl.id] || 'optional';
                    const style = STATUS_STYLES[status];
                    return (
                        <button
                            key={cl.id}
                            onClick={() => onCycle(cl.id)}
                            style={{
                                width: 32,
                                height: 28,
                                borderRadius: 8,
                                border: 'none',
                                background: style.bg,
                                color: style.color,
                                fontFamily: "'Noto Sans JP', sans-serif",
                                fontSize: 12,
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.15s ease',
                            }}
                        >
                            {style.label}
                        </button>
                    );
                })}
            </div>

            {/* Edit/Delete for teacher-created */}
            <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                {onEdit && (
                    <button
                        onClick={onEdit}
                        style={{
                            width: 28,
                            height: 28,
                            borderRadius: 8,
                            border: 'none',
                            background: 'rgba(0,0,0,0.04)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#8395A7',
                        }}
                    >
                        <Edit2 size={12} />
                    </button>
                )}
                {onDelete && (
                    <button
                        onClick={onDelete}
                        style={{
                            width: 28,
                            height: 28,
                            borderRadius: 8,
                            border: 'none',
                            background: 'rgba(225,112,85,0.08)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#E17055',
                        }}
                    >
                        <Trash2 size={12} />
                    </button>
                )}
                {/* Spacer for alignment when no buttons */}
                {!onEdit && !onDelete && <div style={{ width: 28 }} />}
            </div>
        </div>
    );
};
