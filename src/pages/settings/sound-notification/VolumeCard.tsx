import React from 'react';
import { Volume2 } from 'lucide-react';

interface VolumeCardProps {
    volume: number;
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export const VolumeCard: React.FC<VolumeCardProps> = ({ volume, onChange }) => {
    return (
        <div className="card" style={{ padding: 0, display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                    <div style={{
                        width: 32,
                        height: 32,
                        borderRadius: 10,
                        background: 'rgba(43, 186, 160, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}>
                        <Volume2 size={16} color="#2BBAA0" />
                    </div>
                    <div style={{
                        fontFamily: "'Noto Sans JP', sans-serif",
                        fontSize: 14,
                        fontWeight: 700,
                        color: '#2D3436',
                    }}>
                        音量
                    </div>
                </div>
                <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={volume}
                    onChange={onChange}
                    style={{
                        width: '100%',
                        accentColor: '#2BBAA0',
                    }}
                />
            </div>
        </div>
    );
};
