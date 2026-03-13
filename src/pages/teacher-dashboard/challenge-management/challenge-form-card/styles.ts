import type React from 'react';
import { COLOR, FONT, FONT_SIZE, RADIUS, SPACE } from '../../../../lib/styles';

export const cardStyle: React.CSSProperties = {
    padding: 18,
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
};

export const cardHeaderStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
};

export const cardTitleStyle: React.CSSProperties = {
    fontFamily: FONT.body,
    fontSize: FONT_SIZE.lg,
    fontWeight: 800,
    color: COLOR.dark,
};

export const cardDescriptionStyle: React.CSSProperties = {
    fontFamily: FONT.body,
    fontSize: FONT_SIZE.sm,
    color: COLOR.muted,
    lineHeight: 1.6,
};

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

export const optionButtonTitleStyle: React.CSSProperties = {
    fontFamily: FONT.body,
    fontSize: FONT_SIZE.sm,
    fontWeight: 800,
    color: COLOR.dark,
};

export const optionButtonDescriptionStyle: React.CSSProperties = {
    fontFamily: FONT.body,
    fontSize: FONT_SIZE.xs + 1,
    color: COLOR.muted,
    lineHeight: 1.5,
};

export function getSelectedOptionButtonStyle(selected: boolean): React.CSSProperties {
    return selected
        ? {
            border: '2px solid #2BBAA0',
            background: '#E8F8F0',
        }
        : {};
}

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

export function getSelectedSegmentedButtonStyle(selected: boolean): React.CSSProperties {
    return selected
        ? {
            border: '2px solid #2BBAA0',
            background: '#E8F8F0',
            color: COLOR.primaryDark,
        }
        : {};
}

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

export const previewTitleStyle: React.CSSProperties = {
    fontFamily: FONT.body,
    fontSize: FONT_SIZE.sm,
    fontWeight: 800,
    color: COLOR.dark,
};

export const previewMetaStyle: React.CSSProperties = {
    fontFamily: FONT.body,
    fontSize: FONT_SIZE.xs + 1,
    color: COLOR.muted,
};

export const classLevelWrapStyle: React.CSSProperties = {
    display: 'flex',
    gap: 8,
    flexWrap: 'wrap',
};

export function getClassLevelButtonStyle(selected: boolean): React.CSSProperties {
    return {
        padding: '8px 12px',
        borderRadius: RADIUS.full,
        border: selected ? '2px solid #2BBAA0' : '1px solid rgba(0,0,0,0.08)',
        background: selected ? '#E8F8F0' : COLOR.white,
        fontFamily: FONT.body,
        fontSize: FONT_SIZE.sm,
        fontWeight: 700,
        color: selected ? COLOR.primaryDark : COLOR.text,
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
    };
}

export const rewardPanelStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    padding: '14px 16px',
    borderRadius: RADIUS.xl,
    background: 'linear-gradient(135deg, rgba(255, 248, 225, 0.9), rgba(255, 255, 255, 0.92))',
    border: '1px solid rgba(255, 215, 0, 0.18)',
};

export const rewardSummaryRowStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
};

export const rewardSummaryTextStyle: React.CSSProperties = {
    fontFamily: FONT.body,
    fontSize: FONT_SIZE.sm,
    color: COLOR.text,
    fontWeight: 700,
};

export const medalGridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(56px, 1fr))',
    gap: 8,
};

export function getMedalButtonStyle(selected: boolean): React.CSSProperties {
    return {
        width: '100%',
        aspectRatio: '1 / 1',
        borderRadius: 14,
        border: selected ? '2px solid #FFB800' : '1px solid rgba(0,0,0,0.08)',
        background: selected ? '#FFF9E6' : COLOR.white,
        padding: 6,
        cursor: 'pointer',
        boxShadow: selected ? '0 0 0 2px rgba(255,184,0,0.16)' : 'none',
    };
}

export const dateErrorStyle: React.CSSProperties = {
    fontFamily: FONT.body,
    fontSize: FONT_SIZE.xs + 1,
    color: COLOR.danger,
    fontWeight: 700,
};

export const footerActionRowStyle: React.CSSProperties = {
    display: 'flex',
    gap: 8,
    marginTop: 4,
};

export const cancelButtonStyle: React.CSSProperties = {
    flex: 1,
    padding: '12px 0',
    borderRadius: RADIUS.lg,
    border: 'none',
    background: COLOR.bgMuted,
    color: COLOR.text,
    fontFamily: FONT.body,
    fontSize: FONT_SIZE.md,
    fontWeight: 700,
    cursor: 'pointer',
};

export function getSubmitButtonStyle(disabled: boolean): React.CSSProperties {
    return {
        flex: 1,
        padding: '12px 0',
        borderRadius: RADIUS.lg,
        border: 'none',
        background: !disabled ? COLOR.primary : COLOR.disabled,
        color: !disabled ? COLOR.white : COLOR.light,
        fontFamily: FONT.body,
        fontSize: FONT_SIZE.md,
        fontWeight: 700,
        cursor: !disabled ? 'pointer' : 'not-allowed',
    };
}
