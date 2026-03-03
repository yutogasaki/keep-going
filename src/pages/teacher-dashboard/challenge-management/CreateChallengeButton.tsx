import React from 'react';
import { Plus } from 'lucide-react';

interface CreateChallengeButtonProps {
    onClick: () => void;
}

export const CreateChallengeButton: React.FC<CreateChallengeButtonProps> = ({ onClick }) => {
    return (
        <button
            onClick={onClick}
            style={{
                padding: '12px 0',
                borderRadius: 12,
                border: '2px dashed #B2BEC3',
                background: 'transparent',
                color: '#8395A7',
                fontFamily: "'Noto Sans JP', sans-serif",
                fontSize: 14,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
            }}
        >
            <Plus size={16} />
            チャレンジを作成
        </button>
    );
};
