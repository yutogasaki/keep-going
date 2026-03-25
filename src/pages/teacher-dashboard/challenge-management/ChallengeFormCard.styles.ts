import type React from 'react';
import { COLOR, FONT, FONT_SIZE, RADIUS, SPACE } from '../../../lib/styles';

export const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '14px 16px',
    borderRadius: RADIUS.lg,
    border: '1px solid rgba(0,0,0,0.08)',
    background: COLOR.white,
    fontFamily: FONT.body,
    fontSize: FONT_SIZE.md,
    outline: 'none',
    boxSizing: 'border-box',
};

export const fieldLabelStyle: React.CSSProperties = {
    fontFamily: FONT.body,
    fontSize: FONT_SIZE.sm,
    fontWeight: 700,
    color: COLOR.dark,
    marginBottom: 6,
};

export const fieldHintStyle: React.CSSProperties = {
    fontFamily: FONT.body,
    fontSize: FONT_SIZE.xs + 1,
    color: COLOR.muted,
    lineHeight: 1.5,
    marginTop: 6,
};

export const sectionStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: SPACE.md,
    padding: '16px',
    borderRadius: RADIUS.xl,
    background: 'rgba(255,255,255,0.74)',
    border: '1px solid rgba(255,255,255,0.55)',
};

export const sectionTitleStyle: React.CSSProperties = {
    fontFamily: FONT.body,
    fontSize: FONT_SIZE.md,
    fontWeight: 800,
    color: COLOR.dark,
};

export const sectionDescriptionStyle: React.CSSProperties = {
    fontFamily: FONT.body,
    fontSize: FONT_SIZE.xs + 1,
    color: COLOR.muted,
    lineHeight: 1.6,
    marginTop: 2,
};

export const optionGridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: SPACE.sm,
};

export const optionButtonBaseStyle: React.CSSProperties = {
    padding: '12px 14px',
    borderRadius: RADIUS.lg,
    border: '1px solid rgba(0,0,0,0.08)',
    background: COLOR.white,
    cursor: 'pointer',
    textAlign: 'left',
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
};

export const segmentedRowStyle: React.CSSProperties = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: SPACE.sm,
};

export const segmentedButtonBaseStyle: React.CSSProperties = {
    padding: '9px 12px',
    borderRadius: RADIUS.full,
    border: '1px solid rgba(0,0,0,0.08)',
    background: COLOR.white,
    cursor: 'pointer',
    fontFamily: FONT.body,
    fontSize: FONT_SIZE.sm,
    fontWeight: 700,
    color: COLOR.text,
};

export const metricGridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: SPACE.md,
};

export const selectionPreviewStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: SPACE.md,
    padding: '12px 14px',
    borderRadius: RADIUS.lg,
    background: '#F8FBFA',
    border: '1px solid rgba(43, 186, 160, 0.12)',
};

export const previewIconStyle: React.CSSProperties = {
    width: 44,
    height: 44,
    borderRadius: RADIUS.lg,
    background: 'rgba(43, 186, 160, 0.12)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 22,
    flexShrink: 0,
};

export const classLevelWrapStyle: React.CSSProperties = {
    display: 'flex',
    gap: 8,
    flexWrap: 'wrap',
};

export const rewardPanelStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    padding: '14px 16px',
    borderRadius: RADIUS.xl,
    background: 'linear-gradient(135deg, rgba(255, 248, 225, 0.9), rgba(255, 255, 255, 0.92))',
    border: '1px solid rgba(255, 215, 0, 0.18)',
};
