import React from 'react';
import { ArrowLeft } from 'lucide-react';
import {
    COLOR,
    FONT,
    FONT_SIZE,
    HEADER_ICON_BUTTON_SIZE,
    RADIUS,
    SCREEN_HEADER_TOP,
    SCREEN_PADDING_X,
    Z,
} from '../lib/styles';

export type ScreenHeaderTone = 'default' | 'inverted';

interface ScreenHeaderProps {
    title: string;
    rightElement?: React.ReactNode;
    onBack?: () => void;
    sticky?: boolean;
    tone?: ScreenHeaderTone;
    background?: string;
    showBackLabel?: boolean;
    backLabel?: string;
    titleId?: string;
    style?: React.CSSProperties;
}

const toneColors: Record<ScreenHeaderTone, {
    text: string;
    buttonBackground: string;
    buttonText: string;
    background: string;
}> = {
    default: {
        text: COLOR.dark,
        buttonBackground: COLOR.bgMuted,
        buttonText: COLOR.dark,
        background: 'transparent',
    },
    inverted: {
        text: COLOR.white,
        buttonBackground: 'rgba(255,255,255,0.15)',
        buttonText: COLOR.white,
        background: '#1a1a2e',
    },
};

export const ScreenHeader: React.FC<ScreenHeaderProps> = ({
    title,
    rightElement,
    onBack,
    sticky = false,
    tone = 'default',
    background,
    showBackLabel = false,
    backLabel = '前の画面にもどる',
    titleId,
    style,
}) => {
    const colors = toneColors[tone];

    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
                padding: `${SCREEN_HEADER_TOP} ${SCREEN_PADDING_X}px 16px`,
                flexShrink: 0,
                background: background ?? colors.background,
                zIndex: Z.header,
                position: sticky ? 'sticky' : 'relative',
                top: sticky ? 0 : undefined,
                ...style,
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0, flex: 1 }}>
                {onBack ? (
                    <button
                        type="button"
                        onClick={onBack}
                        aria-label={backLabel}
                        style={{
                            minWidth: HEADER_ICON_BUTTON_SIZE,
                            minHeight: HEADER_ICON_BUTTON_SIZE,
                            borderRadius: showBackLabel ? RADIUS.full : RADIUS.circle,
                            border: 'none',
                            background: colors.buttonBackground,
                            color: colors.buttonText,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 6,
                            padding: showBackLabel ? '0 14px' : 0,
                            flexShrink: 0,
                        }}
                    >
                        <ArrowLeft size={18} />
                        {showBackLabel ? (
                            <span style={{
                                fontFamily: FONT.body,
                                fontSize: FONT_SIZE.md,
                                fontWeight: 600,
                            }}
                            >
                                もどる
                            </span>
                        ) : null}
                    </button>
                ) : null}
                <h1
                    id={titleId}
                    style={{
                        fontFamily: FONT.heading,
                        fontSize: FONT_SIZE['3xl'],
                        fontWeight: 700,
                        color: colors.text,
                        margin: 0,
                        minWidth: 0,
                    }}
                >
                    {title}
                </h1>
            </div>

            {rightElement ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                    {rightElement}
                </div>
            ) : null}
        </div>
    );
};
