import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, Trash2, Volume2, Mic, Bell, Clock } from 'lucide-react';
import { clearAllData } from '../lib/db';
import { useAppStore } from '../store/useAppStore';
import { audio } from '../lib/audio';
import type { ClassLevel } from '../data/exercises';

const CLASS_LEVELS: { id: ClassLevel; label: string; emoji: string }[] = [
    { id: 'プレ', label: 'プレバレエ', emoji: '🐣' },
    { id: '初級', label: '初級', emoji: '🌱' },
    { id: '中級', label: '中級', emoji: '🌸' },
    { id: '上級', label: '上級', emoji: '⭐' },
];

export const SettingsPage: React.FC = () => {
    const classLevel = useAppStore(s => s.classLevel);
    const setClassLevel = useAppStore(s => s.setClassLevel);

    // Settings state
    const soundVolume = useAppStore(s => s.soundVolume);
    const setSoundVolume = useAppStore(s => s.setSoundVolume);
    const ttsEnabled = useAppStore(s => s.ttsEnabled);
    const setTtsEnabled = useAppStore(s => s.setTtsEnabled);
    const notificationsEnabled = useAppStore(s => s.notificationsEnabled);
    const setNotificationsEnabled = useAppStore(s => s.setNotificationsEnabled);
    const notificationTime = useAppStore(s => s.notificationTime);
    const setNotificationTime = useAppStore(s => s.setNotificationTime);

    const [showClassPicker, setShowClassPicker] = useState(false);
    const [showConfirmReset, setShowConfirmReset] = useState(false);

    const handleClassChange = (level: ClassLevel) => {
        setClassLevel(level);
        setShowClassPicker(false);
    };

    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseFloat(e.target.value);
        setSoundVolume(val);
        // Play tick to preview volume
        audio.playTick();
    };

    const requestNotificationPermission = async (enable: boolean) => {
        if (!enable) {
            setNotificationsEnabled(false);
            return;
        }

        if (!('Notification' in window)) {
            alert('お使いのブラウザは通知に対応していません。');
            return;
        }

        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
            setNotificationsEnabled(true);
        } else {
            alert('通知が許可されていません。ブラウザの設定をご確認ください。');
            setNotificationsEnabled(false);
        }
    };

    const handleReset = async () => {
        await clearAllData();
        setShowConfirmReset(false);
        window.location.reload();
    };

    const currentClass = CLASS_LEVELS.find(c => c.id === classLevel);

    return (
        <div style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            padding: '20px 20px 100px 20px',
            gap: 16,
            overflowY: 'auto',
        }}>
            <h1 style={{
                fontFamily: "'Outfit', sans-serif",
                fontSize: 24,
                fontWeight: 700,
                color: '#2D3436',
            }}>
                せってい
            </h1>

            {/* Class level setting */}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <button
                    onClick={() => setShowClassPicker(!showClassPicker)}
                    style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        padding: '16px 20px',
                        border: 'none',
                        background: 'none',
                        cursor: 'pointer',
                        textAlign: 'left',
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
                        fontSize: 20,
                        flexShrink: 0,
                    }}>
                        {currentClass?.emoji || '🌱'}
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{
                            fontFamily: "'Noto Sans JP', sans-serif",
                            fontSize: 14,
                            fontWeight: 700,
                            color: '#2D3436',
                        }}>クラス</div>
                        <div style={{
                            fontFamily: "'Noto Sans JP', sans-serif",
                            fontSize: 12,
                            color: '#8395A7',
                        }}>{currentClass?.label || '初級'}</div>
                    </div>
                    <ChevronRight size={18} color="#B2BEC3" style={{
                        transform: showClassPicker ? 'rotate(90deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s ease',
                    }} />
                </button>

                {showClassPicker && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        style={{ overflow: 'hidden', borderTop: '1px solid rgba(0,0,0,0.06)' }}
                    >
                        {CLASS_LEVELS.map(({ id, label, emoji }) => (
                            <button
                                key={id}
                                onClick={() => handleClassChange(id)}
                                style={{
                                    width: '100%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 10,
                                    padding: '12px 24px',
                                    border: 'none',
                                    background: classLevel === id ? 'rgba(43,186,160,0.08)' : 'none',
                                    cursor: 'pointer',
                                    fontFamily: "'Noto Sans JP', sans-serif",
                                    fontSize: 14,
                                    color: classLevel === id ? '#2BBAA0' : '#2D3436',
                                    fontWeight: classLevel === id ? 700 : 400,
                                }}
                            >
                                <span>{emoji}</span>
                                <span>{label}</span>
                                {classLevel === id && <span style={{ marginLeft: 'auto' }}>✓</span>}
                            </button>
                        ))}
                    </motion.div>
                )}
            </div>

            {/* Audio Settings */}
            <div className="card" style={{ padding: '0', display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                        <div style={{
                            width: 32,
                            height: 32,
                            borderRadius: 10,
                            background: 'rgba(43, 186, 160, 0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}>
                            <Volume2 size={16} color="#2BBAA0" />
                        </div>
                        <div style={{
                            fontFamily: "'Noto Sans JP', sans-serif",
                            fontSize: 14,
                            fontWeight: 700,
                            color: '#2D3436',
                        }}>音量</div>
                    </div>
                    <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={soundVolume}
                        onChange={handleVolumeChange}
                        style={{
                            width: '100%',
                            accentColor: '#2BBAA0',
                        }}
                    />
                </div>

                <div style={{
                    padding: '16px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{
                            width: 32,
                            height: 32,
                            borderRadius: 10,
                            background: 'rgba(225, 112, 85, 0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}>
                            <Mic size={16} color="#E17055" />
                        </div>
                        <div>
                            <div style={{
                                fontFamily: "'Noto Sans JP', sans-serif",
                                fontSize: 14,
                                fontWeight: 700,
                                color: '#2D3436',
                            }}>音声ガイダンス</div>
                            <div style={{
                                fontFamily: "'Noto Sans JP', sans-serif",
                                fontSize: 11,
                                color: '#8395A7',
                                marginTop: 2,
                            }}>残り時間などを声でお知らせ</div>
                        </div>
                    </div>
                    <button
                        onClick={() => {
                            const next = !ttsEnabled;
                            setTtsEnabled(next);
                            if (next) {
                                audio.initTTS();
                                audio.speak('音声ガイダンスをオンにしました');
                            }
                        }}
                        style={{
                            width: 44,
                            height: 24,
                            borderRadius: 12,
                            background: ttsEnabled ? '#2BBAA0' : '#DFE6E9',
                            border: 'none',
                            position: 'relative',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            padding: 2,
                            transition: 'background 0.3s ease',
                        }}
                    >
                        <motion.div
                            animate={{ x: ttsEnabled ? 20 : 0 }}
                            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                            style={{
                                width: 20,
                                height: 20,
                                borderRadius: '50%',
                                background: 'white',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                            }}
                        />
                    </button>
                </div>
            </div>

            {/* Notifications Settings */}
            <div className="card" style={{ padding: '0', display: 'flex', flexDirection: 'column' }}>
                <div style={{
                    padding: '16px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderBottom: notificationsEnabled ? '1px solid rgba(0,0,0,0.06)' : 'none',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{
                            width: 32,
                            height: 32,
                            borderRadius: 10,
                            background: 'rgba(9, 132, 227, 0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}>
                            <Bell size={16} color="#0984e3" />
                        </div>
                        <div>
                            <div style={{
                                fontFamily: "'Noto Sans JP', sans-serif",
                                fontSize: 14,
                                fontWeight: 700,
                                color: '#2D3436',
                            }}>まいにち通知</div>
                            <div style={{
                                fontFamily: "'Noto Sans JP', sans-serif",
                                fontSize: 11,
                                color: '#8395A7',
                                marginTop: 2,
                            }}>忘れないようにリマインド</div>
                        </div>
                    </div>
                    <button
                        onClick={() => requestNotificationPermission(!notificationsEnabled)}
                        style={{
                            width: 44,
                            height: 24,
                            borderRadius: 12,
                            background: notificationsEnabled ? '#0984e3' : '#DFE6E9',
                            border: 'none',
                            position: 'relative',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            padding: 2,
                            transition: 'background 0.3s ease',
                        }}
                    >
                        <motion.div
                            animate={{ x: notificationsEnabled ? 20 : 0 }}
                            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                            style={{
                                width: 20,
                                height: 20,
                                borderRadius: '50%',
                                background: 'white',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                            }}
                        />
                    </button>
                </div>

                {notificationsEnabled && (
                    <div style={{
                        padding: '16px 20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ width: 32, display: 'flex', justifyContent: 'center' }}>
                                <Clock size={16} color="#B2BEC3" />
                            </div>
                            <div style={{
                                fontFamily: "'Noto Sans JP', sans-serif",
                                fontSize: 14,
                                fontWeight: 700,
                                color: '#2D3436',
                            }}>お知らせ時間</div>
                        </div>
                        <input
                            type="time"
                            value={notificationTime}
                            onChange={(e) => setNotificationTime(e.target.value)}
                            style={{
                                border: '1px solid rgba(0,0,0,0.1)',
                                borderRadius: 8,
                                padding: '6px 12px',
                                fontFamily: "'Outfit', sans-serif",
                                fontSize: 16,
                                fontWeight: 600,
                                color: '#2D3436',
                                background: '#F8F9FA',
                                outline: 'none',
                            }}
                        />
                    </div>
                )}
            </div>

            {/* App info */}
            <div className="card card-sm" style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
            }}>
                <div style={{
                    fontFamily: "'Noto Sans JP', sans-serif",
                    fontSize: 14,
                    fontWeight: 700,
                    color: '#2D3436',
                }}>
                    アプリ情報
                </div>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontFamily: "'Noto Sans JP', sans-serif",
                    fontSize: 13,
                }}>
                    <span style={{ color: '#8395A7' }}>バージョン</span>
                    <span style={{ color: '#2D3436', fontFamily: "'Outfit', sans-serif", fontWeight: 600 }}>0.1.0</span>
                </div>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontFamily: "'Noto Sans JP', sans-serif",
                    fontSize: 13,
                }}>
                    <span style={{ color: '#8395A7' }}>KeepGoing</span>
                    <span style={{ color: '#B2BEC3', fontSize: 11 }}>考えなくていい。ただ、つづけるだけ。</span>
                </div>
            </div>

            {/* Reset */}
            <div className="card card-sm" style={{ padding: 0 }}>
                <button
                    onClick={() => setShowConfirmReset(true)}
                    style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '14px 20px',
                        border: 'none',
                        background: 'none',
                        cursor: 'pointer',
                        fontFamily: "'Noto Sans JP', sans-serif",
                        fontSize: 14,
                        color: '#E17055',
                    }}
                >
                    <Trash2 size={16} />
                    <span>データをリセット</span>
                </button>
            </div>

            {/* Confirm dialog */}
            {showConfirmReset && (
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
                            maxWidth: 320,
                            width: '100%',
                        }}
                    >
                        <h3 style={{
                            fontFamily: "'Noto Sans JP', sans-serif",
                            fontSize: 18,
                            fontWeight: 700,
                            color: '#2D3436',
                            marginBottom: 8,
                        }}>
                            本当にリセットしますか？
                        </h3>
                        <p style={{
                            fontFamily: "'Noto Sans JP', sans-serif",
                            fontSize: 13,
                            color: '#8395A7',
                            marginBottom: 24,
                            lineHeight: 1.5,
                        }}>
                            すべての記録とプロフィールが<br />削除されます。
                        </p>
                        <div style={{ display: 'flex', gap: 10 }}>
                            <button
                                onClick={() => setShowConfirmReset(false)}
                                style={{
                                    flex: 1,
                                    padding: '12px 0',
                                    borderRadius: 12,
                                    border: '1px solid rgba(0,0,0,0.1)',
                                    background: 'white',
                                    cursor: 'pointer',
                                    fontFamily: "'Noto Sans JP', sans-serif",
                                    fontSize: 14,
                                    fontWeight: 500,
                                    color: '#8395A7',
                                }}
                            >
                                やめる
                            </button>
                            <button
                                onClick={handleReset}
                                style={{
                                    flex: 1,
                                    padding: '12px 0',
                                    borderRadius: 12,
                                    border: 'none',
                                    background: '#E17055',
                                    cursor: 'pointer',
                                    fontFamily: "'Noto Sans JP', sans-serif",
                                    fontSize: 14,
                                    fontWeight: 700,
                                    color: 'white',
                                }}
                            >
                                リセット
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
};
