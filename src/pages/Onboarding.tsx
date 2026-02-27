import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Chrome, Mail, Loader2 } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { getTodayKey } from '../lib/db';
import { useAuth } from '../contexts/AuthContext';
import { hasCloudData, pullAllData, initialSync } from '../lib/sync';
import { LoginPage } from './LoginPage';
import { CLASS_LEVELS, type ClassLevel } from '../data/exercises';

type OnboardingStep = 'welcome' | 'account' | 'emailLogin' | 'restoring' | 'name' | 'class' | 'swipe';

export const Onboarding: React.FC = () => {
    const setOnboardingCompleted = useAppStore((state) => state.setOnboardingCompleted);
    const addUser = useAppStore((state) => state.addUser);
    const setSessionUserIds = useAppStore((state) => state.setSessionUserIds);
    const [step, setStep] = useState<OnboardingStep>('welcome');
    const [userName, setUserName] = useState('');
    const [selectedClass, setSelectedClass] = useState<ClassLevel | null>(null);
    const [restoreError, setRestoreError] = useState<string | null>(null);

    const { user, signInWithGoogle, loginContext, setLoginContext } = useAuth();

    // Handle post-login: OAuth redirect return OR async email auth state change
    // step !== 'restoring' prevents double-fire (handlePostLogin sets step='restoring')
    // Skip for anonymous users (auto-logged-in, no cloud restore needed)
    useEffect(() => {
        if (user && !user.is_anonymous && loginContext === 'onboarding' && step !== 'restoring') {
            handlePostLogin(user.id);
        }
    }, [user, loginContext, step]);

    const handlePostLogin = async (accountId: string) => {
        setStep('restoring');
        setRestoreError(null);
        try {
            const cloudExists = await hasCloudData(accountId);
            if (cloudExists) {
                const result = await pullAllData(accountId);
                if (result.success && result.hadData) {
                    // onboardingCompleted is now true from cloud data.
                    // App.tsx gate will automatically switch to MainLayout.
                    setLoginContext(null);
                    return;
                }
            }
            // No cloud data or empty → continue onboarding
            setLoginContext(null);
            setStep('name');
        } catch (err) {
            console.error('[onboarding] Post-login restore failed:', err);
            setRestoreError('復元に失敗しました。もう一度お試しください。');
            setLoginContext(null);
            setStep('account');
        }
    };

    const handleGoogleLogin = async () => {
        setLoginContext('onboarding');
        const { error } = await signInWithGoogle();
        if (error) {
            setLoginContext(null);
            setRestoreError('Googleログインに失敗しました。もう一度お試しください。');
            console.warn('[onboarding] Google login error:', error.message);
        }
        // Google OAuth triggers a redirect. On return, the useEffect above handles it.
    };

    const handleEmailLoginSuccess = () => {
        // Email login succeeded (no redirect). User is now logged in.
        // Guard against double-fire: only proceed if not already restoring
        if (user && step !== 'restoring') {
            handlePostLogin(user.id);
        }
        // If user isn't set yet, the useEffect will pick it up
    };

    const handleClassSelect = (level: ClassLevel) => {
        setSelectedClass(level);
    };

    const handleFinish = async () => {
        addUser({
            name: userName.trim() || 'ゲスト',
            classLevel: selectedClass || '初級',
            fuwafuwaBirthDate: getTodayKey(),
            fuwafuwaType: Math.floor(Math.random() * 10),
            fuwafuwaCycleCount: 1,
            fuwafuwaName: null,
            pastFuwafuwas: [],
            notifiedFuwafuwaStages: []
        });

        // Ensure the newly added user becomes active
        const state = useAppStore.getState();
        const latestUser = state.users[state.users.length - 1];
        if (latestUser) {
            setSessionUserIds([latestUser.id]);
        }

        setOnboardingCompleted(true);

        // If logged in, push the new data to cloud
        if (user) {
            const freshState = useAppStore.getState();
            initialSync(freshState.users, {
                onboardingCompleted: freshState.onboardingCompleted,
                soundVolume: freshState.soundVolume,
                ttsEnabled: freshState.ttsEnabled,
                bgmEnabled: freshState.bgmEnabled,
                hapticEnabled: freshState.hapticEnabled,
                notificationsEnabled: freshState.notificationsEnabled,
                notificationTime: freshState.notificationTime,
            }).catch(console.warn);
        }
    };

    // If showing the email login page
    if (step === 'emailLogin') {
        return (
            <div style={{
                position: 'fixed',
                inset: 0,
                zIndex: 100,
                background: 'linear-gradient(165deg, #FFF5F0 0%, #E8F8F0 100%)',
                overflow: 'auto',
            }}>
                <LoginPage
                    onBack={() => setStep('account')}
                    onLoginSuccess={handleEmailLoginSuccess}
                />
            </div>
        );
    }

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            background: 'linear-gradient(165deg, #FFF5F0 0%, #E8F8F0 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
        }}>
            <AnimatePresence mode="wait">
                {/* Step 1: Welcome */}
                {step === 'welcome' && (
                    <motion.div
                        key="welcome"
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -30 }}
                        transition={{ duration: 0.5 }}
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: 24,
                            padding: '0 32px',
                            maxWidth: 360,
                            textAlign: 'center',
                        }}
                    >
                        <motion.div
                            animate={{ rotate: [0, -5, 5, -3, 0] }}
                            transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 1 }}
                        >
                            <img
                                src="/icon.png"
                                alt="KeepGoing"
                                style={{
                                    width: 120,
                                    height: 120,
                                    borderRadius: 40,
                                    objectFit: 'cover',
                                }}
                            />
                        </motion.div>

                        <h1 style={{
                            fontFamily: "'Outfit', sans-serif",
                            fontSize: 32,
                            fontWeight: 800,
                            color: '#2D3436',
                        }}>
                            KeepGoing
                        </h1>
                        <p style={{
                            fontFamily: "'Noto Sans JP', sans-serif",
                            fontSize: 15,
                            color: '#8395A7',
                            lineHeight: 1.8,
                        }}>
                            今日のちょっとが、未来のちからに。
                        </p>

                        <button
                            onClick={() => setStep('account')}
                            style={{
                                marginTop: 16,
                                padding: '14px 48px',
                                borderRadius: 9999,
                                border: 'none',
                                background: '#2BBAA0',
                                color: 'white',
                                fontFamily: "'Noto Sans JP', sans-serif",
                                fontSize: 16,
                                fontWeight: 700,
                                cursor: 'pointer',
                                boxShadow: '0 4px 16px rgba(43, 186, 160, 0.35)',
                            }}
                        >
                            はじめる
                        </button>
                    </motion.div>
                )}

                {/* Step 2: Account (login or skip) */}
                {step === 'account' && (
                    <motion.div
                        key="account"
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -30 }}
                        transition={{ duration: 0.5 }}
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: 16,
                            padding: '0 32px',
                            maxWidth: 360,
                            width: '100%',
                            textAlign: 'center',
                        }}
                    >
                        <h2 style={{
                            fontFamily: "'Noto Sans JP', sans-serif",
                            fontSize: 22,
                            fontWeight: 700,
                            color: '#2D3436',
                        }}>
                            アカウント
                        </h2>
                        <p style={{
                            fontFamily: "'Noto Sans JP', sans-serif",
                            fontSize: 13,
                            color: '#8395A7',
                            lineHeight: 1.6,
                            marginTop: -4,
                        }}>
                            ログインするとデータが<br />クラウドに保存されます
                        </p>

                        {restoreError && (
                            <p style={{
                                fontSize: 13,
                                color: '#E74C3C',
                                margin: 0,
                            }}>
                                {restoreError}
                            </p>
                        )}

                        {/* Google login */}
                        <button
                            onClick={handleGoogleLogin}
                            style={{
                                width: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 8,
                                padding: '14px 16px',
                                borderRadius: 14,
                                border: '1px solid rgba(0,0,0,0.1)',
                                background: 'white',
                                fontSize: 15,
                                fontWeight: 600,
                                fontFamily: "'Noto Sans JP', sans-serif",
                                cursor: 'pointer',
                                color: '#333',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                            }}
                        >
                            <Chrome size={18} />
                            Google でログイン
                        </button>

                        {/* Email login */}
                        <button
                            onClick={() => {
                                setLoginContext('onboarding');
                                setStep('emailLogin');
                            }}
                            style={{
                                width: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 8,
                                padding: '14px 16px',
                                borderRadius: 14,
                                border: '1px solid rgba(0,0,0,0.1)',
                                background: 'white',
                                fontSize: 15,
                                fontWeight: 600,
                                fontFamily: "'Noto Sans JP', sans-serif",
                                cursor: 'pointer',
                                color: '#333',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                            }}
                        >
                            <Mail size={18} />
                            メールでログイン
                        </button>

                        {/* Divider */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                            width: '100%',
                            color: '#CCC',
                            fontSize: 12,
                            margin: '4px 0',
                        }}>
                            <div style={{ flex: 1, height: 1, background: '#DDD' }} />
                            <span style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>または</span>
                            <div style={{ flex: 1, height: 1, background: '#DDD' }} />
                        </div>

                        {/* Skip */}
                        <button
                            onClick={() => setStep('name')}
                            style={{
                                width: '100%',
                                padding: '14px 16px',
                                borderRadius: 14,
                                border: 'none',
                                background: 'rgba(0,0,0,0.04)',
                                fontSize: 15,
                                fontWeight: 600,
                                fontFamily: "'Noto Sans JP', sans-serif",
                                cursor: 'pointer',
                                color: '#8395A7',
                            }}
                        >
                            ログインせずに始める
                        </button>
                        <p style={{
                            fontFamily: "'Noto Sans JP', sans-serif",
                            fontSize: 11,
                            color: '#B2BEC3',
                            marginTop: -8,
                        }}>
                            あとから設定で追加できます
                        </p>
                    </motion.div>
                )}

                {/* Restoring: Loading spinner while pulling data */}
                {step === 'restoring' && (
                    <motion.div
                        key="restoring"
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -30 }}
                        transition={{ duration: 0.5 }}
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: 20,
                            padding: '0 32px',
                            maxWidth: 360,
                            textAlign: 'center',
                        }}
                    >
                        <Loader2
                            size={40}
                            color="#2BBAA0"
                            style={{ animation: 'spin 1s linear infinite' }}
                        />
                        <p style={{
                            fontFamily: "'Noto Sans JP', sans-serif",
                            fontSize: 16,
                            fontWeight: 600,
                            color: '#2D3436',
                        }}>
                            データを復元しています...
                        </p>
                    </motion.div>
                )}

                {/* Step 3: Name Input */}
                {step === 'name' && (
                    <motion.div
                        key="name"
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -30 }}
                        transition={{ duration: 0.5 }}
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: 24,
                            padding: '0 24px',
                            maxWidth: 360,
                            textAlign: 'center',
                            width: '100%',
                        }}
                    >
                        <h2 style={{
                            fontFamily: "'Noto Sans JP', sans-serif",
                            fontSize: 22,
                            fontWeight: 700,
                            color: '#2D3436',
                        }}>
                            おなまえを おしえてね
                        </h2>

                        <input
                            type="text"
                            value={userName}
                            onChange={(e) => setUserName(e.target.value)}
                            placeholder="ゲスト"
                            autoFocus
                            style={{
                                width: '100%',
                                padding: '16px 20px',
                                borderRadius: 16,
                                border: '2px solid rgba(43, 186, 160, 0.3)',
                                fontSize: 18,
                                fontFamily: "'Noto Sans JP', sans-serif",
                                fontWeight: 600,
                                textAlign: 'center',
                                outline: 'none',
                                transition: 'border-color 0.2s',
                            }}
                            onFocus={(e) => e.target.style.borderColor = '#2BBAA0'}
                            onBlur={(e) => e.target.style.borderColor = 'rgba(43, 186, 160, 0.3)'}
                        />

                        <button
                            onClick={() => setStep('class')}
                            disabled={!userName.trim()}
                            style={{
                                marginTop: 16,
                                padding: '14px 48px',
                                borderRadius: 9999,
                                border: 'none',
                                background: userName.trim() ? '#2BBAA0' : '#B2BEC3',
                                color: 'white',
                                fontFamily: "'Noto Sans JP', sans-serif",
                                fontSize: 16,
                                fontWeight: 700,
                                cursor: userName.trim() ? 'pointer' : 'not-allowed',
                                boxShadow: userName.trim() ? '0 4px 16px rgba(43, 186, 160, 0.35)' : 'none',
                                transition: 'all 0.3s ease',
                            }}
                        >
                            つぎへ
                        </button>
                    </motion.div>
                )}

                {/* Step 4: Class selection */}
                {step === 'class' && (
                    <motion.div
                        key="class"
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -30 }}
                        transition={{ duration: 0.5 }}
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: 24,
                            padding: '0 24px',
                            maxWidth: 400,
                            width: '100%',
                            textAlign: 'center',
                        }}
                    >
                        <h2 style={{
                            fontFamily: "'Noto Sans JP', sans-serif",
                            fontSize: 22,
                            fontWeight: 700,
                            color: '#2D3436',
                        }}>
                            クラスをえらんでね
                        </h2>
                        <p style={{
                            fontFamily: "'Noto Sans JP', sans-serif",
                            fontSize: 13,
                            color: '#8395A7',
                            marginTop: -12,
                        }}>
                            あとからでも変えられるよ
                        </p>

                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 10,
                            width: '100%',
                        }}>
                            {CLASS_LEVELS.map(({ id, label, emoji, desc }) => (
                                <motion.button
                                    key={id}
                                    onClick={() => handleClassSelect(id)}
                                    whileTap={{ scale: 0.97 }}
                                    className="card card-sm"
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 14,
                                        padding: '16px 20px',
                                        border: selectedClass === id ? '2px solid #2BBAA0' : '2px solid transparent',
                                        cursor: 'pointer',
                                        textAlign: 'left',
                                        transition: 'border 0.2s ease',
                                    }}
                                >
                                    <span style={{ fontSize: 28 }}>{emoji}</span>
                                    <div>
                                        <div style={{
                                            fontFamily: "'Noto Sans JP', sans-serif",
                                            fontSize: 16,
                                            fontWeight: 700,
                                            color: selectedClass === id ? '#2BBAA0' : '#2D3436',
                                        }}>{label}</div>
                                        <div style={{
                                            fontFamily: "'Noto Sans JP', sans-serif",
                                            fontSize: 12,
                                            color: '#8395A7',
                                        }}>{desc}</div>
                                    </div>
                                    {selectedClass === id && (
                                        <span style={{
                                            marginLeft: 'auto',
                                            color: '#2BBAA0',
                                            fontWeight: 700,
                                            fontSize: 18,
                                        }}>✓</span>
                                    )}
                                </motion.button>
                            ))}
                        </div>

                        <button
                            onClick={() => setStep('swipe')}
                            disabled={!selectedClass}
                            style={{
                                marginTop: 8,
                                padding: '14px 48px',
                                borderRadius: 9999,
                                border: 'none',
                                background: selectedClass ? '#2BBAA0' : '#B2BEC3',
                                color: 'white',
                                fontFamily: "'Noto Sans JP', sans-serif",
                                fontSize: 16,
                                fontWeight: 700,
                                cursor: selectedClass ? 'pointer' : 'not-allowed',
                                boxShadow: selectedClass ? '0 4px 16px rgba(43, 186, 160, 0.35)' : 'none',
                                transition: 'all 0.3s ease',
                            }}
                        >
                            つぎへ
                        </button>
                    </motion.div>
                )}

                {/* Step 5: Tutorial & Start */}
                {step === 'swipe' && (
                    <motion.div
                        key="swipe"
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -30 }}
                        transition={{ duration: 0.5 }}
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: 24,
                            padding: '0 32px',
                            maxWidth: 360,
                            textAlign: 'center',
                            width: '100%',
                        }}
                    >
                        <h2 style={{
                            fontFamily: "'Noto Sans JP', sans-serif",
                            fontSize: 22,
                            fontWeight: 700,
                            color: '#2D3436',
                        }}>
                            つかいかた
                        </h2>

                        {/* Instructions area */}
                        <div
                            style={{
                                width: '100%',
                                height: 200,
                                borderRadius: 24,
                                background: 'rgba(255,255,255,0.7)',
                                backdropFilter: 'blur(12px)',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 12,
                                border: '2px dashed rgba(43, 186, 160, 0.3)',
                            }}
                        >
                            <div style={{ textAlign: 'center' }}>
                                <span style={{ fontSize: 48 }}>🎉</span>
                                <p style={{
                                    fontFamily: "'Noto Sans JP', sans-serif",
                                    fontSize: 16,
                                    fontWeight: 700,
                                    color: '#2BBAA0',
                                    marginTop: 8,
                                }}>
                                    準備完了！
                                </p>
                            </div>
                        </div>

                        <div style={{
                            fontFamily: "'Noto Sans JP', sans-serif",
                            fontSize: 16,
                            fontWeight: 700,
                            color: '#8395A7',
                            lineHeight: 1.8,
                            textAlign: 'center',
                            marginTop: 32,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: 16
                        }}>
                            <p>準備ができたら<br />このボタンを押してスタート！</p>

                            {/* Bouncing Arrow */}
                            <motion.div
                                animate={{ y: [0, 10, 0] }}
                                transition={{ duration: 1, repeat: Infinity }}
                                style={{ color: '#2BBAA0' }}
                            >
                                ↓
                            </motion.div>

                            {/* Simulated FAB Button to close onboarding */}
                            <button
                                onClick={handleFinish}
                                style={{
                                    width: 72,
                                    height: 72,
                                    borderRadius: '50%',
                                    background: 'linear-gradient(135deg, #2BBAA0 0%, #1A937D 100%)',
                                    border: 'none',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    boxShadow: '0 8px 32px rgba(43, 186, 160, 0.4), inset 0 2px 0 rgba(255,255,255,0.3)',
                                    transform: 'scale(1)',
                                    transition: 'transform 0.2s',
                                }}
                                onPointerDown={(e) => (e.currentTarget.style.transform = 'scale(0.95)')}
                                onPointerUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                                onPointerLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                            >
                                <div style={{
                                    width: 0,
                                    height: 0,
                                    borderTop: '12px solid transparent',
                                    borderBottom: '12px solid transparent',
                                    borderLeft: '18px solid white',
                                    marginLeft: 6,
                                }} />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
