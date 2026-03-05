import React from 'react';
import { COLOR, FONT, FONT_SIZE, inputField } from '../../../lib/styles';

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
                    fontFamily: FONT.body,
                    fontSize: 13,
                    fontWeight: 700,
                    color: COLOR.dark,
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
                        ...inputField,
                        fontSize: FONT_SIZE.lg,
                        color: COLOR.dark,
                        transition: 'all 0.2s',
                    }}
                />
            </div>

            <div className="card" style={{ padding: '20px', boxShadow: '0 4px 16px rgba(0,0,0,0.03)', border: 'none' }}>
                <label style={{
                    fontFamily: FONT.body,
                    fontSize: 13,
                    fontWeight: 700,
                    color: COLOR.dark,
                    display: 'block',
                    marginBottom: 12,
                }}>
                    せつめい
                    <span style={{ fontWeight: 400, color: COLOR.light, marginLeft: 6, fontSize: 11 }}>じゆう</span>
                </label>
                <textarea
                    value={description}
                    onChange={(event) => onDescriptionChange(event.target.value)}
                    placeholder="メニューの説明やコメント"
                    rows={3}
                    style={{
                        ...inputField,
                        fontSize: FONT_SIZE.md,
                        color: COLOR.dark,
                        transition: 'all 0.2s',
                        resize: 'none',
                        lineHeight: 1.6,
                    }}
                />
            </div>
        </>
    );
};
