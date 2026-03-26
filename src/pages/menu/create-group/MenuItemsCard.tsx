import React from 'react';
import { motion, Reorder, useDragControls } from 'framer-motion';
import { ArrowDown, ArrowUp, GripVertical } from 'lucide-react';
import { DurationSecondsPicker } from '../../../components/DurationSecondsPicker';
import { getExerciseById } from '../../../data/exercises';
import type { MenuGroupItem } from '../../../data/menuGroups';
import type { PickerExercise } from './ExercisePickerList';

interface QuickAddDraft {
    name: string;
    sec: number;
    saveAsCustom: boolean;
}

export function getMenuItemRenderKey(item: MenuGroupItem, _index: number): string {
    return item.id;
}

interface MenuItemsCardProps {
    items: MenuGroupItem[];
    minutes: number;
    allExercises?: PickerExercise[];
    editableExerciseIds: string[];
    editingInlineItemId: string | null;
    quickAddDraft: QuickAddDraft;
    showQuickAdd: boolean;
    onQuickAddDraftChange: (updates: Partial<QuickAddDraft>) => void;
    onShowQuickAdd: (show: boolean) => void;
    onAddQuickItem: (options?: { openEditor?: boolean }) => void;
    onMoveItem: (fromIndex: number, toIndex: number) => void;
    onReorderItems: (items: MenuGroupItem[]) => void;
    onRemoveAtIndex: (index: number) => void;
    onOpenInlineEditor: (itemId: string | null) => void;
    onUpdateInlineItem: (itemId: string, updates: { name?: string; sec?: number }) => void;
    onPromoteInlineItem: (itemId: string, options?: { openEditor?: boolean }) => void;
    onEditExercise: (exerciseId: string) => void;
}

