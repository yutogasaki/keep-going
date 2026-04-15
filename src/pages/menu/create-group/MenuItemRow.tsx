import React from 'react';
import { motion, Reorder, useDragControls } from 'framer-motion';
import { ArrowDown, ArrowUp, GripVertical } from 'lucide-react';
import { DurationSecondsPicker } from '../../../components/DurationSecondsPicker';
import type { MenuGroupItem } from '../../../data/menuGroups';

export interface DisplayMenuExercise {
    id: string;
    name: string;
    sec: number;
    emoji: string;
    placement: string;
}

interface MenuItemRowProps {
    item: MenuGroupItem;
    index: number;
    exercise: DisplayMenuExercise;
    editableExerciseIds: string[];
    editingInlineItemId: string | null;
    itemsLength: number;
    onMoveItem: (fromIndex: number, toIndex: number) => void;
    onRemoveAtIndex: (index: number) => void;
    onOpenInlineEditor: (itemId: string | null) => void;
    onUpdateInlineItem: (itemId: string, updates: { name?: string; sec?: number }) => void;
    onPromoteInlineItem: (itemId: string, options?: { openEditor?: boolean }) => void;
    onEditExercise: (exerciseId: string) => void;
}

function fieldStyle() {
    return {
        width: '100%',
        padding: '10px 12px',
        borderRadius: 12,
        border: '1px solid rgba(0,0,0,0.08)',
        fontFamily: "'Noto Sans JP', sans-serif",
        fontSize: 14,
        color: '#2D3436',
        background: 'white',
        boxSizing: 'border-box' as const,
    };
}

