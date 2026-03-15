import React from 'react';
import { Globe } from 'lucide-react';

interface PublishToggleCardProps {
    isPublic: boolean;
    onToggle: () => void;
    disabled?: boolean;
    subtitle?: string;
}

export const PublishToggleCard: React.FC<PublishToggleCardProps> = ({
    isPublic,
    onToggle,
    disabled = false,
    subtitle = '他の人がこのメニューをもらえるようになります',
}) => {
    return (
        <div className="card" style={{
            padding: '16px 20px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.03)',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            opacity: disabled ? 0.72 : 1,
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Globe size={18} color={isPublic ? '#0984E3' : '#B2BEC3'} />
                <div>
                    <div style={{
                        fontFamily: "'Noto Sans JP', sans-serif",
                        fontSize: 14,
                        fontWeight: 700,
                        color: '#2D3436',
                    }}>
                        みんなに公開する
                    </div>
                    <div style={{
                        fontFamily: "'Noto Sans JP', sans-serif",
                        fontSize: 11,
                        color: '#8395A7',
                    }}>
                        {subtitle}
                    </div>
                </div>
            </div>
            <button
                type="button"
                onClick={() => {
                    if (!disabled) {
                        onToggle();
                    }
                }}
                disabled={disabled}
                style={{
                    width: 48,
                    height: 28,
                    borderRadius: 14,
                    border: 'none',
                    background: isPublic ? '#0984E3' : '#DFE6E9',
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    position: 'relative',
                    transition: 'background 0.2s',
                    flexShrink: 0,
                }}
            >
                <div style={{
                    width: 22,
                    height: 22,
                    borderRadius: '50%',
                    background: 'white',
                    position: 'absolute',
                    top: 3,
                    left: isPublic ? 23 : 3,
                    transition: 'left 0.2s',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
                }} />
            </button>
        </div>
    );
};
