import React from 'react';

interface IndividualSectionHeadingProps {
    children: React.ReactNode;
}

export const IndividualSectionHeading: React.FC<IndividualSectionHeadingProps> = ({ children }) => (
    <h2
        style={{
            fontFamily: "'Noto Sans JP', sans-serif",
            fontSize: 13,
            fontWeight: 700,
            color: '#8395A7',
            margin: 0,
            letterSpacing: 1,
        }}
    >
        {children}
    </h2>
);
