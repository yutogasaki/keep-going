import React from 'react';
import { COLOR, FONT, RADIUS } from '../../../lib/styles';

export type OriginFilterId = 'all' | 'teacher' | 'custom';

const OPTIONS: { id: OriginFilterId; label: string }[] = [
    { id: 'all', label: 'ぜんぶ' },
    { id: 'teacher', label: '先生' },
    { id: 'custom', label: 'じぶん' },
];

interface OriginFilterProps {
    value: OriginFilterId;
    onChange: (value: OriginFilterId) => void;
    /** Hide options that have zero items */
    available?: OriginFilterId[];
}

export const OriginFilter: React.FC<OriginFilterProps> = ({
    value,
    onChange,
    available,
}) => {
    const visibleOptions = available
        ? OPTIONS.filter((o) => o.id === 'all' || available.includes(o.id))
        : OPTIONS;

    // Don't render if only "all" is available
    if (visibleOptions.length <= 1) return null;

    return (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {visibleOptions.map((option) => {
                const active = option.id === value;
                return (
                    <button
                        key={option.id}
                        type="button"
                        onClick={() => onChange(option.id)}
                        style={{
                            padding: '6px 12px',
                            borderRadius: RADIUS.full,
                            border: active ? `1.5px solid ${COLOR.primary}` : '1px solid rgba(0,0,0,0.08)',
                            background: active ? 'rgba(43, 186, 160, 0.12)' : 'rgba(255,255,255,0.8)',
                            color: active ? COLOR.primaryDark : COLOR.text,
                            fontFamily: FONT.body,
                            fontSize: 12,
                            fontWeight: active ? 700 : 600,
                            cursor: 'pointer',
                        }}
                    >
                        {option.label}
                    </button>
                );
            })}
        </div>
    );
};
