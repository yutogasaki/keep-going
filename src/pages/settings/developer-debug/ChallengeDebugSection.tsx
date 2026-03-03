import React from 'react';
import { useAppStore } from '../../../store/useAppStore';

export const ChallengeDebugSection: React.FC = () => {
    const users = useAppStore((state) => state.users);
    const joinedChallengeIds = useAppStore((state) => state.joinedChallengeIds);

    return (
        <div style={{ marginTop: '12px', borderTop: '1px solid rgba(0,0,0,0.1)', paddingTop: '12px' }}>
            <p style={{ fontSize: 12, color: '#2D3436', margin: '0 0 8px', fontWeight: 700 }}>チャレンジ</p>
            <div style={{ fontSize: 11, color: '#8395A7', marginBottom: 8 }}>
                {Object.entries(joinedChallengeIds).map(([userId, challengeIds]) => {
                    const user = users.find((item) => item.id === userId);
                    return challengeIds.length > 0 ? (
                        <div key={userId}>{user?.name || userId.slice(0, 6)}: {challengeIds.length}件</div>
                    ) : null;
                })}
                {Object.values(joinedChallengeIds).every((challengeIds) => challengeIds.length === 0) && '参加なし'}
            </div>
            <button
                onClick={() => {
                    useAppStore.setState({ joinedChallengeIds: {} });
                }}
                style={{
                    padding: '4px 12px',
                    fontSize: 11,
                    borderRadius: 6,
                    border: '1px solid #E17055',
                    background: '#fff',
                    color: '#E17055',
                    cursor: 'pointer',
                }}
            >
                チャレンジ参加リセット
            </button>
        </div>
    );
};
