import React, { useState } from 'react';
import { getDateKeyOffset, getTodayKey } from '../../../lib/db';
import { useAppStore } from '../../../store/useAppStore';

const buttonStyle: React.CSSProperties = {
    padding: '6px 12px',
    fontSize: 12,
    borderRadius: 6,
    border: '1px solid #ccc',
    background: '#fff',
    cursor: 'pointer',
};

const selectRowLabelStyle: React.CSSProperties = {
    fontSize: 12,
    width: 50,
    color: '#8395A7',
    flexShrink: 0,
};

const selectStyle: React.CSSProperties = {
    padding: 4,
    borderRadius: 4,
    flex: 1,
    border: '1px solid #ccc',
};

export const FuwafuwaDebugSection: React.FC = () => {
    const users = useAppStore((state) => state.users);
    const updateUser = useAppStore((state) => state.updateUser);
    const debugFuwafuwaType = useAppStore((state) => state.debugFuwafuwaType);
    const debugFuwafuwaStage = useAppStore((state) => state.debugFuwafuwaStage);
    const debugFuwafuwaScale = useAppStore((state) => state.debugFuwafuwaScale);
    const debugActiveDays = useAppStore((state) => state.debugActiveDays);
    const setDebugFuwafuwaType = useAppStore((state) => state.setDebugFuwafuwaType);
    const setDebugFuwafuwaStage = useAppStore((state) => state.setDebugFuwafuwaStage);
    const setDebugFuwafuwaScale = useAppStore((state) => state.setDebugFuwafuwaScale);
    const setDebugActiveDays = useAppStore((state) => state.setDebugActiveDays);

    const primaryUser = users[0];
    const [lastSet, setLastSet] = useState<string | null>(null);

    const birthDate = primaryUser?.fuwafuwaBirthDate ?? null;
    const daysAlive = birthDate
        ? Math.max(0, Math.floor((new Date(getTodayKey()).getTime() - new Date(birthDate).getTime()) / (1000 * 60 * 60 * 24))) + 1
        : 0;

    const setBirthDateByOffset = (offset: number) => {
        if (!primaryUser) return;
        const newDate = getDateKeyOffset(offset);
        updateUser(primaryUser.id, { fuwafuwaBirthDate: newDate });
        setLastSet(newDate);
        window.setTimeout(() => setLastSet(null), 1500);
    };

    return (
        <>
            <p style={{ fontSize: 11, color: '#8395A7', margin: 0 }}>
                ふわふわの年齢を偽装します (Homeに即時反映)
            </p>
            <div style={{
                fontSize: 11, color: '#2D3436', margin: '4px 0',
                padding: '4px 8px', background: 'rgba(43,186,160,0.08)', borderRadius: 6,
            }}>
                現在: {birthDate ?? '未設定'} (Day {daysAlive})
                {lastSet && <span style={{ color: '#2BBAA0', marginLeft: 8 }}>✓ 更新済み</span>}
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button onClick={() => setBirthDateByOffset(-4)} style={buttonStyle}>Day 5 (たまご)</button>
                <button onClick={() => setBirthDateByOffset(-14)} style={buttonStyle}>Day 15 (妖精)</button>
                <button onClick={() => setBirthDateByOffset(-25)} style={buttonStyle}>Day 26 (成体)</button>
                <button onClick={() => setBirthDateByOffset(-29)} style={buttonStyle}>Day 30 (お別れ)</button>
            </div>

            <div style={{ marginTop: '12px', borderTop: '1px solid rgba(0,0,0,0.1)', paddingTop: '12px' }}>
                <p style={{ fontSize: 12, color: '#2D3436', margin: '0 0 8px', fontWeight: 700 }}>姿を強制上書き (即時反映)</p>
                <div style={{ display: 'flex', gap: 8, flexDirection: 'column' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={selectRowLabelStyle}>種類:</span>
                        <select
                            value={debugFuwafuwaType ?? ''}
                            onChange={(event) => setDebugFuwafuwaType(event.target.value !== '' ? Number(event.target.value) : null)}
                            style={selectStyle}
                        >
                            <option value="">(デフォルト)</option>
                            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((value) => (
                                <option key={value} value={value}>タイプ {value}</option>
                            ))}
                        </select>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={selectRowLabelStyle}>段階:</span>
                        <select
                            value={debugFuwafuwaStage ?? ''}
                            onChange={(event) => setDebugFuwafuwaStage(event.target.value !== '' ? Number(event.target.value) : null)}
                            style={selectStyle}
                        >
                            <option value="">(デフォルト)</option>
                            <option value="1">たまご (Stage 1)</option>
                            <option value="2">妖精 (Stage 2)</option>
                            <option value="3">成体 (Stage 3)</option>
                        </select>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={selectRowLabelStyle}>サイズ:</span>
                        <select
                            value={debugFuwafuwaScale ?? ''}
                            onChange={(event) => setDebugFuwafuwaScale(event.target.value !== '' ? Number(event.target.value) : null)}
                            style={selectStyle}
                        >
                            <option value="">(デフォルト)</option>
                            <option value="0.5">小 (0.5)</option>
                            <option value="0.75">中 (0.75)</option>
                            <option value="1">大 (1.0)</option>
                        </select>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={selectRowLabelStyle}>活動日:</span>
                        <select
                            value={debugActiveDays ?? ''}
                            onChange={(event) => setDebugActiveDays(event.target.value !== '' ? Number(event.target.value) : null)}
                            style={selectStyle}
                        >
                            <option value="">(デフォルト)</option>
                            <option value="0">0日 (オーラなし)</option>
                            <option value="2">2日 (ピンクオーラ)</option>
                            <option value="5">5日 (金オーラ+蛍)</option>
                            <option value="10">10日 (金オーラ+蛍)</option>
                        </select>
                    </div>
                </div>
                <button
                    onClick={() => {
                        setDebugFuwafuwaType(null);
                        setDebugFuwafuwaStage(null);
                        setDebugFuwafuwaScale(null);
                        setDebugActiveDays(null);
                    }}
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
                    すべてリセット
                </button>
            </div>
        </>
    );
};
