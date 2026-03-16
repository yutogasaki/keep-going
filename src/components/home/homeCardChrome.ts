import type React from 'react';
import { COLOR, FONT, FONT_SIZE, RADIUS, SPACE } from '../../lib/styles';

export type HomeCardTone = 'neutral' | 'mint' | 'warm' | 'sky' | 'gold' | 'muted';
export type HomeBadgeTone = 'mint' | 'sky' | 'warm' | 'slate' | 'danger';
export type HomeIconTone = 'mint' | 'warm' | 'sky';

const CARD_TONE_STYLE: Record<HomeCardTone, React.CSSProperties> = {
    neutral: {
        border: '1px solid rgba(255,255,255,0.6)',
        background: 'rgba(255,255,255,0.96)',
        boxShadow: '0 6px 18px rgba(0,0,0,0.05)',
    },
    mint: {
        border: '1px solid rgba(43, 186, 160, 0.15)',
        background: 'linear-gradient(135deg, #F0FDFA 0%, #E8F8F0 100%)',
        boxShadow: '0 6px 18px rgba(43, 186, 160, 0.10)',
    },
    warm: {
        border: '1px solid rgba(255,255,255,0.6)',
        background: 'linear-gradient(180deg, rgba(255,250,247,0.98) 0%, rgba(255,255,255,0.98) 100%)',
        boxShadow: '0 6px 18px rgba(0,0,0,0.05)',
    },
    sky: {
        border: '1px solid rgba(255,255,255,0.65)',
        background: 'linear-gradient(180deg, rgba(244,249,255,0.98) 0%, rgba(255,255,255,0.98) 100%)',
        boxShadow: '0 6px 18px rgba(0,0,0,0.05)',
    },
    gold: {
        border: '1px solid rgba(255, 215, 0, 0.32)',
        background: 'linear-gradient(135deg, #FFF9E6, #FFF3CC)',
        boxShadow: '0 6px 18px rgba(253, 203, 110, 0.14)',
    },
    muted: {
        border: '1px solid rgba(0,0,0,0.05)',
        background: 'rgba(245, 245, 245, 0.92)',
        boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
    },
};

const BADGE_TONE_STYLE: Record<HomeBadgeTone, React.CSSProperties> = {
    mint: {
        color: COLOR.primaryDark,
        background: 'rgba(43, 186, 160, 0.12)',
    },
    sky: {
        color: COLOR.info,
        background: 'rgba(9, 132, 227, 0.10)',
    },
    warm: {
        color: '#B86A2C',
        background: '#FFF2E4',
    },
    slate: {
        color: '#52606D',
        background: 'rgba(0,0,0,0.05)',
    },
    danger: {
        color: COLOR.white,
        background: '#FF7A7A',
        fontFamily: FONT.heading,
    },
};

const ICON_TONE_STYLE: Record<HomeIconTone, React.CSSProperties> = {
    mint: {
        background: 'rgba(43, 186, 160, 0.12)',
    },
    warm: {
        background: 'linear-gradient(135deg, #FFF0E8, #FFF7D6)',
    },
    sky: {
        background: 'rgba(9, 132, 227, 0.10)',
    },
};

export function getHomeCardStyle(tone: HomeCardTone = 'neutral', overrides?: React.CSSProperties): React.CSSProperties {
    return {
        borderRadius: RADIUS['2xl'],
        padding: `${SPACE.lg}px`,
        ...CARD_TONE_STYLE[tone],
        ...overrides,
    };
}

export function getHomeBadgeStyle(tone: HomeBadgeTone = 'mint', overrides?: React.CSSProperties): React.CSSProperties {
    return {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '4px 8px',
        borderRadius: RADIUS.full,
        fontFamily: FONT.body,
        fontSize: FONT_SIZE.xs + 1,
        fontWeight: 700,
        flexShrink: 0,
        ...BADGE_TONE_STYLE[tone],
        ...overrides,
    };
}

export function getHomeIconSurfaceStyle(
    tone: HomeIconTone = 'mint',
    overrides?: React.CSSProperties,
): React.CSSProperties {
    return {
        width: 48,
        height: 48,
        borderRadius: RADIUS.xl,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        ...ICON_TONE_STYLE[tone],
        ...overrides,
    };
}

export const homeCardButtonResetStyle: React.CSSProperties = {
    border: 'none',
    background: 'none',
    cursor: 'pointer',
    textAlign: 'left',
    appearance: 'none',
    WebkitAppearance: 'none',
};

export const homeCardTitleStyle: React.CSSProperties = {
    fontFamily: FONT.body,
    fontSize: FONT_SIZE.md + 1,
    fontWeight: 700,
    color: COLOR.dark,
    lineHeight: 1.35,
};

export const homeCardBodyTextStyle: React.CSSProperties = {
    fontFamily: FONT.body,
    fontSize: FONT_SIZE.sm + 1,
    color: COLOR.text,
    lineHeight: 1.6,
};

export const homeCardMetaLineStyle: React.CSSProperties = {
    fontFamily: FONT.body,
    fontSize: FONT_SIZE.sm - 1,
    color: COLOR.muted,
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    flexWrap: 'wrap',
};

export const homeCardMetaChipStyle: React.CSSProperties = {
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

export const homeCardFooterRowStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACE.sm,
    flexWrap: 'wrap',
};
