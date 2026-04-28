import React from 'react';
import { Cloud, ShieldCheck, Smartphone } from 'lucide-react';

interface SyncAccountGuideCardProps {
    compact?: boolean;
}

const items = [
    {
        icon: Smartphone,
        title: 'この端末',
        body: 'データはまずこの端末に保存されます',
        color: '#0984E3',
        background: 'rgba(9, 132, 227, 0.10)',
    },
    {
        icon: Cloud,
        title: 'アカウント',
        body: 'クラウドにも保存して、別の端末で復元できます',
        color: '#2BBAA0',
        background: 'rgba(43, 186, 160, 0.10)',
    },
    {
        icon: ShieldCheck,
        title: 'データが重なったら',
        body: 'この端末とクラウドの内容を見て安全に選べます',
        color: '#6C5CE7',
        background: 'rgba(108, 92, 231, 0.10)',
    },
];

export const SyncAccountGuideCard: React.FC<SyncAccountGuideCardProps> = ({
    compact = false,
}) => {
    return (
        <div
            style={{
                width: '100%',
                borderRadius: 18,
                padding: compact ? '12px 14px' : '14px 16px',
                background: 'linear-gradient(180deg, rgba(255,255,255,0.92), rgba(248,250,252,0.92))',
                border: '1px solid rgba(0,0,0,0.06)',
                display: 'flex',
                flexDirection: 'column',
                gap: compact ? 10 : 12,
                textAlign: 'left',
            }}
        >
            <div
                style={{
                    fontFamily: "'Noto Sans JP', sans-serif",
                    fontSize: compact ? 11 : 12,
                    fontWeight: 700,
                    color: '#7F8C8D',
                    letterSpacing: 0.4,
                }}
            >
                アカウントでできること
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {items.map(({ icon: Icon, title, body, color, background }) => (
                    <div
                        key={title}
                        style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: 10,
                            padding: compact ? '8px 10px' : '9px 10px',
                            borderRadius: 14,
                            background,
                        }}
                    >
                        <div
                            style={{
                                width: 28,
                                height: 28,
                                borderRadius: 10,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color,
                                background: 'rgba(255,255,255,0.8)',
                                flexShrink: 0,
                            }}
                        >
                            <Icon size={15} />
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <span
                                style={{
                                    fontFamily: "'Noto Sans JP', sans-serif",
                                    fontSize: compact ? 12 : 13,
                                    fontWeight: 700,
                                    color: '#2D3436',
                                    lineHeight: 1.4,
                                }}
                            >
                                {title}
                            </span>
                            <span
                                style={{
                                    fontFamily: "'Noto Sans JP', sans-serif",
                                    fontSize: compact ? 11 : 12,
                                    color: '#52606D',
                                    lineHeight: 1.5,
                                }}
                            >
                                {body}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
