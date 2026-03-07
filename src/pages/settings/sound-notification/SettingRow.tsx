import React from 'react';
import { COLOR, FONT, FONT_SIZE, SPACE } from '../../../lib/styles';

interface SettingRowProps {
    icon: React.ReactNode;
    iconBackground: string;
    title: string;
    description?: string;
    borderBottom?: boolean;
    rightContent: React.ReactNode;
}

export const SettingRow: React.FC<SettingRowProps> = ({
    icon,
    iconBackground,
    title,
    description,
    borderBottom = false,
    rightContent,
}) => {
    return (
        <div style={{
            padding: `${SPACE.lg}px ${SPACE.xl}px`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: SPACE.md,
            borderBottom: borderBottom ? `1px solid ${COLOR.border}` : 'none',
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                    width: 32,
                    height: 32,
                    borderRadius: 10,
                    background: iconBackground,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}>
                    {icon}
                </div>
                <div>
                    <div style={{
                        fontFamily: FONT.body,
                        fontSize: FONT_SIZE.md,
                        fontWeight: 700,
                        color: COLOR.dark,
                    }}>
                        {title}
                    </div>
                    {description && (
                        <div style={{
                            fontFamily: FONT.body,
                            fontSize: 11,
                            color: COLOR.muted,
                            marginTop: 2,
                        }}>
                            {description}
                        </div>
                    )}
                </div>
            </div>
            {rightContent}
        </div>
    );
};
