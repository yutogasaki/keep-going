import type React from 'react';
import { COLOR, FONT, FONT_SIZE, RADIUS, SPACE } from '../lib/styles';

export const publicCatalogCardStyle: React.CSSProperties = {
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

export const publicCatalogHeaderRowStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'flex-start',
    gap: SPACE.md,
    width: '100%',
};

export const publicCatalogIconSurfaceStyle: React.CSSProperties = {
    width: 48,
    height: 48,
    borderRadius: RADIUS.xl,
    background: 'rgba(43, 186, 160, 0.12)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
};

export const publicCatalogTitleStyle: React.CSSProperties = {
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

export const publicCatalogSubtitleStyle: React.CSSProperties = {
    fontFamily: FONT.body,
    fontSize: FONT_SIZE.sm + 1,
    color: COLOR.muted,
    marginTop: 4,
};

export const publicCatalogBodyTextStyle: React.CSSProperties = {
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

export const publicCatalogChipStyle: React.CSSProperties = {
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

export const publicCatalogKindBadgeStyle: React.CSSProperties = {
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
