import React from 'react';
import { ChevronRight } from 'lucide-react';
import { COLOR, FONT, FONT_SIZE, RADIUS, SPACE } from '../../lib/styles';

type HomeSectionSurfaceTone = 'neutral' | 'mint';

interface HomeSectionProps {
    title: string;
    subtitle?: string;
    actionLabel?: string;
    actionAriaLabel?: string;
    onAction?: () => void;
    boxed?: boolean;
    surfaceTone?: HomeSectionSurfaceTone;
    children: React.ReactNode;
    style?: React.CSSProperties;
    contentStyle?: React.CSSProperties;
}

const SURFACE_STYLE: Record<HomeSectionSurfaceTone, React.CSSProperties> = {
    neutral: {
        borderRadius: RADIUS['3xl'],
        padding: SPACE.lg,
        border: '1px solid rgba(255,255,255,0.62)',
        background: 'linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(250,251,252,0.98) 100%)',
        boxShadow: '0 10px 28px rgba(15, 23, 42, 0.06)',
    },
    mint: {
        borderRadius: RADIUS['3xl'],
        padding: SPACE.lg,
        border: '1px solid rgba(43, 186, 160, 0.12)',
        background: 'linear-gradient(180deg, rgba(240, 253, 250, 0.92) 0%, rgba(255, 255, 255, 0.98) 100%)',
        boxShadow: '0 10px 28px rgba(15, 23, 42, 0.06)',
    },
};

export const HomeSection: React.FC<HomeSectionProps> = ({
    title,
    subtitle,
    actionLabel,
    actionAriaLabel,
    onAction,
    boxed = false,
    surfaceTone = 'neutral',
    children,
    style,
    contentStyle,
}) => {
    const body = (
        <div style={{ display: 'flex', flexDirection: 'column', gap: SPACE.md }}>
            <div style={headerStyle}>
                <div style={{ minWidth: 0 }}>
                    <div style={titleStyle}>{title}</div>
                    {subtitle ? <div style={subtitleStyle}>{subtitle}</div> : null}
                </div>
                {actionLabel && onAction ? (
                    <button
                        type="button"
                        aria-label={actionAriaLabel ?? actionLabel}
                        onClick={onAction}
                        style={actionButtonStyle}
                    >
                        {actionLabel}
                        <ChevronRight size={14} />
                    </button>
                ) : null}
            </div>

            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: SPACE.md,
                    ...contentStyle,
                }}
            >
                {children}
            </div>
        </div>
    );

    return (
        <section
            style={{
                width: '100%',
                padding: '0 16px',
                marginTop: 20,
                ...style,
            }}
        >
            {boxed ? <div style={SURFACE_STYLE[surfaceTone]}>{body}</div> : body}
        </section>
    );
};

const headerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: SPACE.md,
    padding: '0 4px',
};

const titleStyle: React.CSSProperties = {
    fontFamily: FONT.body,
    fontSize: FONT_SIZE.md + 1,
    fontWeight: 700,
    color: COLOR.dark,
};

const subtitleStyle: React.CSSProperties = {
    fontFamily: FONT.body,
    fontSize: FONT_SIZE.sm,
    color: COLOR.muted,
    marginTop: 4,
    lineHeight: 1.5,
};

const actionButtonStyle: React.CSSProperties = {
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
