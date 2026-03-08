import React from 'react';
import { Check } from 'lucide-react';

interface ExerciseSelectionIndicatorProps {
    selected?: boolean;
}

export const ExerciseSelectionIndicator: React.FC<ExerciseSelectionIndicatorProps> = ({ selected }) => (
    <div
        style={{
            width: 28,
            height: 28,
            borderRadius: 10,
            border: selected ? 'none' : '2px solid #DFE6E9',
            background: selected ? '#2BBAA0' : 'transparent',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            transition: 'all 0.15s ease',
        }}
    >
        {selected ? <Check size={16} color="#FFF" strokeWidth={3} /> : null}
    </div>
);
