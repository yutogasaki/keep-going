import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ListChecks } from 'lucide-react';
import { COLOR, FONT, FONT_SIZE, RADIUS, SPACE } from '../../lib/styles';
import { CustomExerciseList } from './individual-tab/CustomExerciseList';
import { StandardExerciseList } from './individual-tab/StandardExerciseList';
import { CreateCustomExerciseCard } from './individual-tab/CreateCustomExerciseCard';
import { SelectionBar } from './individual-tab/SelectionBar';
import { DISPLAY_TERMS } from '../../lib/terminology';
import type { MenuIndividualTabProps } from './individual-tab/types';
import {
    filterCustomExercisesByCategory,
    filterStandardExercisesByCategory,
    getAvailableIndividualCategories,
    INDIVIDUAL_CATEGORY_OPTIONS,
    type IndividualCategoryId,
    shouldShowCustomExercises,
} from './individual-tab/selectionCategories';

export const MenuIndividualTab: React.FC<MenuIndividualTabProps & {
    onStartHybridSession?: (requiredIds: string[]) => void;
}> = ({
    exercises,
    requiredExercises,
    customExercises,
    isTogetherMode,
    getCreatorName,
    onStartExercise,
    onEditCustomExercise,
    onDeleteCustomExercise,
    onStartCustomExercise,
    onCreateCustomExercise,
    teacherExerciseIds,
    isNewTeacherContent,
    canPublish,
    findPublishedExercise,
    onPublishExercise,
    onUnpublishExercise,
    onOpenPublicExerciseBrowser,
    onStartHybridSession,
}) => {
    const selectionEnabled = Boolean(onStartHybridSession);
    const [selectionMode, setSelectionMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [category, setCategory] = useState<IndividualCategoryId>('all');

    const availableCategories = useMemo(
        () => getAvailableIndividualCategories(exercises, customExercises),
        [customExercises, exercises],
    );
    const filteredExercises = useMemo(
        () => filterStandardExercisesByCategory(exercises, category),
        [category, exercises],
    );
    const filteredCustomExercises = useMemo(
        () => filterCustomExercisesByCategory(customExercises, category),
        [category, customExercises],
    );
    const showCustomSection = useMemo(
        () => shouldShowCustomExercises(customExercises, category),
        [category, customExercises],
    );

    useEffect(() => {
        if (!availableCategories.includes(category)) {
            setCategory('all');
        }
    }, [availableCategories, category]);

    const handleToggleSelect = useCallback((exerciseId: string) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(exerciseId)) {
                next.delete(exerciseId);
            } else {
                next.add(exerciseId);
            }
            return next;
        });
    }, []);

    const handleReset = useCallback(() => {
        setSelectedIds(new Set());
    }, []);

    const handleStartHybrid = useCallback(() => {
        if (selectedIds.size > 0 && onStartHybridSession) {
            onStartHybridSession([...selectedIds]);
            setSelectionMode(false);
            setSelectedIds(new Set());
        }
    }, [selectedIds, onStartHybridSession]);

    const handleToggleMode = useCallback(() => {
        setSelectionMode((prev) => {
            if (prev) {
                setSelectedIds(new Set());
            }
            return !prev;
        });
    }, []);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '0 20px' }}>
            <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                    <div>
                        <h2 style={{
                            margin: 0,
                            fontFamily: FONT.body,
                            fontSize: FONT_SIZE.sm,
                            fontWeight: 700,
                            color: COLOR.muted,
                            letterSpacing: 1,
                        }}>
                            カテゴリでさがす
                        </h2>
                        <p style={{
                            margin: '6px 0 0',
                            fontFamily: FONT.body,
                            fontSize: 12,
                            color: COLOR.light,
                            lineHeight: 1.5,
                        }}>
                            みたい種目だけに しぼれます
                        </p>
                    </div>

                    {selectionEnabled && (
                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={handleToggleMode}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 5,
                                padding: '6px 14px',
                                borderRadius: 12,
                                border: selectionMode ? `2px solid ${COLOR.primary}` : '2px solid #DFE6E9',
                                background: selectionMode ? 'rgba(43, 186, 160, 0.08)' : 'transparent',
                                cursor: 'pointer',
                                fontFamily: FONT.body,
                                fontSize: 13,
                                fontWeight: 700,
                                color: selectionMode ? COLOR.primary : COLOR.muted,
                                transition: 'all 0.15s ease',
                                flexShrink: 0,
                            }}
                        >
                            <ListChecks size={15} />
                            {selectionMode ? 'えらびおわり' : 'えらぶ'}
                        </motion.button>
                    )}
                </div>

                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {INDIVIDUAL_CATEGORY_OPTIONS
                        .filter((option) => availableCategories.includes(option.id))
                        .map((option) => {
                            const active = option.id === category;
                            return (
                                <button
                                    key={option.id}
                                    type="button"
                                    onClick={() => setCategory(option.id)}
                                    style={{
                                        padding: '8px 12px',
                                        borderRadius: RADIUS.full,
                                        border: active ? `1.5px solid ${COLOR.primary}` : '1px solid rgba(0,0,0,0.08)',
                                        background: active ? 'rgba(43, 186, 160, 0.12)' : 'rgba(255,255,255,0.8)',
                                        color: active ? COLOR.primaryDark : COLOR.text,
                                        fontFamily: FONT.body,
                                        fontSize: 13,
                                        fontWeight: active ? 700 : 600,
                                        cursor: 'pointer',
                                    }}
                                >
                                    {option.label}
                                </button>
                            );
                        })}
                </div>

                {selectionEnabled && selectionMode && (
                    <div
                        className="card card-sm"
                        style={{
                            padding: `${SPACE.md}px ${SPACE.lg}px`,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 4,
                            border: '1px solid rgba(43, 186, 160, 0.16)',
                            background: 'linear-gradient(135deg, rgba(232,248,240,0.92) 0%, rgba(255,255,255,0.94) 100%)',
                        }}
                    >
                        <div style={{
                            fontFamily: FONT.body,
                            fontSize: 14,
                            fontWeight: 700,
                            color: COLOR.dark,
                        }}>
                            えらんだ種目を優先して おまかせスタート
                        </div>
                        <div style={{
                            fontFamily: FONT.body,
                            fontSize: 12,
                            color: COLOR.muted,
                            lineHeight: 1.5,
                        }}>
                            えらんだ種目は おまかせメニューに優先して入ります。じぶん種目も いっしょに選べます。
                        </div>
                    </div>
                )}
            </section>

            <StandardExerciseList
                exercises={filteredExercises}
                requiredExerciseIds={requiredExercises}
                onStartExercise={onStartExercise}
                teacherExerciseIds={teacherExerciseIds}
                isNewTeacherContent={isNewTeacherContent}
                selectionMode={selectionMode}
                selectedIds={selectedIds}
                onToggleSelect={handleToggleSelect}
            />

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 16 }}>
                <h2 style={{
                    fontFamily: "'Noto Sans JP', sans-serif",
                    fontSize: 13,
                    fontWeight: 700,
                    color: '#8395A7',
                    marginBottom: 10,
                    letterSpacing: 1,
                }}>
                    じぶん種目
                </h2>

                {showCustomSection ? (
                    <CustomExerciseList
                        customExercises={filteredCustomExercises}
                        isTogetherMode={isTogetherMode}
                        getCreatorName={getCreatorName}
                        onEdit={onEditCustomExercise}
                        onDelete={onDeleteCustomExercise}
                        onStart={onStartCustomExercise}
                        canPublish={canPublish}
                        findPublishedExercise={findPublishedExercise}
                        onPublish={onPublishExercise}
                        onUnpublish={onUnpublishExercise}
                        selectionMode={selectionMode}
                        selectedIds={selectedIds}
                        onToggleSelect={handleToggleSelect}
                    />
                ) : (
                    <div
                        className="card card-sm"
                        style={{
                            padding: '14px 16px',
                            fontFamily: FONT.body,
                            fontSize: 12,
                            color: COLOR.light,
                        }}
                    >
                        このカテゴリの じぶん種目はまだありません。
                    </div>
                )}

                <CreateCustomExerciseCard onCreate={onCreateCustomExercise} />
            </div>

            {/* みんなの種目 section */}
            {onOpenPublicExerciseBrowser && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 16 }}>
                    <h2 style={{
                        fontFamily: "'Noto Sans JP', sans-serif",
                        fontSize: 13,
                        fontWeight: 700,
                        color: '#8395A7',
                        marginBottom: 10,
                        letterSpacing: 1,
                    }}>
                        {DISPLAY_TERMS.publicExercise}
                    </h2>
                    <motion.button
                        whileTap={{ scale: 0.98 }}
                        onClick={onOpenPublicExerciseBrowser}
                        className="card"
                        style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 16,
                            padding: '16px 20px',
                            border: 'none',
                            background: 'white',
                            cursor: 'pointer',
                            textAlign: 'left',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                        }}
                    >
                        <div style={{
                            width: 44,
                            height: 44,
                            borderRadius: 14,
                            background: 'linear-gradient(135deg, #E8F4FD, #BEE3F8)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            boxShadow: '0 2px 8px rgba(190, 227, 248, 0.5)',
                        }}>
                            <span style={{ fontSize: 22 }}>🌍</span>
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{
                                fontFamily: "'Noto Sans JP', sans-serif",
                                fontSize: 15,
                                fontWeight: 700,
                                color: '#2D3436',
                                marginBottom: 4,
                            }}>
                                {DISPLAY_TERMS.publicExercise}を見る
                            </div>
                            <div style={{
                                fontFamily: "'Noto Sans JP', sans-serif",
                                fontSize: 12,
                                color: '#8395A7',
                                lineHeight: 1.4,
                            }}>
                                他の人が作った種目をもらおう
                            </div>
                        </div>
                    </motion.button>
                </div>
            )}

            {selectionEnabled && (
                <SelectionBar
                    count={selectedIds.size}
                    onStart={handleStartHybrid}
                    onReset={handleReset}
                />
            )}
        </div>
    );
};

