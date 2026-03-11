import React from 'react';
import { Edit2 } from 'lucide-react';

interface FuwafuwaStatusPillProps {
    stage: number;
    daysAlive: number;
    isSayonara: boolean;
    name: string | null;
    onEditName: () => void;
}

function getStageMetaLabel(stage: number) {
    if (stage === 1) return 'たまご';
    if (stage === 2) return 'ようせい';
    return 'おとな';
}

export const FuwafuwaStatusPill: React.FC<FuwafuwaStatusPillProps> = ({
    stage,
    daysAlive,
    isSayonara,
    name,
    onEditName,
}) => {
    return (
        <div
            style={{
                marginTop: isSayonara ? 16 : 8,
                padding: '8px 16px',
                background: 'var(--glass-bg)',
                border: 'var(--glass-border)',
                backdropFilter: 'blur(var(--blur-sm))',
                WebkitBackdropFilter: 'blur(var(--blur-sm))',
                boxShadow: 'var(--shadow-xs)',
                borderRadius: 24,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                zIndex: 1,
            }}
        >
            <div
                style={{
                    fontSize: 13,
                    color: '#636E72',
                    fontWeight: 600,
                    fontFamily: "'Noto Sans JP', sans-serif",
                    textAlign: 'center',
                }}
            >
                {stage === 1 ? (
                    <>
                        <span style={{ color: '#2D3436', fontWeight: 800 }}>{getStageMetaLabel(stage)}</span>
                        <span style={{ margin: '0 6px', color: '#B2BEC3' }}>|</span>
                        {daysAlive} 日目
                    </>
                ) : (
                    <>
                        <span style={{ color: '#2D3436', fontWeight: 800 }}>{name || 'なまえなし'}</span>
                        <span style={{ margin: '0 6px', color: '#B2BEC3' }}>|</span>
                        {daysAlive} 日目
                    </>
                )}
            </div>
            {stage !== 1 && (
                <button
                    onClick={onEditName}
                    style={{
                        background: 'none',
                        border: 'none',
                        padding: 4,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#8395A7',
                        borderRadius: '50%',
                        transition: 'background 0.2s',
                    }}
                    onMouseOver={(event) => {
                        event.currentTarget.style.background = 'rgba(0,0,0,0.05)';
                    }}
                    onMouseOut={(event) => {
                        event.currentTarget.style.background = 'none';
                    }}
                    title="名前を変更する"
                >
                    <Edit2 size={14} />
                </button>
            )}
        </div>
    );
};
