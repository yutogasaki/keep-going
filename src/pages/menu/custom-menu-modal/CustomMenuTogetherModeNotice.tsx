import React from 'react';
import { FONT, FONT_SIZE, RADIUS, SPACE } from '../../../lib/styles';

export const CustomMenuTogetherModeNotice: React.FC = () => (
    <div
        style={{
            background: '#FFF3E0',
            border: '1px solid #FFE0B2',
            borderRadius: RADIUS.md,
            padding: '12px 16px',
            marginBottom: 20,
            display: 'flex',
            alignItems: 'flex-start',
            gap: SPACE.md,
        }}
    >
        <span style={{ fontSize: 20 }}>👩‍👧‍👦</span>
        <div
            style={{
                fontFamily: FONT.body,
                fontSize: FONT_SIZE.md - 1,
                color: '#E65100',
                lineHeight: 1.6,
            }}
        >
            「みんなで！」モード中は全員のおまかせ設定が合算されます。<br />
            <strong>個人の設定を変えるときは、ヘッダーのバッジから見たい人を選んでね。</strong>
        </div>
    </div>
);
