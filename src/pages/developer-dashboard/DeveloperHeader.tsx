import React from 'react';
import { ArrowLeft, RefreshCw } from 'lucide-react';

interface DeveloperHeaderProps {
    onBack: () => void;
    onRefresh: () => void;
}

export const DeveloperHeader: React.FC<DeveloperHeaderProps> = ({
    onBack,
    onRefresh,
}) => {
    return (
        <div style={{
            position: 'sticky',
            top: 0,
            zIndex: 10,
            background: '#1a1a2e',
            color: '#fff',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
        }}>
            <button
                onClick={onBack}
                style={{
                    background: 'none',
                    border: 'none',
                    color: '#fff',
                    cursor: 'pointer',
                    padding: 4,
                    display: 'flex',
                }}
            >
                <ArrowLeft size={20} />
            </button>
            <span style={{ fontWeight: 700, fontSize: 16 }}>Developer Dashboard</span>
            <div style={{ flex: 1 }} />
            <button
                onClick={onRefresh}
                style={{
                    background: 'rgba(255,255,255,0.15)',
                    border: 'none',
                    color: '#fff',
                    borderRadius: 6,
                    padding: '6px 10px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                }}
            >
                <RefreshCw size={14} />
            </button>
        </div>
    );
};
