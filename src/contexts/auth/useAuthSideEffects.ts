import { useEffect, useRef } from 'react';
import type { User } from '@supabase/supabase-js';
import { fetchCurrentUserRoleFlags } from '../../lib/userRoles';
import {
    initialSync,
    isPulling,
    processQueue,
    setAccountId,
    setupOnlineListener,
} from '../../lib/sync';
import { useAppStore } from '../../store/useAppStore';
import { useSyncStatus } from '../../store/useSyncStatus';
import { getAppSettingsSnapshot } from './settingsSnapshot';
import type { LoginContext } from './types';

interface UseAuthSideEffectsArgs {
    handleSettingsLogin: (accountId: string) => Promise<void>;
    loginContext: LoginContext;
    setIsAnonymous: (value: boolean) => void;
    setIsDeveloper: (value: boolean) => void;
    setIsTeacher: (value: boolean) => void;
    setLoginContext: (ctx: LoginContext) => void;
    setToastMessage: (message: string | null) => void;
    toastMessage: string | null;
    user: User | null;
}

function reportQueueResult({
    failed,
    dropped,
}: {
    failed: number;
    dropped: number;
}) {
    if (dropped > 0) {
        useSyncStatus.getState().reportFailure(`${dropped}件のデータ同期に失敗しました`);
    } else if (failed === 0) {
        useSyncStatus.getState().clearFailure();
    }
}

export function useAuthSideEffects({
    handleSettingsLogin,
    loginContext,
    setIsAnonymous,
    setIsDeveloper,
    setIsTeacher,
    setLoginContext,
    setToastMessage,
    toastMessage,
    user,
}: UseAuthSideEffectsArgs) {
    const hasSyncedRef = useRef(false);
    const prevUserIdRef = useRef<string | null>(null);
    const prevAnonymousRef = useRef<boolean | null>(null);

    useEffect(() => {
        if (!toastMessage) {
            return;
        }

        const timer = window.setTimeout(() => setToastMessage(null), 3000);
        return () => window.clearTimeout(timer);
    }, [setToastMessage, toastMessage]);

    useEffect(() => {
        if (!user) {
            setAccountId(null);
            setIsTeacher(false);
            setIsDeveloper(false);
            setIsAnonymous(false);
            hasSyncedRef.current = false;
            prevUserIdRef.current = null;
            prevAnonymousRef.current = null;
            return;
        }

        const wasAnonymous = prevAnonymousRef.current;
        const isAnonymousUser = user.is_anonymous ?? false;

        if (
            prevUserIdRef.current !== null
            && (prevUserIdRef.current !== user.id || (wasAnonymous === true && !isAnonymousUser))
        ) {
            hasSyncedRef.current = false;
        }
        prevUserIdRef.current = user.id;
        prevAnonymousRef.current = isAnonymousUser;

        setAccountId(user.id);
        setIsAnonymous(isAnonymousUser);

        if (hasSyncedRef.current) {
            return;
        }
        hasSyncedRef.current = true;

        if (isAnonymousUser) {
            const state = useAppStore.getState();
            if (state.users.length > 0) {
                initialSync(state.users, getAppSettingsSnapshot()).catch((err) => {
                    console.warn('[sync]', err);
                    useSyncStatus.getState().reportFailure(String(err));
                });
            }
            return;
        }

        const isOnboarding = loginContext === 'onboarding' && !useAppStore.getState().onboardingCompleted;
        if (isOnboarding) {
            return;
        }

        if (loginContext === 'onboarding') {
            setLoginContext(null);
            processQueue().catch((err) => {
                console.warn('[sync]', err);
            });
            return;
        }

        if (loginContext === 'settings') {
            handleSettingsLogin(user.id);
            return;
        }

        processQueue().then(reportQueueResult).catch((err) => {
            console.warn('[sync]', err);
            useSyncStatus.getState().reportFailure(String(err));
        });
    }, [
        handleSettingsLogin,
        loginContext,
        setIsAnonymous,
        setIsDeveloper,
        setIsTeacher,
        setLoginContext,
        user,
    ]);

    useEffect(() => {
        let cancelled = false;

        if (!user || user.is_anonymous) {
            setIsTeacher(false);
            setIsDeveloper(false);
            return;
        }

        setIsTeacher(false);
        setIsDeveloper(false);

        fetchCurrentUserRoleFlags().then((roles) => {
            if (cancelled) {
                return;
            }
            setIsTeacher(roles.isTeacher);
            setIsDeveloper(roles.isDeveloper);
        }).catch((error) => {
            console.warn('[auth] Failed to fetch role flags:', error);
            if (cancelled) {
                return;
            }
            setIsTeacher(false);
            setIsDeveloper(false);
        });

        return () => {
            cancelled = true;
        };
    }, [setIsDeveloper, setIsTeacher, user]);

    useEffect(() => {
        const cleanup = setupOnlineListener();
        return cleanup;
    }, []);

    useEffect(() => {
        if (!user) {
            return;
        }

        const interval = window.setInterval(() => {
            if (isPulling()) {
                return;
            }

            processQueue().then(reportQueueResult).catch((err) => {
                console.warn('[sync]', err);
                useSyncStatus.getState().reportFailure(String(err));
            });
        }, 60_000);

        return () => window.clearInterval(interval);
    }, [user]);
}
