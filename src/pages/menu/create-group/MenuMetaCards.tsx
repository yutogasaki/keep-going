import React from 'react';

interface MenuMetaCardsProps {
    name: string;
    description: string;
    onNameChange: (name: string) => void;
    onDescriptionChange: (description: string) => void;
}

export const MenuMetaCards: React.FC<MenuMetaCardsProps> = ({
    name,
    description,
    onNameChange,
    onDescriptionChange,
}) => {
    return (
        <>
            <div className="card" style={{ padding: '20px', boxShadow: '0 4px 16px rgba(0,0,0,0.03)', border: 'none' }}>
                <label style={{
                    fontFamily: "'Noto Sans JP', sans-serif",
                    fontSize: 13,
                    fontWeight: 700,
                    color: '#2D3436',
                    display: 'block',
                    marginBottom: 12,
                }}>
                    なまえ
                </label>
                <input
                    type="text"
                    value={name}
                    onChange={(event) => onNameChange(event.target.value)}
                    placeholder="じぶんのメニュー"
                    style={{
                        width: '100%',
                        padding: '16px 20px',
                        borderRadius: 16,
                        border: '1px solid rgba(0,0,0,0.05)',
                        background: '#F8F9FA',
                        fontFamily: "'Noto Sans JP', sans-serif",
                        fontSize: 16,
                        color: '#2D3436',
                        outline: 'none',
                        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)',
                        transition: 'all 0.2s',
                    }}
                />
            </div>

            <div className="card" style={{ padding: '20px', boxShadow: '0 4px 16px rgba(0,0,0,0.03)', border: 'none' }}>
                <label style={{
                    fontFamily: "'Noto Sans JP', sans-serif",
                    fontSize: 13,
                    fontWeight: 700,
                    color: '#2D3436',
                    display: 'block',
                    marginBottom: 12,
                }}>
                    せつめい
                    <span style={{ fontWeight: 400, color: '#B2BEC3', marginLeft: 6, fontSize: 11 }}>じゆう</span>
                </label>
                <textarea
                    value={description}
                    onChange={(event) => onDescriptionChange(event.target.value)}
                    placeholder="メニューの説明やコメント"
                    rows={3}
                    style={{
                        width: '100%',
                        padding: '14px 20px',
                        borderRadius: 16,
                        border: '1px solid rgba(0,0,0,0.05)',
                        background: '#F8F9FA',
                        fontFamily: "'Noto Sans JP', sans-serif",
                        fontSize: 14,
                        color: '#2D3436',
                        outline: 'none',
                        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)',
                        transition: 'all 0.2s',
                        resize: 'none',
                        lineHeight: 1.6,
                    }}
                />
            </div>
        </>
    );
};
