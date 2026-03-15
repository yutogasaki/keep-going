import React from 'react';
import { Clock, Download } from 'lucide-react';
import { type PublicMenu } from '../lib/publicMenus';
import {
    buildPublicMenuExercisePreview,
    getPublicMenuMinutes,
} from '../lib/publicMenuUtils';
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
    const preview = buildPublicMenuExercisePreview(menu, 3);
    const minutes = getPublicMenuMinutes(menu);

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
                {preview}
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
