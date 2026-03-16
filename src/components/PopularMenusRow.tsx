import React, { useMemo } from 'react';
import { ChevronRight, Clock, Download, Sparkles } from 'lucide-react';
import type { PublicExercise } from '../lib/publicExercises';
import type { PublicMenu } from '../lib/publicMenus';
import { COLOR, FONT, FONT_SIZE, RADIUS, SPACE } from '../lib/styles';
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
    const featuredMenus = useMemo(
        () => menus.slice(0, 2),
        [menus],
    );
    const featuredExercise = exercises[0] ?? null;

    if (featuredMenus.length === 0 && !featuredExercise) {
        return null;
    }

    return (
        <section>
            <div style={sectionHeaderStyle}>
                <div style={{ minWidth: 0 }}>
                    <div style={sectionTitleStyle}>みんなのメニュー</div>
                    <div style={sectionSubtitleStyle}>新しいのを見つける</div>
                </div>
                <button
                    type="button"
                    onClick={onOpenMenuBrowser}
                    style={sectionLinkStyle}
                >
                    もっと見る
                    <ChevronRight size={14} />
                </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: SPACE.md }}>
                {featuredMenus.map((menu) => (
                    <button
                        key={menu.id}
                        type="button"
                        onClick={() => onMenuTap(menu)}
                        style={menuCardStyle}
                    >
                        <div style={cardHeaderRowStyle}>
                            <div style={publicIconStyle}>
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
                                    <Clock size={11} />
                                    約{getPublicMenuMinutes(menu)}分
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
                                <div style={exerciseIconStyle}>
                                    <span style={{ fontSize: 22, lineHeight: 1 }}>{featuredExercise.emoji}</span>
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={exerciseTitleStyle}>{featuredExercise.name}</div>
                                    <div style={exerciseSubtitleStyle}>{buildFeaturedExerciseCopy(featuredExercise)}</div>
                                </div>
                            </div>
                        </button>
                        <button
                            type="button"
                            onClick={onOpenExerciseBrowser}
                            style={exerciseBrowserButtonStyle}
                        >
                            種目も見る
                            <ChevronRight size={14} />
                        </button>
                    </div>
                ) : null}
            </div>
        </section>
    );
};

const sectionHeaderStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: SPACE.md,
    marginBottom: 12,
    padding: '0 4px',
};

const sectionTitleStyle: React.CSSProperties = {
    fontFamily: FONT.body,
    fontSize: FONT_SIZE.md + 1,
    fontWeight: 700,
    color: COLOR.dark,
};

const sectionSubtitleStyle: React.CSSProperties = {
    fontFamily: FONT.body,
    fontSize: FONT_SIZE.sm,
    color: COLOR.muted,
    marginTop: 4,
    lineHeight: 1.5,
};

const sectionLinkStyle: React.CSSProperties = {
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
    padding: '2px 0',
    flexShrink: 0,
};

const menuCardStyle: React.CSSProperties = {
    width: '100%',
    padding: `${SPACE.lg}px`,
    borderRadius: RADIUS['2xl'],
    border: '1px solid rgba(255,255,255,0.6)',
    background: 'rgba(255,255,255,0.96)',
    boxShadow: '0 6px 18px rgba(0,0,0,0.05)',
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

const publicIconStyle: React.CSSProperties = {
    width: 48,
    height: 48,
    borderRadius: RADIUS.xl,
    background: 'rgba(43, 186, 160, 0.12)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
};

const menuTitleStyle: React.CSSProperties = {
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

const menuSubtitleStyle: React.CSSProperties = {
    fontFamily: FONT.body,
    fontSize: FONT_SIZE.sm + 1,
    color: COLOR.muted,
    marginTop: 4,
};

const menuBodyStyle: React.CSSProperties = {
    fontFamily: FONT.body,
    fontSize: FONT_SIZE.md,
    color: COLOR.text,
    lineHeight: 1.55,
    marginTop: 10,
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
};

const cardFooterStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACE.sm,
    flexWrap: 'wrap',
};

const metaChipStyle: React.CSSProperties = {
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

const detailTextStyle: React.CSSProperties = {
    fontFamily: FONT.body,
    fontSize: FONT_SIZE.sm,
    fontWeight: 700,
    color: COLOR.primaryDark,
};

const accentBadgeStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '5px 9px',
    borderRadius: RADIUS.full,
    background: 'rgba(43, 186, 160, 0.10)',
    color: COLOR.primaryDark,
    fontFamily: FONT.body,
    fontSize: FONT_SIZE.xs + 1,
    fontWeight: 700,
    flexShrink: 0,
};

const discoveryBadgeStyle: React.CSSProperties = {
    ...accentBadgeStyle,
    background: 'rgba(253, 203, 110, 0.18)',
    color: '#B86A2C',
};

const exerciseDiscoveryPanelStyle: React.CSSProperties = {
    borderRadius: RADIUS['2xl'],
    border: '1px solid rgba(255,255,255,0.65)',
    background: 'linear-gradient(135deg, rgba(232,248,240,0.95), rgba(240,247,255,0.95))',
    boxShadow: '0 6px 18px rgba(0,0,0,0.04)',
    padding: `${SPACE.md}px ${SPACE.lg}px`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACE.sm,
    flexWrap: 'wrap',
};

const exercisePreviewButtonStyle: React.CSSProperties = {
    flex: 1,
    minWidth: 220,
    border: 'none',
    background: 'none',
    padding: 0,
    cursor: 'pointer',
    textAlign: 'left',
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

const exerciseIconStyle: React.CSSProperties = {
    width: 42,
    height: 42,
    borderRadius: RADIUS.xl,
    background: COLOR.white,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    boxShadow: '0 3px 10px rgba(0,0,0,0.04)',
};

const exerciseTitleStyle: React.CSSProperties = {
    fontFamily: FONT.body,
    fontSize: FONT_SIZE.md + 1,
    fontWeight: 700,
    color: COLOR.dark,
    lineHeight: 1.35,
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
