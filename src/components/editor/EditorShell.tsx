import React from 'react';
import { createPortal } from 'react-dom';
import {
    COLOR,
    FONT,
    FONT_SIZE,
    RADIUS,
    SPACE,
} from '../../lib/styles';

interface EditorShellProps {
    title: string;
    onBack: () => void;
    children: React.ReactNode;
}

interface EditorSectionProps {
    label?: React.ReactNode;
    children: React.ReactNode;
    style?: React.CSSProperties;
}

export const editorSectionStyle: React.CSSProperties = {
    padding: `${SPACE.xl}px`,
    boxShadow: '0 4px 16px rgba(0,0,0,0.03)',
    border: 'none',
};

export const editorLabelStyle: React.CSSProperties = {
    fontFamily: FONT.body,
    fontSize: FONT_SIZE.sm + 1,
    fontWeight: 700,
    color: COLOR.dark,
    display: 'block',
    marginBottom: SPACE.md,
};

export function getEditorSubmitButtonStyle(enabled: boolean): React.CSSProperties {
    return {
        position: 'sticky',
        bottom: 0,
        padding: '16px 0',
        borderRadius: RADIUS.xl,
        border: 'none',
        background: enabled
            ? 'linear-gradient(135deg, #2BBAA0, #1A937D)'
            : COLOR.disabled,
        color: enabled ? COLOR.white : COLOR.light,
        fontFamily: FONT.body,
        fontSize: FONT_SIZE.lg,
        fontWeight: 700,
        cursor: enabled ? 'pointer' : 'not-allowed',
        boxShadow: enabled ? '0 8px 20px rgba(43, 186, 160, 0.3)' : 'none',
        transition: 'all 0.3s ease',
        marginTop: SPACE.lg,
    };
}

export function getEditorActionButtonStyle(
    variant: 'soft' | 'danger',
    stretch = true,
): React.CSSProperties {
    if (variant === 'danger') {
        return {
            ...(stretch ? { flex: 1 } : {}),
            padding: '14px 20px',
            borderRadius: RADIUS.xl,
            border: 'none',
            background: 'rgba(225,112,85,0.08)',
            color: COLOR.danger,
            fontFamily: FONT.body,
            fontSize: 15,
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
        };
    }

    return {
        ...(stretch ? { flex: 1 } : {}),
        padding: '14px 0',
        borderRadius: RADIUS.xl,
        border: 'none',
        background: 'rgba(43,186,160,0.1)',
        color: COLOR.primary,
        fontFamily: FONT.body,
        fontSize: 15,
        fontWeight: 700,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
    };
}

export const EditorSection: React.FC<EditorSectionProps> = ({ label, children, style }) => (
    <div className="card" style={{ ...editorSectionStyle, ...style }}>
        {label ? <label style={editorLabelStyle}>{label}</label> : null}
        {children}
    </div>
);

export const EditorShell: React.FC<EditorShellProps> = ({
    title,
    onBack,
    children,
}) => createPortal(
    <div
        style={{
            position: 'fixed',
            inset: 0,
            background: 'linear-gradient(180deg, #FFFFFF 0%, #F8F9FA 100%)',
            zIndex: 100,
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            padding: '64px 20px 32px 20px',
            gap: SPACE.xl,
            overflowY: 'auto',
        }}
    >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <button
                onClick={onBack}
                style={{
                    border: 'none',
                    background: 'none',
                    cursor: 'pointer',
                    fontFamily: FONT.body,
                    fontSize: FONT_SIZE.md,
                    color: COLOR.muted,
                }}
            >
                ← もどる
            </button>
            <h1
                style={{
                    fontFamily: FONT.heading,
                    fontSize: FONT_SIZE['2xl'],
                    fontWeight: 700,
                    color: COLOR.dark,
                    margin: 0,
                }}
            >
                {title}
            </h1>
            <div style={{ width: 48 }} />
        </div>

        {children}
    </div>,
    document.body,
);
