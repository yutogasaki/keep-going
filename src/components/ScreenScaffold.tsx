import React from 'react';
import {
    SCREEN_BOTTOM_PADDING,
    SCREEN_BOTTOM_WITH_FOOTER,
} from '../lib/styles';

interface ScreenScaffoldProps {
    children: React.ReactNode;
    header?: React.ReactNode;
    withBottomNav?: boolean;
    scroll?: boolean;
    background?: string;
    style?: React.CSSProperties;
    contentStyle?: React.CSSProperties;
}

export const ScreenScaffold: React.FC<ScreenScaffoldProps> = ({
    children,
    header,
    withBottomNav = false,
    scroll = true,
    background = 'transparent',
    style,
    contentStyle,
}) => {
    return (
        <div
            style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                minHeight: 0,
                overflow: 'hidden',
                background,
                ...style,
            }}
        >
            {header}
            <div
                style={{
                    flex: 1,
                    minHeight: 0,
                    overflowY: scroll ? 'auto' : 'visible',
                    WebkitOverflowScrolling: scroll ? 'touch' : undefined,
                    paddingBottom: withBottomNav ? SCREEN_BOTTOM_WITH_FOOTER : SCREEN_BOTTOM_PADDING,
                    ...contentStyle,
                }}
            >
                {children}
            </div>
        </div>
    );
};
