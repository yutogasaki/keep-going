import React from 'react';

interface ExerciseNameProps {
    name: string;
    reading?: string;
    rtStyle?: React.CSSProperties;
}

/**
 * エクササイズ名をふりがな付きで表示するコンポーネント。
 * reading が指定されている場合は <ruby> タグでふりがなを表示する。
 */
export const ExerciseName: React.FC<ExerciseNameProps> = ({ name, reading, rtStyle }) => {
    if (!reading) return <>{name}</>;
    return (
        <ruby>
            {name}
            <rt style={{
                fontSize: '0.42em',
                letterSpacing: '0.04em',
                fontWeight: 500,
                ...rtStyle,
            }}>
                {reading}
            </rt>
        </ruby>
    );
};