export const MenuItemRow: React.FC<MenuItemRowProps> = ({
    item,
    index,
    exercise,
    editableExerciseIds,
    editingInlineItemId,
    itemsLength,
    onMoveItem,
    onRemoveAtIndex,
    onOpenInlineEditor,
    onUpdateInlineItem,
    onPromoteInlineItem,
    onEditExercise,
}) => {
    const dragControls = useDragControls();
    const isInline = item.kind === 'inline_only';
    const isEditing = editingInlineItemId === item.id;
    const canEditExercise = item.kind === 'exercise_ref'
        && editableExerciseIds.includes(item.exerciseId);
    const canMoveUp = index > 0;
    const canMoveDown = index < itemsLength - 1;

    return (
        <Reorder.Item
            as="div"
            value={item}
            drag="y"
            dragListener={false}
            dragControls={dragControls}
            dragElastic={0.08}
            layout="position"
            style={{
                borderRadius: 16,
                background: isInline ? 'rgba(255, 243, 224, 0.55)' : 'rgba(43, 186, 160, 0.06)',
                border: '1px solid rgba(0,0,0,0.05)',
                padding: '14px 16px',
                listStyle: 'none',
                touchAction: 'pan-y',
            }}
            whileDrag={{
                scale: 1.01,
                boxShadow: '0 12px 24px rgba(0,0,0,0.10)',
                zIndex: 2,
            }}
        >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
                    <motion.button
                        type="button"
                        whileTap={{ scale: 0.95 }}
                        onPointerDown={(event) => dragControls.start(event)}
                        aria-label="ドラッグして並び替え"
                        style={{
                            width: 30,
                            height: 34,
                            borderRadius: 10,
                            border: 'none',
                            background: 'rgba(0,0,0,0.06)',
                            color: '#52606D',
                            cursor: 'grab',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: 0,
                            touchAction: 'none',
                        }}
                    >
                        <GripVertical size={16} />
                    </motion.button>
                    <button
                        type="button"
                        onClick={() => onMoveItem(index, index - 1)}
                        disabled={!canMoveUp}
                        aria-label="上へ"
                        style={{
                            width: 30,
                            height: 30,
                            borderRadius: 10,
                            border: 'none',
                            background: canMoveUp ? 'rgba(0,0,0,0.06)' : 'rgba(0,0,0,0.03)',
                            color: canMoveUp ? '#52606D' : '#C5CDD3',
                            cursor: canMoveUp ? 'pointer' : 'default',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: 0,
                        }}
                    >
                        <ArrowUp size={14} />
                    </button>
                    <button
                        type="button"
                        onClick={() => onMoveItem(index, index + 1)}
                        disabled={!canMoveDown}
                        aria-label="下へ"
                        style={{
                            width: 30,
                            height: 30,
                            borderRadius: 10,
                            border: 'none',
                            background: canMoveDown ? 'rgba(0,0,0,0.06)' : 'rgba(0,0,0,0.03)',
                            color: canMoveDown ? '#52606D' : '#C5CDD3',
                            cursor: canMoveDown ? 'pointer' : 'default',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: 0,
                        }}
                    >
                        <ArrowDown size={14} />
                    </button>
                </div>
                <button
                    type="button"
                    onClick={() => isInline ? onOpenInlineEditor(isEditing ? null : item.id) : null}
                    style={{
                        flex: 1,
                        border: 'none',
                        background: 'transparent',
                        textAlign: 'left',
                        padding: 0,
                        cursor: isInline ? 'pointer' : 'default',
                    }}
                >
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        marginBottom: 6,
                        flexWrap: 'wrap',
                    }}>
                        <span style={{ fontSize: 22 }}>{exercise.emoji}</span>
                        <span style={{
                            fontFamily: "'Noto Sans JP', sans-serif",
                            fontSize: 15,
                            fontWeight: 700,
                            color: '#2D3436',
                        }}>
                            {exercise.name}
                        </span>
                        <span style={{
                            fontFamily: "'Noto Sans JP', sans-serif",
                            fontSize: 11,
                            fontWeight: 700,
                            color: isInline ? '#C27803' : '#2B7A6E',
                            background: isInline ? 'rgba(255, 183, 77, 0.18)' : 'rgba(43, 186, 160, 0.12)',
                            padding: '4px 8px',
                            borderRadius: 9999,
                        }}>
                            {isInline ? 'このメニューだけ' : '種目'}
                        </span>
                    </div>
                    <div style={{
                        fontFamily: "'Noto Sans JP', sans-serif",
                        fontSize: 12,
                        color: '#8395A7',
                    }}>
                        {exercise.sec}秒
                    </div>
                    <div style={{
                        fontFamily: "'Noto Sans JP', sans-serif",
                        fontSize: 11,
                        color: '#98A6AF',
                        marginTop: 4,
                    }}>
                        {isInline
                            ? 'この画面で編集できます'
                            : canEditExercise
                                ? 'くわしく編集できます'
                                : '内容は種目で編集'}
                    </div>
                </button>
                {canEditExercise ? (
                    <button
                        type="button"
                        onClick={() => onEditExercise(item.exerciseId)}
                        style={{
                            padding: '9px 10px',
                            borderRadius: 12,
                            border: 'none',
                            background: 'rgba(43, 186, 160, 0.12)',
                            color: '#2B7A6E',
                            fontFamily: "'Noto Sans JP', sans-serif",
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: 'pointer',
                            flexShrink: 0,
                        }}
                    >
                        くわしく編集
                    </button>
                ) : null}
                <motion.button
                    type="button"
                    whileTap={{ scale: 0.94 }}
                    onClick={() => onRemoveAtIndex(index)}
                    style={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        border: 'none',
                        background: 'rgba(0,0,0,0.06)',
                        color: '#52606D',
                        cursor: 'pointer',
                        fontSize: 16,
                        flexShrink: 0,
                    }}
                >
                    ×
                </motion.button>
            </div>

            {isInline && isEditing ? (
                <div style={{
                    marginTop: 12,
                    paddingTop: 12,
                    borderTop: '1px solid rgba(0,0,0,0.06)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10,
                }}>
                    <div>
                        <div style={{
                            fontFamily: "'Noto Sans JP', sans-serif",
                            fontSize: 12,
                            fontWeight: 700,
                            color: '#52606D',
                            marginBottom: 6,
                        }}>
                            名前
                        </div>
                        <input
                            value={item.name}
                            onChange={(event) => onUpdateInlineItem(item.id, { name: event.target.value })}
                            style={fieldStyle()}
                        />
                    </div>
                    <div>
                        <div style={{
                            fontFamily: "'Noto Sans JP', sans-serif",
                            fontSize: 12,
                            fontWeight: 700,
                            color: '#52606D',
                            marginBottom: 6,
                        }}>
                            時間
                        </div>
                        <DurationSecondsPicker
                            value={item.sec}
                            onChange={(seconds) => onUpdateInlineItem(item.id, { sec: seconds })}
                            compact
                        />
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <button
                            type="button"
                            onClick={() => onPromoteInlineItem(item.id)}
                            style={{
                                padding: '10px 12px',
                                borderRadius: 12,
                                border: 'none',
                                background: 'rgba(43, 186, 160, 0.12)',
                                color: '#2B7A6E',
                                fontFamily: "'Noto Sans JP', sans-serif",
                                fontSize: 12,
                                fontWeight: 700,
                                cursor: 'pointer',
                            }}
                        >
                            じぶん種目にする
                        </button>
                        <button
                            type="button"
                            onClick={() => onPromoteInlineItem(item.id, { openEditor: true })}
                            style={{
                                padding: '10px 12px',
                                borderRadius: 12,
                                border: 'none',
                                background: '#FFB74D',
                                color: '#7A4500',
                                fontFamily: "'Noto Sans JP', sans-serif",
                                fontSize: 12,
                                fontWeight: 700,
                                cursor: 'pointer',
                            }}
                        >
                            じぶん種目にして編集
                        </button>
                        <button
                            type="button"
                            onClick={() => onOpenInlineEditor(null)}
                            style={{
                                padding: '10px 12px',
                                borderRadius: 12,
                                border: 'none',
                                background: 'rgba(0,0,0,0.06)',
                                color: '#52606D',
                                fontFamily: "'Noto Sans JP', sans-serif",
                                fontSize: 12,
                                fontWeight: 700,
                                cursor: 'pointer',
                            }}
                        >
                            完了
                        </button>
                    </div>
                </div>
            ) : null}
        </Reorder.Item>
    );
};
