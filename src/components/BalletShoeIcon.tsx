import React from 'react';

interface BalletShoeIconProps {
    size?: number;
    color?: string;
    className?: string;
}

export const BalletShoeIcon: React.FC<BalletShoeIconProps> = ({
    size = 32,
    color = 'white',
    className = ''
}) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
    >
        {/* Ballet pointe shoe — stylized, unique */}
        <path
            d="M32 8C28 8 24 12 22 18C20 24 19 28 18 32C17 36 16 40 18 44C20 48 24 50 28 50L30 50C30 54 31 56 34 56C37 56 38 54 38 50L40 50C44 50 48 48 50 44C52 40 50 36 48 32C46 28 44 24 42 18C40 12 36 8 32 8Z"
            fill={color}
            fillOpacity="0.95"
        />
        {/* Ribbon wrapping around ankle */}
        <path
            d="M26 18C24 20 22 24 24 26C26 24 28 20 30 18"
            stroke={color}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeOpacity="0.6"
        />
        <path
            d="M38 18C40 20 42 24 40 26C38 24 36 20 34 18"
            stroke={color}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeOpacity="0.6"
        />
        {/* Toe box detail */}
        <path
            d="M24 44C28 46 36 46 40 44"
            stroke={color}
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeOpacity="0.4"
        />
    </svg>
);
