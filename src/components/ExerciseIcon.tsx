
import React from 'react';

interface ExerciseIconProps {
    id: string;      // The exercise ID (e.g. 'S01', 'C01')
    emoji: string;   // Fallback emoji
    size?: number;   // Icon size in pixels
    color?: string;  // Unused, kept for API compatibility
}

export const ExerciseIcon: React.FC<ExerciseIconProps> = React.memo(({ emoji, size = 32 }) => {
    return (
        <span style={{
            fontSize: size,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            lineHeight: 1
        }}>
            {emoji}
        </span>
    );
});
