import React, { useMemo } from 'react';
import { ChevronRight } from 'lucide-react';
import { GroupCard } from '../menu/GroupCard';
import type { TeacherMenu } from '../../lib/teacherContent';
import type { ExercisePlacement } from '../../data/exercisePlacement';
import type { MenuGroup } from '../../data/menuGroups';
import { COLOR, FONT, FONT_SIZE, SPACE } from '../../lib/styles';

interface HomeTeacherMenuHighlightsProps {
    menus: TeacherMenu[];
    exerciseMap: Map<string, { name: string; emoji: string; sec: number; placement: ExercisePlacement }>;
    isNewTeacherContent: (id: string) => boolean;
    onTap: (menu: TeacherMenu) => void;
    onOpenMenuTab: () => void;
}

function toMenuGroup(menu: TeacherMenu): MenuGroup {
    return {
        id: menu.id,
        name: menu.name,
        emoji: menu.emoji,
        description: menu.description,
        exerciseIds: menu.exerciseIds,
        isPreset: true,
        origin: 'teacher',
        visibility: menu.visibility,
        focusTags: menu.focusTags,
        recommended: menu.recommended,
        recommendedOrder: menu.recommendedOrder,
    };
}

export const HomeTeacherMenuHighlights: React.FC<HomeTeacherMenuHighlightsProps> = ({
    menus,
    exerciseMap,
    isNewTeacherContent,
    onTap,
    onOpenMenuTab,
}) => {
    const displayMenus = useMemo(
        () => menus.map((menu) => ({
            menu,
            group: toMenuGroup(menu),
        })),
        [menus],
    );

    if (displayMenus.length === 0) {
        return null;
    }

    return (
        <div
            style={{
                width: '100%',
                padding: '0 16px',
                marginTop: 20,
            }}
        >
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: SPACE.sm,
                marginBottom: 10,
                padding: '0 4px',
            }}>
                <span style={{
                    fontFamily: FONT.body,
                    fontSize: FONT_SIZE.sm + 1,
                    fontWeight: 700,
                    color: COLOR.text,
                }}>
                    先生から
                </span>
                <button
                    type="button"
                    onClick={onOpenMenuTab}
                    style={{
                        background: 'none',
                        border: 'none',
                        color: COLOR.info,
                        fontFamily: FONT.body,
                        fontSize: FONT_SIZE.sm,
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                        padding: 0,
                    }}
                >
                    メニューへ
                    <ChevronRight size={14} />
                </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: SPACE.sm }}>
                {displayMenus.map(({ menu, group }, index) => (
                    <GroupCard
                        key={group.id}
                        group={group}
                        index={index}
                        exerciseMap={exerciseMap}
                        onTap={() => onTap(menu)}
                        isTeacher
                        isNew={isNewTeacherContent(group.id)}
                    />
                ))}
            </div>
        </div>
    );
};
