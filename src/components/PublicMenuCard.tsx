import React from 'react';
import { Clock, Download } from 'lucide-react';
import { EXERCISES } from '../data/exercises';
import { type PublicMenu } from '../lib/publicMenus';
import { COLOR, FONT, FONT_SIZE, RADIUS, SPACE } from '../lib/styles';
import { CANONICAL_TERMS } from '../lib/terminology';

interface PublicMenuCardProps {
    menu: PublicMenu;
    onTap: (menu: PublicMenu) => void;
}

export const PublicMenuCard: React.FC<PublicMenuCardProps> = ({ menu, onTap }) => {
    const resolveExercise = (id: string) =>
        EXERCISES.find((exercise) => exercise.id === id)
        ?? menu.customExerciseData?.find((exercise) => exercise.id === id);
    const exerciseNames = menu.exerciseIds
        .slice(0, 3)
        .map((id) => resolveExercise(id)?.name ?? id);
    const remaining = menu.exerciseIds.length - 3;
    const totalSec = menu.exerciseIds.reduce(
        (sum, id) => sum + (resolveExercise(id)?.sec ?? 0),
        0,
    );
    const minutes = Math.ceil(totalSec / 60);

    return (
        <button
            type="button"
            onClick={() => onTap(menu)}
            style={cardStyle}
        >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: SPACE.md, width: '100%' }}>
                <div style={iconContainerStyle}>
                    <span style={{ fontSize: 22, lineHeight: 1 }}>{menu.emoji}</span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={titleStyle}>{menu.name}</div>
                    <div style={subtitleStyle}>{menu.authorName} さんのメニュー</div>
                </div>
                <span style={kindBadgeStyle}>{CANONICAL_TERMS.menu}</span>
            </div>

            <div style={bodyTextStyle}>
                {exerciseNames.join('、')}{remaining > 0 ? `、+${remaining}` : ''}
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: SPACE.sm }}>
                <span style={chipStyle}>
                    <Clock size={11} />
                    {minutes}分
                </span>
                <span style={chipStyle}>
                    <Download size={11} />
                    {menu.downloadCount}
                </span>
            </div>
        </button>
    );
};

const cardStyle: React.CSSProperties = {
    width: '100%',
    padding: `${SPACE.xl}px ${SPACE.lg}px`,
    borderRadius: RADIUS.xl,
    border: '1px solid rgba(255,255,255,0.55)',
    background: 'rgba(255,255,255,0.96)',
    boxShadow: '0 4px 16px rgba(0,0,0,0.05)',
    cursor: 'pointer',
    textAlign: 'left',
    display: 'flex',
    flexDirection: 'column',
    gap: SPACE.md,
    minHeight: 132,
    flexShrink: 0,
    appearance: 'none',
    WebkitAppearance: 'none',
};

const chipStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    padding: '6px 10px',
    borderRadius: RADIUS.full,
    background: 'rgba(0,0,0,0.04)',
    fontFamily: FONT.body,
    fontSize: FONT_SIZE.xs + 1,
    color: COLOR.light,
};

const iconContainerStyle: React.CSSProperties = {
    width: 48,
    height: 48,
    borderRadius: RADIUS.xl,
    background: 'rgba(43, 186, 160, 0.12)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
};

const titleStyle: React.CSSProperties = {
    fontFamily: FONT.body,
    fontSize: FONT_SIZE.lg,
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
    fontSize: FONT_SIZE.sm + 1,
    color: COLOR.muted,
    marginTop: 4,
};

const bodyTextStyle: React.CSSProperties = {
    fontFamily: FONT.body,
    fontSize: FONT_SIZE.md,
    color: COLOR.muted,
    lineHeight: 1.5,
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
    minHeight: 42,
};

const kindBadgeStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '6px 10px',
    borderRadius: RADIUS.full,
    background: 'rgba(43, 186, 160, 0.10)',
    color: COLOR.primaryDark,
    fontFamily: FONT.body,
    fontSize: FONT_SIZE.sm,
    fontWeight: 700,
    flexShrink: 0,
};
