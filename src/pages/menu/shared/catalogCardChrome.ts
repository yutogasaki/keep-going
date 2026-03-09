import type React from 'react';
import { COLOR, FONT, FONT_SIZE, RADIUS } from '../../../lib/styles';

export const catalogHeaderRowStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '18px 16px',
};

export const catalogIconSurfaceStyle: React.CSSProperties = {
    width: 48,
    height: 48,
    borderRadius: RADIUS.xl,
    background: 'linear-gradient(135deg, #E8F8F0, #FFE5D9)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
};

export const catalogTitleStyle: React.CSSProperties = {
    fontFamily: FONT.body,
    fontSize: FONT_SIZE.lg,
    fontWeight: 700,
    color: COLOR.dark,
    lineHeight: 1.35,
};

export const catalogMetaLineStyle: React.CSSProperties = {
    fontFamily: FONT.body,
    fontSize: FONT_SIZE.sm,
    color: COLOR.muted,
    display: 'flex',
    gap: 8,
    flexWrap: 'wrap',
    lineHeight: 1.5,
};

export const catalogExpandButtonStyle: React.CSSProperties = {
    width: 32,
    height: 32,
    borderRadius: 10,
    border: 'none',
    background: 'rgba(0,0,0,0.04)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
};

export const catalogPlayButtonStyle: React.CSSProperties = {
    width: 32,
    height: 32,
    borderRadius: '50%',
    background: '#2BBAA0',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
};

export const catalogPrimaryBadgeStyle: React.CSSProperties = {
    fontFamily: FONT.body,
    fontSize: FONT_SIZE.xs + 1,
    fontWeight: 700,
    color: COLOR.primaryDark,
    background: 'rgba(43, 186, 160, 0.10)',
    padding: '4px 8px',
    borderRadius: RADIUS.full,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
};
