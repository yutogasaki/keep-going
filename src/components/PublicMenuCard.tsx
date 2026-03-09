import React from 'react';
import { Clock, Download } from 'lucide-react';
import { EXERCISES } from '../data/exercises';
import { type PublicMenu } from '../lib/publicMenus';
import { CANONICAL_TERMS } from '../lib/terminology';
import {
    publicCatalogBodyTextStyle,
    publicCatalogCardStyle,
    publicCatalogChipStyle,
    publicCatalogHeaderRowStyle,
    publicCatalogIconSurfaceStyle,
    publicCatalogKindBadgeStyle,
    publicCatalogSubtitleStyle,
    publicCatalogTitleStyle,
} from './publicCatalogCardChrome';

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
            style={publicCatalogCardStyle}
        >
            <div style={publicCatalogHeaderRowStyle}>
                <div style={publicCatalogIconSurfaceStyle}>
                    <span style={{ fontSize: 22, lineHeight: 1 }}>{menu.emoji}</span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={publicCatalogTitleStyle}>{menu.name}</div>
                    <div style={publicCatalogSubtitleStyle}>{menu.authorName} さんのメニュー</div>
                </div>
                <span style={publicCatalogKindBadgeStyle}>{CANONICAL_TERMS.menu}</span>
            </div>

            <div style={publicCatalogBodyTextStyle}>
                {exerciseNames.join('、')}{remaining > 0 ? `、+${remaining}` : ''}
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                <span style={publicCatalogChipStyle}>
                    <Clock size={11} />
                    {minutes}分
                </span>
                <span style={publicCatalogChipStyle}>
                    <Download size={11} />
                    {menu.downloadCount}
                </span>
            </div>
        </button>
    );
};
