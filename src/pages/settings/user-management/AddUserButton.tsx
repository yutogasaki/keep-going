import React from 'react';
import { UserPlus } from 'lucide-react';

interface AddUserButtonProps {
    onClick: () => void;
}

export const AddUserButton: React.FC<AddUserButtonProps> = ({ onClick }) => {
    return (
        <button
            onClick={onClick}
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                justifyContent: 'center',
                width: 'calc(100% - 40px)',
                margin: '12px auto',
                padding: '12px',
                borderRadius: 12,
                border: '2px dashed #2BBAA0',
                background: 'rgba(43,186,160,0.05)',
                color: '#2BBAA0',
                fontFamily: "'Noto Sans JP'",
                fontWeight: 700,
                cursor: 'pointer',
            }}
        >
            <UserPlus size={18} />
            新しいユーザーを追加
        </button>
    );
};
