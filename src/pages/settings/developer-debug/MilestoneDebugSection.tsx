import React from 'react';
import { useAppStore } from '../../../store/useAppStore';

const buttonStyle: React.CSSProperties = {
    padding: '6px 12px',
    fontSize: 12,
    borderRadius: 6,
    border: '1px solid #ccc',
    background: '#fff',
};

export const MilestoneDebugSection: React.FC = () => {
    const setActiveMilestoneModal = useAppStore((state) => state.setActiveMilestoneModal);
    const sessionUserIds = useAppStore((state) => state.sessionUserIds);
    const setTab = useAppStore((state) => state.setTab);
    const users = useAppStore((state) => state.users);

    const showMilestone = (milestone: 'egg' | 'fairy' | 'adult') => {
        const targetUserId = sessionUserIds[0] ?? users[0]?.id;
        if (!targetUserId) {
            return;
        }

        setActiveMilestoneModal({
            kind: milestone,
            userId: targetUserId,
            source: 'debug',
        });
        setTab('home');
    };

    return (
        <div style={{ marginTop: '12px', borderTop: '1px solid rgba(0,0,0,0.1)', paddingTop: '12px' }}>
            <p style={{ fontSize: 12, color: '#2D3436', margin: '0 0 8px', fontWeight: 700 }}>メッセージ確認</p>
            <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => showMilestone('egg')} style={buttonStyle}>たまご</button>
                <button onClick={() => showMilestone('fairy')} style={buttonStyle}>かえった</button>
                <button onClick={() => showMilestone('adult')} style={buttonStyle}>そだった</button>
            </div>
        </div>
    );
};
