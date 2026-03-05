import React from 'react';

interface PageHeaderProps {
    title: string;
    rightElement?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = React.memo(({ title, rightElement }) => {
    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '24px 20px 16px', // Standardized top padding padding
            flexShrink: 0,
            background: 'transparent', // Let parent gradient show through
            zIndex: 10,
        }}>
            <h1 style={{
                fontFamily: "'Outfit', sans-serif",
                fontSize: 24,
                fontWeight: 700,
                color: '#2D3436',
                margin: 0,
            }}>
                {title}
            </h1>
            {rightElement && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {rightElement}
                </div>
            )}
        </div>
    );
});
