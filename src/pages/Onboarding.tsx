import React, { useCallback, useEffect, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useAppStore } from '../store/useAppStore';
import { getTodayKey } from '../lib/db';
import { useAuth } from '../contexts/AuthContext';
import { initialSync } from '../lib/sync/initial';
import { runPostLoginSync } from '../contexts/auth/syncFlows';
import { LoginPage } from './LoginPage';
import { type ClassLevel } from '../data/exercises';
import type { EmailAuthMode } from '../contexts/auth/types';
import { AccountStep } from './onboarding/AccountStep';
import { ClassStep } from './onboarding/ClassStep';
import { NameStep } from './onboarding/NameStep';
import { RestoringStep } from './onboarding/RestoringStep';
import { StartStep } from './onboarding/StartStep';
import { WelcomeStep } from './onboarding/WelcomeStep';
import { NotificationStep } from './onboarding/NotificationStep';
import type { OnboardingStep } from './onboarding/types';
import { getLoginSyncFailureMessage } from '../contexts/auth/syncFlowMessages';

export const Onboarding: React.FC = () => {
    const setOnboardingCompleted = useAppStore((state) => state.setOnboardingCompleted);
    const addUser = useAppStore((state) => state.addUser);
    const setSessionUserIds = useAppStore((state) => state.setSessionUserIds);

    const [step, setStep] = useState<OnboardingStep>('welcome');
    const [userName, setUserName] = useState('');
    const [selectedClass, setSelectedClass] = useState<ClassLevel | null>(null);
    const [restoreError, setRestoreError] = useState<string | null>(null);
    const [authMode, setAuthMode] = useState<EmailAuthMode>('signUp');

    const {
        user,
        loginContext,
        requestSyncConflictResolution,
        setLoginContext,
    } = useAuth();

    const handlePostLogin = useCallback(async (accountId: string) => {
        setStep('restoring');
        setRestoreError(null);

        try {
            const result = await runPostLoginSync({
                accountId,
                resolveConflict: requestSyncConflictResolution,
            });

            if (!result.success) {
                setRestoreError(`${getLoginSyncFailureMessage(result)} もう一度お試しください。`);
                setLoginContext(null);
                setStep('account');
                return;
            }

            const restoredState = useAppStore.getState();
            if (restoredState.onboardingCompleted && restoredState.users.length > 0) {
                setLoginContext(null);
                return;
            }

            setLoginContext(null);
            setStep('name');
        } catch (error) {
            console.error('[onboarding] Post-login restore failed:', error);
            setRestoreError('復元に失敗しました。もう一度お試しください。');
            setLoginContext(null);
            setStep('account');
        }
    }, [requestSyncConflictResolution, setLoginContext]);

    useEffect(() => {
        if (user && !user.is_anonymous && loginContext === 'onboarding' && step !== 'restoring') {
            void handlePostLogin(user.id);
        }
    }, [user, loginContext, step, handlePostLogin]);

    const handleFinish = async () => {
        addUser({
            name: userName.trim() || 'ゲスト',
            classLevel: selectedClass || '初級',
            fuwafuwaBirthDate: getTodayKey(),
            fuwafuwaType: Math.floor(Math.random() * 10),
            fuwafuwaCycleCount: 1,
            fuwafuwaName: null,
            pastFuwafuwas: [],
            notifiedFuwafuwaStages: [],
        });

        const state = useAppStore.getState();
        const latestUser = state.users[state.users.length - 1];
        if (latestUser) {
            setSessionUserIds([latestUser.id]);
        }

        setOnboardingCompleted(true);

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

    if (step === 'auth') {
        return (
            <div
                style={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: 100,
                    background: 'linear-gradient(165deg, #FFF5F0 0%, #E8F8F0 100%)',
                    overflow: 'auto',
                }}
            >
                <LoginPage
                    onBack={() => {
                        setLoginContext(null);
                        setStep('account');
                    }}
                    initialMode={authMode}
                />
            </div>
        );
    }

    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 100,
                background: 'linear-gradient(165deg, #FFF5F0 0%, #E8F8F0 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'auto',
            }}
        >
                <AnimatePresence mode="wait">
                    {step === 'welcome' && (
                        <WelcomeStep onNext={() => setStep('account')} />
                    )}

                    {step === 'restoring' && <RestoringStep />}

                    {step === 'account' && (
                        <AccountStep
                            restoreError={restoreError}
                            onLogin={() => {
                                setRestoreError(null);
                                setAuthMode('signIn');
                                setLoginContext('onboarding');
                                setStep('auth');
                            }}
                            onCreateAccount={() => {
                                setRestoreError(null);
                                setAuthMode('signUp');
                                setLoginContext('onboarding');
                                setStep('auth');
                            }}
                            onSkip={() => {
                                setLoginContext(null);
                                setStep('name');
                            }}
                            onBack={() => setStep('welcome')}
                        />
                    )}

                    {step === 'name' && (
                        <NameStep
                            userName={userName}
                            onNameChange={setUserName}
                            onNext={() => setStep('class')}
                            onBack={() => setStep('account')}
                        />
                    )}

                {step === 'class' && (
                    <ClassStep
                        onClassSelect={(level) => {
                            setSelectedClass(level);
                            setStep('start');
                        }}
                        onBack={() => setStep('name')}
                    />
                )}

                {step === 'start' && (
                    <StartStep
                        onNext={() => setStep('notification')}
                        onBack={() => setStep('class')}
                    />
                )}

                    {step === 'notification' && (
                        <NotificationStep
                            onDone={handleFinish}
                            onBack={() => setStep('start')}
                        />
                    )}
                </AnimatePresence>
        </div>
    );
};
