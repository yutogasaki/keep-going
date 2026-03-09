import React, { useEffect, useMemo, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { fetchRecommendedExercises, type PublicExercise } from '../lib/publicExercises';
import { fetchRecommendedMenus, type PublicMenu } from '../lib/publicMenus';
import { COLOR, FONT, FONT_SIZE, SPACE } from '../lib/styles';
import { CANONICAL_TERMS, DISPLAY_TERMS } from '../lib/terminology';
import { PublicMenuCard } from './PublicMenuCard';
import { PublicExerciseCard } from './PublicExerciseCard';

type PublicHighlight =
    | { kind: 'menu'; item: PublicMenu }
    | { kind: 'exercise'; item: PublicExercise };

interface PopularMenusRowProps {
    onOpenMenuBrowser: () => void;
    onOpenExerciseBrowser: () => void;
    onMenuTap: (menu: PublicMenu) => void;
    onExerciseTap: (exercise: PublicExercise) => void;
}

function buildHighlightItems(
    menus: PublicMenu[],
    exercises: PublicExercise[],
    limit = 4,
): PublicHighlight[] {
    const result: PublicHighlight[] = [];
    const maxLength = Math.max(menus.length, exercises.length);

    for (let index = 0; index < maxLength && result.length < limit; index += 1) {
        const menu = menus[index];
        if (menu) {
            result.push({ kind: 'menu', item: menu });
            if (result.length >= limit) {
                break;
            }
        }

        const exercise = exercises[index];
        if (exercise) {
            result.push({ kind: 'exercise', item: exercise });
            if (result.length >= limit) {
                break;
            }
        }
    }

    return result;
}

export const PopularMenusRow: React.FC<PopularMenusRowProps> = ({
    onOpenMenuBrowser,
    onOpenExerciseBrowser,
    onMenuTap,
    onExerciseTap,
}) => {
    const [menus, setMenus] = useState<PublicMenu[]>([]);
    const [exercises, setExercises] = useState<PublicExercise[]>([]);

    useEffect(() => {
        Promise.all([
            fetchRecommendedMenus(),
            fetchRecommendedExercises(),
        ]).then(([nextMenus, nextExercises]) => {
            setMenus(nextMenus);
            setExercises(nextExercises);
        }).catch(console.warn);
    }, []);

    const items = useMemo(
        () => buildHighlightItems(menus, exercises),
        [menus, exercises],
    );

    if (items.length === 0) return null;

    return (
        <div>
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
                    {DISPLAY_TERMS.publicHub}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: SPACE.sm }}>
                    <button
                        onClick={onOpenMenuBrowser}
                        style={headerLinkStyle}
                    >
                        {CANONICAL_TERMS.menu}
                        <ChevronRight size={14} />
                    </button>
                    <button
                        onClick={onOpenExerciseBrowser}
                        style={headerLinkStyle}
                    >
                        {CANONICAL_TERMS.exercise}
                        <ChevronRight size={14} />
                    </button>
                </div>
            </div>

            <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: SPACE.sm,
            }}>
                {items.map((entry) => (
                    entry.kind === 'menu'
                        ? <PublicMenuCard key={`menu-${entry.item.id}`} menu={entry.item} onTap={onMenuTap} />
                        : <PublicExerciseCard key={`exercise-${entry.item.id}`} exercise={entry.item} onTap={onExerciseTap} />
                ))}
            </div>
        </div>
    );
};

const headerLinkStyle: React.CSSProperties = {
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
};
