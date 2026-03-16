import React, { useMemo } from 'react';
import { ChevronRight, Clock, Download, Sparkles } from 'lucide-react';
import { COLOR, FONT, FONT_SIZE, RADIUS, SPACE } from '../lib/styles';
import type { PublicExercise } from '../lib/publicExercises';
import type { PublicMenu } from '../lib/publicMenus';
import { HomeSection } from './home/HomeSection';
import {
    getHomeBadgeStyle,
    getHomeCardStyle,
    getHomeIconSurfaceStyle,
    homeCardBodyTextStyle,
    homeCardButtonResetStyle,
    homeCardFooterRowStyle,
    homeCardMetaChipStyle,
    homeCardTitleStyle,
} from './home/homeCardChrome';
import {
    buildFeaturedExerciseCopy,
    buildPublicMenuExercisePreview,
    getPublicMenuBadgeLabel,
    getPublicMenuMinutes,
} from '../pages/home/homeMenuUtils';

interface PopularMenusRowProps {
    menus: PublicMenu[];
    exercises: PublicExercise[];
    onOpenMenuBrowser: () => void;
    onOpenExerciseBrowser: () => void;
    onMenuTap: (menu: PublicMenu) => void;
    onExerciseTap: (exercise: PublicExercise) => void;
}

export const PopularMenusRow: React.FC<PopularMenusRowProps> = ({
    menus,
    exercises,
    onOpenMenuBrowser,
    onOpenExerciseBrowser,
    onMenuTap,
    onExerciseTap,
}) => {
    const featuredMenus = useMemo(() => menus.slice(0, 2), [menus]);
    const featuredExercise = exercises[0] ?? null;

    if (featuredMenus.length === 0 && !featuredExercise) {
        return null;
    }

    return (
        <HomeSection
            title="みんなのメニュー"
            subtitle="新しいのを見つける"
            actionLabel="もっと見る"
            onAction={onOpenMenuBrowser}
            style={{ padding: 0, marginTop: 0 }}
        >
            <div style={{ display: 'flex', flexDirection: 'column', gap: SPACE.md }}>
                {featuredMenus.map((menu) => (
                    <button
                        key={menu.id}
                        type="button"
                        onClick={() => onMenuTap(menu)}
                        style={{
                            ...getHomeCardStyle('neutral'),
                            ...menuCardStyle,
                        }}
                    >
                        <div style={cardHeaderRowStyle}>
                            <div style={getHomeIconSurfaceStyle('mint')}>
                                <span style={{ fontSize: 24, lineHeight: 1 }}>{menu.emoji}</span>
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={menuTitleStyle}>{menu.name}</div>
                                        <div style={menuSubtitleStyle}>{menu.authorName} さんのメニュー</div>
                                    </div>
                                    {getPublicMenuBadgeLabel(menu) ? (
                                        <span
                                            style={
                                                getPublicMenuBadgeLabel(menu) === 'みんなの種目あり'
                                                    ? discoveryBadgeStyle
                                                    : accentBadgeStyle
                                            }
                                        >
                                            {getPublicMenuBadgeLabel(menu)}
                                        </span>
                                    ) : null}
                                </div>
                                <div style={menuBodyStyle}>{buildPublicMenuExercisePreview(menu)}</div>
                            </div>
                        </div>

                        <div style={cardFooterStyle}>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                <span style={metaChipStyle}>
                                    <Clock size={11} />約{getPublicMenuMinutes(menu)}分
                                </span>
                                <span style={metaChipStyle}>
                                    <Download size={11} />
                                    {menu.downloadCount}
                                </span>
                            </div>
                            <span style={detailTextStyle}>くわしく見る</span>
                        </div>
                    </button>
                ))}

                {featuredExercise ? (
                    <div style={exerciseDiscoveryPanelStyle}>
                        <button
                            type="button"
                            onClick={() => onExerciseTap(featuredExercise)}
                            style={exercisePreviewButtonStyle}
                        >
                            <div style={exerciseDiscoveryLabelStyle}>
                                <Sparkles size={14} />
                                新しい種目も見つかる
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%' }}>
                                <div
                                    style={getHomeIconSurfaceStyle('sky', {
                                        width: 42,
                                        height: 42,
                                        background: COLOR.white,
                                        boxShadow: '0 3px 10px rgba(0,0,0,0.04)',
                                    })}
                                >
                                    <span style={{ fontSize: 22, lineHeight: 1 }}>{featuredExercise.emoji}</span>
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={exerciseTitleStyle}>{featuredExercise.name}</div>
                                    <div style={exerciseSubtitleStyle}>
                                        {buildFeaturedExerciseCopy(featuredExercise)}
                                    </div>
                                </div>
                            </div>
                        </button>
                        <button type="button" onClick={onOpenExerciseBrowser} style={exerciseBrowserButtonStyle}>
                            種目も見る
                            <ChevronRight size={14} />
                        </button>
                    </div>
                ) : null}
            </div>
        </HomeSection>
    );
};

