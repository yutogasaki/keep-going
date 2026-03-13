import React from 'react';
import { ChevronDown } from 'lucide-react';
import { COLOR, FONT, FONT_SIZE, RADIUS } from '../../../lib/styles';

interface ShowMoreButtonProps {
    remainingCount: number;
    expanded: boolean;
    onToggle: () => void;
}

export const ShowMoreButton: React.FC<ShowMoreButtonProps> = ({ remainingCount, expanded, onToggle }) => (
    <button
        type="button"
        onClick={onToggle}
        style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            padding: '12px 0',
            border: 'none',
            borderRadius: RADIUS.md,
            background: 'rgba(0,0,0,0.03)',
            cursor: 'pointer',
            fontFamily: FONT.body,
            fontSize: FONT_SIZE.sm,
            fontWeight: 700,
            color: COLOR.muted,
        }}
    >
        {expanded ? 'たたむ' : `あと ${remainingCount} 個を表示`}
        <ChevronDown
            size={14}
            style={{
                transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s ease',
            }}
        />
    </button>
);
