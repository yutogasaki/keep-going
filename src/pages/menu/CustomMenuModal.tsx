import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import type { ClassLevel } from '../../data/exercises';
import type { CustomExercise } from '../../lib/db';
import { COLOR, FONT, FONT_SIZE, RADIUS, Z } from '../../lib/styles';
import type { TeacherExercise } from '../../lib/teacherContent';
import type { TeacherMenuSetting } from '../../lib/teacherMenuSettings';
import { CustomMenuDailyTargetCard } from './custom-menu-modal/CustomMenuDailyTargetCard';
import { CustomMenuExerciseCard } from './custom-menu-modal/CustomMenuExerciseCard';
import { CustomMenuTogetherModeNotice } from './custom-menu-modal/CustomMenuTogetherModeNotice';
import {
    buildMenuExerciseItems,
    summarizeMenuExerciseItems,
    type FilterId,
} from './custom-menu-modal/menuExerciseItems';

interface CustomMenuModalProps {
    show: boolean;
    isTogetherMode: boolean;
    classLevel: ClassLevel;
    dailyTargetMinutes: number;
    requiredExercises: string[];
    excludedExercises: string[];
    customExercises: CustomExercise[];
    teacherExercises?: TeacherExercise[];
    teacherSettings?: TeacherMenuSetting[];
    teacherExcludedExerciseIds?: Set<string>;
    teacherRequiredExerciseIds?: Set<string>;
    teacherHiddenExerciseIds?: Set<string>;
    onClose: () => void;
    onSetDailyTargetMinutes: (mins: number) => void;
    onSetExcludedExercises: (ids: string[]) => void;
    onSetRequiredExercises: (ids: string[]) => void;
}

export const CustomMenuModal: React.FC<CustomMenuModalProps> = ({
    show,
    isTogetherMode,
    classLevel,
    dailyTargetMinutes,
    requiredExercises,
    excludedExercises,
    customExercises,
    teacherExercises,
    teacherSettings,
    teacherExcludedExerciseIds,
    teacherRequiredExerciseIds,
    teacherHiddenExerciseIds,
    onClose,
    onSetDailyTargetMinutes,
    onSetExcludedExercises,
    onSetRequiredExercises,
}) => {
    const trapRef = useFocusTrap<HTMLDivElement>(show);
    const [query, setQuery] = useState('');
    const [filter, setFilter] = useState<FilterId>('all');

    if (!show) return null;

    const exerciseItems = buildMenuExerciseItems({
        classLevel,
        customExercises,
        excludedExercises,
        filter,
        query,
        requiredExercises,
        teacherExercises,
        teacherSettings,
        teacherExcludedExerciseIds,
        teacherHiddenExerciseIds,
        teacherRequiredExerciseIds,
    });
    const { changedCount, excludedCount, requiredCount, visibleItems } = summarizeMenuExerciseItems(exerciseItems);

    return createPortal(
        <div
            ref={trapRef}
            role="dialog"
            aria-modal="true"
            aria-label="おまかせの設定"
            style={{
                position: 'fixed',
                inset: 0,
                background: COLOR.bgLight,
                zIndex: Z.sheet,
                display: 'flex',
                flexDirection: 'column',
            }}
        >
            <div
                style={{
                    padding: '24px 24px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: COLOR.white,
                    borderBottom: `1px solid ${COLOR.border}`,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
                }}
            >
                <div>
                    <h2
                        style={{
                            fontFamily: FONT.body,
                            fontSize: FONT_SIZE.xl,
                            fontWeight: 700,
                            color: COLOR.dark,
                            margin: 0,
                            marginBottom: 4,
                        }}
                    >
                        おまかせの設定
                    </h2>
                    <p
                        style={{
                            fontFamily: FONT.body,
                            fontSize: FONT_SIZE.sm,
                            color: COLOR.muted,
                            margin: 0,
                        }}
                    >
                        毎日のルーティン内容を調整します
                    </p>
                </div>
                <button
                    type="button"
                    onClick={onClose}
                    aria-label="閉じる"
                    style={{
                        width: 40,
                        height: 40,
                        borderRadius: RADIUS.circle,
                        border: 'none',
                        background: COLOR.bgMuted,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                    }}
                >
                    <X size={20} color={COLOR.dark} />
                </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '24px 20px', position: 'relative' }}>
                {isTogetherMode && <CustomMenuTogetherModeNotice />}

                <CustomMenuDailyTargetCard
                    dailyTargetMinutes={dailyTargetMinutes}
                    disabled={isTogetherMode}
                    onSetDailyTargetMinutes={onSetDailyTargetMinutes}
                />

                <div style={{ opacity: isTogetherMode ? 0.6 : 1, pointerEvents: isTogetherMode ? 'none' : 'auto' }}>
                    <CustomMenuExerciseCard
                        changedCount={changedCount}
                        excludedCount={excludedCount}
                        excludedExercises={excludedExercises}
                        filter={filter}
                        query={query}
                        requiredCount={requiredCount}
                        requiredExercises={requiredExercises}
                        visibleItems={visibleItems}
                        onFilterChange={setFilter}
                        onQueryChange={setQuery}
                        onSetExcludedExercises={onSetExcludedExercises}
                        onSetRequiredExercises={onSetRequiredExercises}
                    />
                </div>
            </div>
        </div>,
        document.body,
    );
};
