import React from 'react';
import { Reorder } from 'framer-motion';
import { DurationSecondsPicker } from '@/components/DurationSecondsPicker';
import { getExerciseById } from '@/data/exercises';
import type { MenuGroupItem } from '@/data/menuGroups';
import type { QuickAddDraft } from './createGroupViewShared';
import type { PickerExercise } from './ExercisePickerList';
import { MenuItemRow, type DisplayMenuExercise } from './MenuItemRow';

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

export function resolveMenuItemExercise(
    item: MenuGroupItem,
    allExercises?: PickerExercise[],
): DisplayMenuExercise | null {
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

export function getMenuItemRenderKey(item: MenuGroupItem, _index: number): string {
    return item.id;
}

const reorderGroupStyle = {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 10,
    marginBottom: 16,
    padding: 0,
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