const menuCardStyle: React.CSSProperties = {
    width: '100%',
    cursor: 'pointer',
    textAlign: 'left',
    display: 'flex',
    flexDirection: 'column',
    gap: SPACE.md,
    appearance: 'none',
    WebkitAppearance: 'none',
};

const cardHeaderRowStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'flex-start',
    gap: SPACE.md,
    width: '100%',
};

const menuTitleStyle: React.CSSProperties = {
    ...homeCardTitleStyle,
    fontSize: FONT_SIZE.lg,
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
};

const menuSubtitleStyle: React.CSSProperties = {
    fontFamily: FONT.body,
    fontSize: FONT_SIZE.sm + 1,
    color: COLOR.muted,
    marginTop: 4,
};

const menuBodyStyle: React.CSSProperties = {
    ...homeCardBodyTextStyle,
    marginTop: 10,
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
};

const cardFooterStyle: React.CSSProperties = {
    ...homeCardFooterRowStyle,
};

const metaChipStyle: React.CSSProperties = {
    ...homeCardMetaChipStyle,
};

const detailTextStyle: React.CSSProperties = {
    fontFamily: FONT.body,
    fontSize: FONT_SIZE.sm,
    fontWeight: 700,
    color: COLOR.primaryDark,
};

const accentBadgeStyle: React.CSSProperties = {
    ...getHomeBadgeStyle('mint', {
        padding: '5px 9px',
    }),
};

const discoveryBadgeStyle: React.CSSProperties = {
    ...getHomeBadgeStyle('warm', {
        padding: '5px 9px',
    }),
};

const exerciseDiscoveryPanelStyle: React.CSSProperties = {
    ...getHomeCardStyle('sky', {
        padding: `${SPACE.md}px ${SPACE.lg}px`,
    }),
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACE.sm,
    flexWrap: 'wrap',
};

const exercisePreviewButtonStyle: React.CSSProperties = {
    ...homeCardButtonResetStyle,
    flex: 1,
    minWidth: 220,
    display: 'flex',
    flexDirection: 'column',
    gap: SPACE.sm,
};

const exerciseDiscoveryLabelStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    fontFamily: FONT.body,
    fontSize: FONT_SIZE.sm,
    fontWeight: 700,
    color: COLOR.primaryDark,
};

const exerciseTitleStyle: React.CSSProperties = {
    ...homeCardTitleStyle,
};

const exerciseSubtitleStyle: React.CSSProperties = {
    fontFamily: FONT.body,
    fontSize: FONT_SIZE.sm,
    color: COLOR.muted,
    marginTop: 4,
    lineHeight: 1.5,
};

const exerciseBrowserButtonStyle: React.CSSProperties = {
    border: 'none',
    background: COLOR.white,
    color: COLOR.primaryDark,
    borderRadius: RADIUS.full,
    padding: '10px 12px',
    fontFamily: FONT.body,
    fontSize: FONT_SIZE.sm,
    fontWeight: 700,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    flexShrink: 0,
};
