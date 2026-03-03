import React from 'react';
import { useAppStore } from '../../../store/useAppStore';

export const ChibifuwaDebugSection: React.FC = () => {
    const users = useAppStore((state) => state.users);
    const addChibifuwa = useAppStore((state) => state.addChibifuwa);
    const updateUser = useAppStore((state) => state.updateUser);

    const primaryUser = users[0];

    return (
        <div style={{ marginTop: '12px', borderTop: '1px solid rgba(0,0,0,0.1)', paddingTop: '12px' }}>
            <p style={{ fontSize: 12, color: '#2D3436', margin: '0 0 8px', fontWeight: 700 }}>ちびふわバッジ</p>
            {primaryUser && (
                <>
                    <div style={{ fontSize: 11, color: '#8395A7', marginBottom: 8 }}>
                        所持: {primaryUser.chibifuwas?.length || 0}個
                    </div>
                    {(primaryUser.chibifuwas?.length || 0) > 0 && (
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                            {primaryUser.chibifuwas.map((badge) => (
                                <div key={badge.id} style={{
                                    padding: '4px 8px',
                                    borderRadius: 8,
                                    background: '#F0FDFA',
                                    fontSize: 11,
                                    color: '#2D3436',
                                    border: '1px solid rgba(43,186,160,0.2)',
                                }}>
                                    Type{badge.type} - {badge.challengeTitle}
                                </div>
                            ))}
                        </div>
                    )}
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 11, color: '#8395A7', lineHeight: '28px' }}>追加:</span>
                        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((type) => (
                            <button
                                key={type}
                                onClick={() => {
                                    addChibifuwa(primaryUser.id, {
                                        type,
                                        challengeTitle: `テストバッジ${type}`,
                                        earnedDate: new Date().toISOString().split('T')[0],
                                    });
                                }}
                                style={{
                                    padding: '4px 8px',
                                    fontSize: 11,
                                    borderRadius: 6,
                                    border: '1px solid #ccc',
                                    background: '#fff',
                                    cursor: 'pointer',
                                }}
                            >
                                T{type}
                            </button>
                        ))}
                    </div>
                    <button
                        onClick={() => updateUser(primaryUser.id, { chibifuwas: [] })}
                        style={{
                            marginTop: 8,
                            padding: '4px 12px',
                            fontSize: 11,
                            borderRadius: 6,
                            border: '1px solid #E17055',
                            background: '#fff',
                            color: '#E17055',
                            cursor: 'pointer',
                        }}
                    >
                        バッジ全削除
                    </button>
                </>
            )}
        </div>
    );
};
