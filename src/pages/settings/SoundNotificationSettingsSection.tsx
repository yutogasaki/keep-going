import React from 'react';
import { Bell, Clock, Mic, Music, Smartphone, Volume2 } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { audio } from '../../lib/audio';
import { ToggleButton } from './ToggleButton';

export const SoundNotificationSettingsSection: React.FC = () => {
    const soundVolume = useAppStore(s => s.soundVolume);
    const setSoundVolume = useAppStore(s => s.setSoundVolume);
    const ttsEnabled = useAppStore(s => s.ttsEnabled);
    const setTtsEnabled = useAppStore(s => s.setTtsEnabled);
    const bgmEnabled = useAppStore(s => s.bgmEnabled);
    const setBgmEnabled = useAppStore(s => s.setBgmEnabled);
    const hapticEnabled = useAppStore(s => s.hapticEnabled);
    const setHapticEnabled = useAppStore(s => s.setHapticEnabled);
    const notificationsEnabled = useAppStore(s => s.notificationsEnabled);
    const setNotificationsEnabled = useAppStore(s => s.setNotificationsEnabled);
    const notificationTime = useAppStore(s => s.notificationTime);
    const setNotificationTime = useAppStore(s => s.setNotificationTime);

    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseFloat(e.target.value);
        setSoundVolume(val);
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

    return (
        <>
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
                    justifyContent: 'space-between',
                    borderBottom: '1px solid rgba(0,0,0,0.06)',
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
                    <ToggleButton
                        enabled={ttsEnabled}
                        onToggle={() => {
                            const next = !ttsEnabled;
                            setTtsEnabled(next);
                            if (next) {
                                audio.initTTS();
                                audio.speak('音声ガイダンスをオンにしました');
                            }
                        }}
                        color="#2BBAA0"
                    />
                </div>

                <div style={{
                    padding: '16px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{
                            width: 32,
                            height: 32,
                            borderRadius: 10,
                            background: 'rgba(108, 92, 231, 0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}>
                            <Music size={16} color="#6C5CE7" />
                        </div>
                        <div>
                            <div style={{
                                fontFamily: "'Noto Sans JP', sans-serif",
                                fontSize: 14,
                                fontWeight: 700,
                                color: '#2D3436',
                            }}>BGM</div>
                            <div style={{
                                fontFamily: "'Noto Sans JP', sans-serif",
                                fontSize: 11,
                                color: '#8395A7',
                                marginTop: 2,
                            }}>ストレッチ中のBGM</div>
                        </div>
                    </div>
                    <ToggleButton
                        enabled={bgmEnabled}
                        onToggle={() => setBgmEnabled(!bgmEnabled)}
                        color="#6C5CE7"
                    />
                </div>
            </div>

            <div className="card" style={{ padding: '0', display: 'flex', flexDirection: 'column' }}>
                <div style={{
                    padding: '16px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{
                            width: 32,
                            height: 32,
                            borderRadius: 10,
                            background: 'rgba(253, 203, 110, 0.15)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}>
                            <Smartphone size={16} color="#E17055" />
                        </div>
                        <div>
                            <div style={{
                                fontFamily: "'Noto Sans JP', sans-serif",
                                fontSize: 14,
                                fontWeight: 700,
                                color: '#2D3436',
                            }}>振動フィードバック</div>
                            <div style={{
                                fontFamily: "'Noto Sans JP', sans-serif",
                                fontSize: 11,
                                color: '#8395A7',
                                marginTop: 2,
                            }}>対応デバイスのみ</div>
                        </div>
                    </div>
                    <ToggleButton
                        enabled={hapticEnabled}
                        onToggle={() => setHapticEnabled(!hapticEnabled)}
                        color="#FDCB6E"
                    />
                </div>
            </div>

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
                    <ToggleButton
                        enabled={notificationsEnabled}
                        onToggle={() => requestNotificationPermission(!notificationsEnabled)}
                        color="#0984e3"
                    />
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
        </>
    );
};
