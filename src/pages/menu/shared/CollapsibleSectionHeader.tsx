import React from 'react';
import { ChevronDown } from 'lucide-react';

interface CollapsibleSectionHeaderProps {
    title: string;
    count?: number;
    summary?: string;
    expanded: boolean;
    onToggle: () => void;
}

export const CollapsibleSectionHeader: React.FC<CollapsibleSectionHeaderProps> = ({
    title,
    count,
    summary,
    expanded,
    onToggle,
}) => (
    <button
        type="button"
        onClick={onToggle}
        style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            padding: 0,
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            textAlign: 'left',
        }}
    >
        <div
            style={{
                display: 'flex',
                alignItems: 'baseline',
                gap: 8,
                minWidth: 0,
            }}
        >
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
                {title}
            </h2>
            {typeof count === 'number' ? (
                <span
                    style={{
                        fontFamily: "'Outfit', sans-serif",
                        fontSize: 12,
                        fontWeight: 700,
                        color: '#B2BEC3',
                    }}
                >
                    {count}
                </span>
            ) : null}
            {summary ? (
                <span
                    style={{
                        fontFamily: "'Noto Sans JP', sans-serif",
                        fontSize: 11,
                        fontWeight: 600,
                        color: '#98A6AD',
                        minWidth: 0,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                    }}
                >
                    {summary}
                </span>
            ) : null}
        </div>
        <ChevronDown
            size={16}
            color="#B2BEC3"
            style={{
                flexShrink: 0,
                transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s ease',
            }}
        />
    </button>
);
