import React from 'react';

interface CreateGroupHeaderProps {
    isEditing: boolean;
    onCancel: () => void;
}

export const CreateGroupHeader: React.FC<CreateGroupHeaderProps> = ({
    isEditing,
    onCancel,
}) => {
    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <button
                onClick={onCancel}
                style={{
                    border: 'none',
                    background: 'none',
                    cursor: 'pointer',
                    fontFamily: "'Noto Sans JP', sans-serif",
                    fontSize: 14,
                    color: '#8395A7',
                }}
            >
                ← もどる
            </button>
            <h1 style={{
                fontFamily: "'Outfit', sans-serif",
                fontSize: 20,
                fontWeight: 700,
                color: '#2D3436',
            }}>
                {isEditing ? 'へんしゅう' : 'じぶんでつくる'}
            </h1>
            <div style={{ width: 48 }} />
        </div>
    );
};
