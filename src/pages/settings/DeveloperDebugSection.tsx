import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { Bug } from 'lucide-react';
import { getDateKeyOffset } from '../../lib/db';
import { useAppStore } from '../../store/useAppStore';

const DEV_PASSWORD = '0320';

export const DeveloperDebugSection: React.FC = () => {
    const users = useAppStore(s => s.users);
    const updateUser = useAppStore(s => s.updateUser);
    const addChibifuwa = useAppStore(s => s.addChibifuwa);
    const joinedChallengeIds = useAppStore(s => s.joinedChallengeIds);
    const debugFuwafuwaType = useAppStore(s => s.debugFuwafuwaType);
    const debugFuwafuwaStage = useAppStore(s => s.debugFuwafuwaStage);
    const debugFuwafuwaScale = useAppStore(s => s.debugFuwafuwaScale);
    const debugActiveDays = useAppStore(s => s.debugActiveDays);
    const setDebugFuwafuwaType = useAppStore(s => s.setDebugFuwafuwaType);
    const setDebugFuwafuwaStage = useAppStore(s => s.setDebugFuwafuwaStage);
    const setDebugFuwafuwaScale = useAppStore(s => s.setDebugFuwafuwaScale);
    const setDebugActiveDays = useAppStore(s => s.setDebugActiveDays);
    const setActiveMilestoneModal = useAppStore(s => s.setActiveMilestoneModal);
    const setTab = useAppStore(s => s.setTab);

    const [showDeveloperDebug, setShowDeveloperDebug] = useState(false);
    const [showDevPasswordModal, setShowDevPasswordModal] = useState(false);
    const [devPasswordInput, setDevPasswordInput] = useState('');

    const appendDevPasswordDigit = (digit: string) => {
        const next = (devPasswordInput + digit).slice(0, 4);
        if (next === devPasswordInput) return;

        setDevPasswordInput(next);

        if (next.length === 4) {
            if (next === DEV_PASSWORD) {
                setShowDevPasswordModal(false);
                setShowDeveloperDebug(true);
            } else {
                window.setTimeout(() => setDevPasswordInput(''), 300);
            }
        }
    };

    const closeDevPasswordModal = () => {
        setShowDevPasswordModal(false);
        setDevPasswordInput('');
    };

    const backspaceDevPassword = () => {
        setDevPasswordInput(prev => prev.slice(0, -1));
    };

    return (
        <>
            {!showDeveloperDebug && (
                <div style={{ display: 'flex', justifyContent: 'center', marginTop: 16 }}>
                    <button
                        onClick={() => {
                            setDevPasswordInput('');
                            setShowDevPasswordModal(true);
                        }}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: '#B2BEC3',
                            fontSize: 11,
                            cursor: 'pointer',
                            padding: '8px 16px',
                            fontFamily: "'Noto Sans JP', sans-serif",
                        }}
                    >
                        開発者モード
                    </button>
                </div>
            )}

            {showDevPasswordModal && createPortal(
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'rgba(0,0,0,0.3)',
                    backdropFilter: 'blur(4px)',
                    zIndex: 200,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 24,
                }}>
                    <motion.div
                        className="card"
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        style={{
                            textAlign: 'center',
                            padding: '32px 24px',
                            maxWidth: 280,
                            width: '100%',
                        }}
                    >
                        <h3 style={{
                            fontFamily: "'Noto Sans JP', sans-serif",
                            fontSize: 16,
                            fontWeight: 700,
                            color: '#2D3436',
                            marginBottom: 16,
                        }}>
                            パスワードを入力
                        </h3>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'center',
                            gap: 8,
                            marginBottom: 20,
                        }}>
                            {[0, 1, 2, 3].map(i => (
                                <div key={i} style={{
                                    width: 40,
                                    height: 48,
                                    borderRadius: 8,
                                    border: '2px solid #DFE6E9',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: 24,
                                    fontWeight: 700,
                                    color: '#2D3436',
                                    background: devPasswordInput[i] ? '#F0FDFA' : '#fff',
                                }}>
                                    {devPasswordInput[i] ? '●' : ''}
                                </div>
                            ))}
                        </div>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(3, 1fr)',
                            gap: 8,
                            maxWidth: 220,
                            margin: '0 auto',
                        }}>
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
                                <button
                                    key={n}
                                    onClick={() => appendDevPasswordDigit(String(n))}
                                    style={{
                                        width: '100%',
                                        aspectRatio: '1',
                                        borderRadius: 12,
                                        border: '1px solid #DFE6E9',
                                        background: '#fff',
                                        fontSize: 20,
                                        fontWeight: 700,
                                        color: '#2D3436',
                                        cursor: 'pointer',
                                    }}
                                >
                                    {n}
                                </button>
                            ))}
                            <button
                                onClick={closeDevPasswordModal}
                                style={{
                                    width: '100%',
                                    aspectRatio: '1',
                                    borderRadius: 12,
                                    border: '1px solid #DFE6E9',
                                    background: '#fff',
                                    fontSize: 14,
                                    color: '#8395A7',
                                    cursor: 'pointer',
                                }}
                            >
                                ✕
                            </button>
                            <button
                                onClick={() => appendDevPasswordDigit('0')}
                                style={{
                                    width: '100%',
                                    aspectRatio: '1',
                                    borderRadius: 12,
                                    border: '1px solid #DFE6E9',
                                    background: '#fff',
                                    fontSize: 20,
                                    fontWeight: 700,
                                    color: '#2D3436',
                                    cursor: 'pointer',
                                }}
                            >
                                0
                            </button>
                            <button
                                onClick={backspaceDevPassword}
                                style={{
                                    width: '100%',
                                    aspectRatio: '1',
                                    borderRadius: 12,
                                    border: '1px solid #DFE6E9',
                                    background: '#fff',
                                    fontSize: 14,
                                    color: '#8395A7',
                                    cursor: 'pointer',
                                }}
                            >
                                ←
                            </button>
                        </div>
                    </motion.div>
                </div>,
                document.body,
            )}

            {showDeveloperDebug && (
                <div className="card card-sm" style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12,
                    marginTop: 24,
                    border: '1px dashed #E17055',
                }}>
                    <div style={{
                        fontFamily: "'Noto Sans JP', sans-serif",
                        fontSize: 14,
                        fontWeight: 700,
                        color: '#E17055',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                    }}>
                        <Bug size={16} />
                        デバッグ機能 (開発専用)
                    </div>

                    <p style={{ fontSize: 11, color: '#8395A7', margin: 0 }}>
                        ふわふわの年齢を偽装します (Homeに即時反映)
                    </p>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <button
                            onClick={() => {
                                if (!users[0]) return;
                                updateUser(users[0].id, { fuwafuwaBirthDate: getDateKeyOffset(-4) });
                            }}
                            style={{ padding: '6px 12px', fontSize: 12, borderRadius: 6, border: '1px solid #ccc', background: '#fff' }}
                        >
                            Day 5 (たまご)
                        </button>
                        <button
                            onClick={() => {
                                if (!users[0]) return;
                                updateUser(users[0].id, { fuwafuwaBirthDate: getDateKeyOffset(-14) });
                            }}
                            style={{ padding: '6px 12px', fontSize: 12, borderRadius: 6, border: '1px solid #ccc', background: '#fff' }}
                        >
                            Day 15 (妖精)
                        </button>
                        <button
                            onClick={() => {
                                if (!users[0]) return;
                                updateUser(users[0].id, { fuwafuwaBirthDate: getDateKeyOffset(-25) });
                            }}
                            style={{ padding: '6px 12px', fontSize: 12, borderRadius: 6, border: '1px solid #ccc', background: '#fff' }}
                        >
                            Day 26 (成体)
                        </button>
                        <button
                            onClick={() => {
                                if (!users[0]) return;
                                updateUser(users[0].id, { fuwafuwaBirthDate: getDateKeyOffset(-29) });
                            }}
                            style={{ padding: '6px 12px', fontSize: 12, borderRadius: 6, border: '1px solid #ccc', background: '#fff' }}
                        >
                            Day 30 (お別れ)
                        </button>
                    </div>

                    <div style={{ marginTop: '12px', borderTop: '1px solid rgba(0,0,0,0.1)', paddingTop: '12px' }}>
                        <p style={{ fontSize: 12, color: '#2D3436', margin: '0 0 8px', fontWeight: 700 }}>姿を強制上書き (即時反映)</p>
                        <div style={{ display: 'flex', gap: 8, flexDirection: 'column' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{ fontSize: 12, width: 50, color: '#8395A7', flexShrink: 0 }}>種類:</span>
                                <select
                                    value={debugFuwafuwaType ?? ''}
                                    onChange={(e) => setDebugFuwafuwaType(e.target.value !== '' ? Number(e.target.value) : null)}
                                    style={{ padding: 4, borderRadius: 4, flex: 1, border: '1px solid #ccc' }}
                                >
                                    <option value="">(デフォルト)</option>
                                    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(v => <option key={v} value={v}>タイプ {v}</option>)}
                                </select>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{ fontSize: 12, width: 50, color: '#8395A7', flexShrink: 0 }}>段階:</span>
                                <select
                                    value={debugFuwafuwaStage ?? ''}
                                    onChange={(e) => setDebugFuwafuwaStage(e.target.value !== '' ? Number(e.target.value) : null)}
                                    style={{ padding: 4, borderRadius: 4, flex: 1, border: '1px solid #ccc' }}
                                >
                                    <option value="">(デフォルト)</option>
                                    <option value="1">たまご (Stage 1)</option>
                                    <option value="2">妖精 (Stage 2)</option>
                                    <option value="3">成体 (Stage 3)</option>
                                </select>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{ fontSize: 12, width: 50, color: '#8395A7', flexShrink: 0 }}>サイズ:</span>
                                <select
                                    value={debugFuwafuwaScale ?? ''}
                                    onChange={(e) => setDebugFuwafuwaScale(e.target.value !== '' ? Number(e.target.value) : null)}
                                    style={{ padding: 4, borderRadius: 4, flex: 1, border: '1px solid #ccc' }}
                                >
                                    <option value="">(デフォルト)</option>
                                    <option value="0.5">小 (0.5)</option>
                                    <option value="0.75">中 (0.75)</option>
                                    <option value="1">大 (1.0)</option>
                                </select>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{ fontSize: 12, width: 50, color: '#8395A7', flexShrink: 0 }}>活動日:</span>
                                <select
                                    value={debugActiveDays ?? ''}
                                    onChange={(e) => setDebugActiveDays(e.target.value !== '' ? Number(e.target.value) : null)}
                                    style={{ padding: 4, borderRadius: 4, flex: 1, border: '1px solid #ccc' }}
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
                            style={{ marginTop: 8, padding: '4px 12px', fontSize: 11, borderRadius: 6, border: '1px solid #E17055', background: '#fff', color: '#E17055', cursor: 'pointer' }}
                        >
                            すべてリセット
                        </button>
                    </div>

                    <div style={{ marginTop: '12px', borderTop: '1px solid rgba(0,0,0,0.1)', paddingTop: '12px' }}>
                        <p style={{ fontSize: 12, color: '#2D3436', margin: '0 0 8px', fontWeight: 700 }}>メッセージ確認</p>
                        <div style={{ display: 'flex', gap: 8 }}>
                            <button
                                onClick={() => {
                                    setActiveMilestoneModal('egg');
                                    setTab('home');
                                }}
                                style={{ padding: '6px 12px', fontSize: 12, borderRadius: 6, border: '1px solid #ccc', background: '#fff' }}
                            >
                                たまご
                            </button>
                            <button
                                onClick={() => {
                                    setActiveMilestoneModal('fairy');
                                    setTab('home');
                                }}
                                style={{ padding: '6px 12px', fontSize: 12, borderRadius: 6, border: '1px solid #ccc', background: '#fff' }}
                            >
                                かえった
                            </button>
                            <button
                                onClick={() => {
                                    setActiveMilestoneModal('adult');
                                    setTab('home');
                                }}
                                style={{ padding: '6px 12px', fontSize: 12, borderRadius: 6, border: '1px solid #ccc', background: '#fff' }}
                            >
                                そだった
                            </button>
                        </div>
                    </div>

                    {/* Badge (Chibifuwa) Preview */}
                    <div style={{ marginTop: '12px', borderTop: '1px solid rgba(0,0,0,0.1)', paddingTop: '12px' }}>
                        <p style={{ fontSize: 12, color: '#2D3436', margin: '0 0 8px', fontWeight: 700 }}>ちびふわバッジ</p>
                        {users[0] && (
                            <>
                                <div style={{ fontSize: 11, color: '#8395A7', marginBottom: 8 }}>
                                    所持: {users[0].chibifuwas?.length || 0}個
                                </div>
                                {(users[0].chibifuwas?.length || 0) > 0 && (
                                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                                        {users[0].chibifuwas.map(cb => (
                                            <div key={cb.id} style={{
                                                padding: '4px 8px',
                                                borderRadius: 8,
                                                background: '#F0FDFA',
                                                fontSize: 11,
                                                color: '#2D3436',
                                                border: '1px solid rgba(43,186,160,0.2)',
                                            }}>
                                                Type{cb.type} - {cb.challengeTitle}
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                    <span style={{ fontSize: 11, color: '#8395A7', lineHeight: '28px' }}>追加:</span>
                                    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(type => (
                                        <button
                                            key={type}
                                            onClick={() => {
                                                addChibifuwa(users[0].id, {
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
                                    onClick={() => {
                                        updateUser(users[0].id, { chibifuwas: [] });
                                    }}
                                    style={{ marginTop: 8, padding: '4px 12px', fontSize: 11, borderRadius: 6, border: '1px solid #E17055', background: '#fff', color: '#E17055', cursor: 'pointer' }}
                                >
                                    バッジ全削除
                                </button>
                            </>
                        )}
                    </div>

                    {/* Challenge state */}
                    <div style={{ marginTop: '12px', borderTop: '1px solid rgba(0,0,0,0.1)', paddingTop: '12px' }}>
                        <p style={{ fontSize: 12, color: '#2D3436', margin: '0 0 8px', fontWeight: 700 }}>チャレンジ</p>
                        <div style={{ fontSize: 11, color: '#8395A7', marginBottom: 8 }}>
                            参加中: {joinedChallengeIds.length}件
                            {joinedChallengeIds.length > 0 && (
                                <span style={{ marginLeft: 4 }}>
                                    ({joinedChallengeIds.map(id => id.slice(0, 6)).join(', ')})
                                </span>
                            )}
                        </div>
                        <button
                            onClick={() => {
                                useAppStore.setState({ joinedChallengeIds: [] });
                            }}
                            style={{ padding: '4px 12px', fontSize: 11, borderRadius: 6, border: '1px solid #E17055', background: '#fff', color: '#E17055', cursor: 'pointer' }}
                        >
                            チャレンジ参加リセット
                        </button>
                    </div>
                </div>
            )}
        </>
    );
};
