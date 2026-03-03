import React from 'react';

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
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: borderBottom ? '1px solid rgba(0,0,0,0.06)' : 'none',
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
                        fontFamily: "'Noto Sans JP', sans-serif",
                        fontSize: 14,
                        fontWeight: 700,
                        color: '#2D3436',
                    }}>
                        {title}
                    </div>
                    {description && (
                        <div style={{
                            fontFamily: "'Noto Sans JP', sans-serif",
                            fontSize: 11,
                            color: '#8395A7',
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
