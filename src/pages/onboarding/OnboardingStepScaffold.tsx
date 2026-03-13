import React from 'react';
import { ChevronLeft } from 'lucide-react';
import {
    COLOR,
    FONT,
    FONT_SIZE,
    RADIUS,
    SCREEN_PADDING_X,
    SPACE,
} from '../../lib/styles';

interface OnboardingStepScaffoldProps {
    children: React.ReactNode;
    onBack?: () => void;
    maxWidth?: number;
    gap?: number;
}

export const OnboardingStepScaffold: React.FC<OnboardingStepScaffoldProps> = ({
    children,
    onBack,
    maxWidth = 400,
    gap = SPACE.xl,
}) => {
    return (
        <div
            style={{
                width: '100%',
                maxWidth,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap,
                padding: `0 ${SCREEN_PADDING_X}px`,
                boxSizing: 'border-box',
                textAlign: 'center',
            }}
        >
            {onBack ? (
                <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-start' }}>
                    <button
                        type="button"
                        onClick={onBack}
                        aria-label="前の画面にもどる"
                        style={{
                            minWidth: 44,
                            minHeight: 44,
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: SPACE.xs,
                            padding: '0 14px',
                            borderRadius: RADIUS.full,
                            background: 'rgba(255,255,255,0.7)',
                            border: '1px solid rgba(255,255,255,0.55)',
                            color: COLOR.muted,
                            fontSize: FONT_SIZE.md,
                            fontFamily: FONT.body,
                            fontWeight: 600,
                            cursor: 'pointer',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
                            backdropFilter: 'blur(12px)',
                            WebkitBackdropFilter: 'blur(12px)',
                        }}
                    >
                        <ChevronLeft size={18} />
                        もどる
                    </button>
                </div>
            ) : null}

            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap }}>
                {children}
            </div>
        </div>
    );
};
