import React from 'react';
import { ChevronRight, Users } from 'lucide-react';

interface UserManagementHeaderProps {
    userCount: number;
    expanded: boolean;
    onToggle: () => void;
}

export const UserManagementHeader: React.FC<UserManagementHeaderProps> = ({ userCount, expanded, onToggle }) => {
    return (
        <div
            onClick={onToggle}
            style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '16px 20px',
                cursor: 'pointer',
            }}
        >
            <div style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                background: 'linear-gradient(135deg, #E8F8F0, #D4F0E7)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
            }}>
                <Users size={20} color="#2BBAA0" />
            </div>
            <div style={{ flex: 1 }}>
                <div style={{
                    fontFamily: "'Noto Sans JP', sans-serif",
                    fontSize: 14,
                    fontWeight: 700,
                    color: '#2D3436',
                }}>ユーザー・クラス設定</div>
                <div style={{
                    fontFamily: "'Noto Sans JP', sans-serif",
                    fontSize: 12,
                    color: '#8395A7',
                }}>{userCount}人のユーザーが登録されています</div>
            </div>
            <ChevronRight size={18} color="#B2BEC3" style={{
                transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s ease',
            }} />
        </div>
    );
};
