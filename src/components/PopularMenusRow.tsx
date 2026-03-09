import React, { useEffect, useMemo, useState } from 'react';
import { ChevronRight, Clock, Download } from 'lucide-react';
import { getExercisePlacementLabel } from '../data/exercisePlacement';
import { fetchRecommendedExercises, type PublicExercise } from '../lib/publicExercises';
import { fetchRecommendedMenus, type PublicMenu } from '../lib/publicMenus';
import { COLOR, FONT, FONT_SIZE, RADIUS, SPACE } from '../lib/styles';
import { CANONICAL_TERMS, DISPLAY_TERMS } from '../lib/terminology';
import { PublicMenuCard } from './PublicMenuCard';

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
                        : <RecommendedExerciseCard key={`exercise-${entry.item.id}`} exercise={entry.item} onTap={onExerciseTap} />
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

const cardStyle: React.CSSProperties = {
    width: '100%',
    padding: `${SPACE.lg}px`,
    borderRadius: RADIUS.lg,
    border: '1px solid rgba(255,255,255,0.55)',
    background: 'rgba(255,255,255,0.96)',
    boxShadow: '0 4px 16px rgba(0,0,0,0.05)',
    cursor: 'pointer',
    textAlign: 'left',
    display: 'flex',
    flexDirection: 'column',
    gap: SPACE.sm,
    minHeight: 92,
};

const chipStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    padding: '4px 8px',
    borderRadius: RADIUS.full,
    background: 'rgba(0,0,0,0.04)',
    fontFamily: FONT.body,
    fontSize: FONT_SIZE.xs + 1,
    color: COLOR.light,
};

const RecommendedExerciseCard: React.FC<{
    exercise: PublicExercise;
    onTap: (exercise: PublicExercise) => void;
}> = ({ exercise, onTap }) => {
    return (
        <button
            onClick={() => onTap(exercise)}
            style={cardStyle}
        >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: SPACE.md, width: '100%' }}>
                <div style={iconContainerStyle}>
                    <span style={{ fontSize: 22, lineHeight: 1 }}>{exercise.emoji}</span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={titleStyle}>{exercise.name}</div>
                    <div style={subtitleStyle}>{exercise.authorName} さんの種目</div>
                </div>
                <span style={kindBadgeStyle}>{CANONICAL_TERMS.exercise}</span>
            </div>

            <div style={bodyTextStyle}>
                {exercise.description || `${getExercisePlacementLabel(exercise.placement)} の ${exercise.sec}秒の種目`}
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: SPACE.sm }}>
                <span style={chipStyle}>
                    <Clock size={11} />
                    {exercise.sec}秒
                </span>
                <span style={chipStyle}>{getExercisePlacementLabel(exercise.placement)}</span>
                <span style={chipStyle}>
                    <Download size={11} />
                    {exercise.downloadCount}
                </span>
            </div>
        </button>
    );
};

const iconContainerStyle: React.CSSProperties = {
    width: 40,
    height: 40,
    borderRadius: RADIUS.lg,
    background: 'rgba(43, 186, 160, 0.12)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
};

const titleStyle: React.CSSProperties = {
    fontFamily: FONT.body,
    fontSize: FONT_SIZE.md,
    fontWeight: 700,
    color: COLOR.dark,
    lineHeight: 1.35,
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
};

const subtitleStyle: React.CSSProperties = {
    fontFamily: FONT.body,
    fontSize: FONT_SIZE.xs + 1,
    color: COLOR.muted,
    marginTop: 2,
};

const bodyTextStyle: React.CSSProperties = {
    fontFamily: FONT.body,
    fontSize: FONT_SIZE.sm,
    color: COLOR.muted,
    lineHeight: 1.5,
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
    minHeight: 36,
};

const kindBadgeStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '4px 8px',
    borderRadius: RADIUS.full,
    background: 'rgba(43, 186, 160, 0.10)',
    color: COLOR.primaryDark,
    fontFamily: FONT.body,
    fontSize: FONT_SIZE.xs + 1,
    fontWeight: 700,
    flexShrink: 0,
};