interface ResolvedMenuExercise {
    id: string;
    name: string;
    sec: number;
    emoji: string;
    placement: string;
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

function resolveMenuItemExercise(item: MenuGroupItem, allExercises?: PickerExercise[]): ResolvedMenuExercise | MenuGroupItem | null {
    if (item.kind === 'inline_only') {
        return item;
    }

    const builtIn = getExerciseById(item.exerciseId);
    if (builtIn) {
        return builtIn;
    }

    const extra = allExercises?.find((exercise) => exercise.id === item.exerciseId);
    return extra ? {
        id: extra.id,
        name: extra.name,
        sec: extra.sec,
        emoji: extra.emoji,
        placement: extra.placement ?? 'stretch',
    } : null;
}

interface MenuItemRowProps {
    item: MenuGroupItem;
    index: number;
    exercise: ResolvedMenuExercise | MenuGroupItem;
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

const reorderGroupStyle = {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 10,
    marginBottom: 16,
    padding: 0,
};

const MenuItemRow: React.FC<MenuItemRowProps> = ({
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
            key={getMenuItemRenderKey(item, index)}
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

export const MenuItemsCard: React.FC<MenuItemsCardProps> = ({
    items,
    minutes,
    allExercises,
    editableExerciseIds,
    editingInlineItemId,
    quickAddDraft,
    showQuickAdd,
    onQuickAddDraftChange,
    onShowQuickAdd,
    onAddQuickItem,
    onMoveItem,
    onReorderItems,
    onRemoveAtIndex,
    onOpenInlineEditor,
    onUpdateInlineItem,
    onPromoteInlineItem,
    onEditExercise,
}) => {
    return (
        <div className="card" style={{ padding: '20px', boxShadow: '0 4px 16px rgba(0,0,0,0.03)', border: 'none' }}>
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 16,
            }}>
                <label style={{
                    fontFamily: "'Noto Sans JP', sans-serif",
                    fontSize: 13,
                    fontWeight: 700,
                    color: '#2D3436',
                }}>
                    入れている項目（{items.length}）
                </label>
                <span style={{
                    fontFamily: "'Outfit', sans-serif",
                    fontSize: 13,
                    fontWeight: 700,
                    color: '#2BBAA0',
                    background: 'rgba(43, 186, 160, 0.1)',
                    padding: '4px 10px',
                    borderRadius: 10,
                }}>
                    約{minutes}分
                </span>
            </div>

            {items.length === 0 ? (
                <div style={{
                    background: '#F8F9FA',
                    borderRadius: 16,
                    padding: '24px 16px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    border: '2px dashed rgba(0,0,0,0.05)',
                    marginBottom: 16,
                }}>
                    <div style={{ fontSize: 24, opacity: 0.5 }}>👇</div>
                    <p style={{
                        fontFamily: "'Noto Sans JP', sans-serif",
                        fontSize: 13,
                        color: '#8395A7',
                        textAlign: 'center',
                        margin: 0,
                        fontWeight: 600,
                    }}>
                        下から種目を足すか、さっと追加してね
                    </p>
                </div>
            ) : (
                <>
                    <div style={{
                        fontFamily: "'Noto Sans JP', sans-serif",
                        fontSize: 11,
                        fontWeight: 700,
                        color: '#8395A7',
                        marginBottom: 10,
                    }}
                    >
                        左のつまみをドラッグして順番を変えられるよ
                    </div>
                    <Reorder.Group
                        axis="y"
                        as="div"
                        values={items}
                        onReorder={onReorderItems}
                        layoutScroll
                        style={reorderGroupStyle}
                    >
                        {items.map((item, index) => {
                            const exercise = resolveMenuItemExercise(item, allExercises);
                            if (!exercise) {
                                return null;
                            }

                            return (
                                <MenuItemRow
                                    key={getMenuItemRenderKey(item, index)}
                                    item={item}
                                    index={index}
                                    exercise={exercise}
                                    editableExerciseIds={editableExerciseIds}
                                    editingInlineItemId={editingInlineItemId}
                                    itemsLength={items.length}
                                    onMoveItem={onMoveItem}
                                    onRemoveAtIndex={onRemoveAtIndex}
                                    onOpenInlineEditor={onOpenInlineEditor}
                                    onUpdateInlineItem={onUpdateInlineItem}
                                    onPromoteInlineItem={onPromoteInlineItem}
                                    onEditExercise={onEditExercise}
                                />
                            );
                        })}
                    </Reorder.Group>
                </>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{
                    fontFamily: "'Noto Sans JP', sans-serif",
                    fontSize: 13,
                    fontWeight: 700,
                    color: '#2D3436',
                }}>
                    追加する
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                    <span
                        style={{
                            padding: '10px 14px',
                            borderRadius: 12,
                            background: 'rgba(43, 186, 160, 0.08)',
                            color: '#2B7A6E',
                            fontFamily: "'Noto Sans JP', sans-serif",
                            fontSize: 13,
                            fontWeight: 700,
                        }}
                    >
                        下の一覧から種目を追加
                    </span>
                    <button
                        type="button"
                        onClick={() => onShowQuickAdd(!showQuickAdd)}
                        style={{
                            padding: '10px 14px',
                            borderRadius: 12,
                            border: 'none',
                            background: 'rgba(255, 183, 77, 0.16)',
                            color: '#A96600',
                            fontFamily: "'Noto Sans JP', sans-serif",
                            fontSize: 13,
                            fontWeight: 700,
                            cursor: 'pointer',
                        }}
                    >
                        + さっと追加
                    </button>
                </div>

                {showQuickAdd ? (
                    <div style={{
                        marginTop: 4,
                        borderRadius: 16,
                        border: '1px solid rgba(255, 183, 77, 0.3)',
                        background: 'rgba(255, 248, 238, 0.8)',
                        padding: '14px 16px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 10,
                    }}>
                        <div style={{
                            fontFamily: "'Noto Sans JP', sans-serif",
                            fontSize: 13,
                            fontWeight: 700,
                            color: '#A96600',
                        }}>
                            このメニューだけ追加
                        </div>
                        <input
                            placeholder="例: おへやジャンプ"
                            value={quickAddDraft.name}
                            onChange={(event) => onQuickAddDraftChange({ name: event.target.value })}
                            style={fieldStyle()}
                        />
                        <div style={{
                            fontFamily: "'Noto Sans JP', sans-serif",
                            fontSize: 12,
                            fontWeight: 700,
                            color: '#52606D',
                        }}>
                            時間
                        </div>
                        <DurationSecondsPicker
                            value={quickAddDraft.sec}
                            onChange={(seconds) => onQuickAddDraftChange({ sec: seconds })}
                            compact
                        />
                        <label style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            fontFamily: "'Noto Sans JP', sans-serif",
                            fontSize: 12,
                            color: '#52606D',
                        }}>
                            <input
                                type="checkbox"
                                checked={quickAddDraft.saveAsCustom}
                                onChange={(event) => onQuickAddDraftChange({ saveAsCustom: event.target.checked })}
                            />
                            じぶん種目にも保存
                        </label>
                        <div style={{
                            fontFamily: "'Noto Sans JP', sans-serif",
                            fontSize: 11,
                            color: '#98A6AF',
                        }}>
                            OFFなら、このメニューだけで使います
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                            <button
                                type="button"
                                onClick={() => onShowQuickAdd(false)}
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
                                やめる
                            </button>
                            <button
                                type="button"
                                onClick={() => onAddQuickItem({ openEditor: quickAddDraft.saveAsCustom })}
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
                                {quickAddDraft.saveAsCustom ? '追加して編集' : '追加'}
                            </button>
                        </div>
                    </div>
                ) : null}
            </div>
        </div>
    );
};
