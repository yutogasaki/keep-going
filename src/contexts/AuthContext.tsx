import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
    type ReactNode,
} from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { initialSync, processQueue, setAccountId, setupOnlineListener } from '../lib/sync';
import { useAppStore } from '../store/useAppStore';
import { useSyncStatus } from '../store/useSyncStatus';
import { SyncConflictModal } from '../components/SyncConflictModal';
import { fetchCurrentUserRoleFlags } from '../lib/userRoles';
import { createAuthActions } from './auth/authActions';
import { LOGIN_CONTEXT_KEY } from './auth/constants';
import { getAppSettingsSnapshot } from './auth/settingsSnapshot';
import { runSettingsLoginSync } from './auth/syncFlows';
import type { AuthContextValue, LoginContext } from './auth/types';
import type { SyncConflictPromptData, SyncConflictResolution } from '../lib/sync';

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSyncing, setIsSyncing] = useState(false);
    const [isAnonymous, setIsAnonymous] = useState(false);
    const [isTeacher, setIsTeacher] = useState(false);
    const [isDeveloper, setIsDeveloper] = useState(false);
    const [loginContext, setLoginContextState] = useState<LoginContext>(() => {
        const saved = sessionStorage.getItem(LOGIN_CONTEXT_KEY);
        return saved === 'onboarding' || saved === 'settings' ? saved : null;
    });
    const [toastMessage, setToastMessage] = useState<string | null>(null);
    const [authError, setAuthError] = useState<string | null>(null);
    const [syncConflictPrompt, setSyncConflictPrompt] = useState<SyncConflictPromptData | null>(null);

    const hasSyncedRef = useRef(false);
    const prevUserIdRef = useRef<string | null>(null);
    const prevAnonymousRef = useRef<boolean | null>(null);
    const syncConflictResolverRef = useRef<((choice: SyncConflictResolution) => void) | null>(null);

    const setLoginContext = useCallback((ctx: LoginContext) => {
        setLoginContextState(ctx);
        if (ctx) {
            sessionStorage.setItem(LOGIN_CONTEXT_KEY, ctx);
        } else {
            sessionStorage.removeItem(LOGIN_CONTEXT_KEY);
        }
    }, []);

    const clearToast = useCallback(() => setToastMessage(null), []);

    const requestSyncConflictResolution = useCallback((prompt: SyncConflictPromptData) => {
        return new Promise<SyncConflictResolution>((resolve) => {
            syncConflictResolverRef.current = resolve;
            setSyncConflictPrompt(prompt);
        });
    }, []);

    const resolveSyncConflict = useCallback((choice: SyncConflictResolution) => {
        syncConflictResolverRef.current?.(choice);
        syncConflictResolverRef.current = null;
        setSyncConflictPrompt(null);
    }, []);

    const handleSettingsLogin = useCallback(async (accountId: string) => {
        await runSettingsLoginSync({
            accountId,
            resolveConflict: requestSyncConflictResolution,
            setIsSyncing,
            setToastMessage,
            setLoginContext,
        });
    }, [requestSyncConflictResolution, setLoginContext]);

    const { startEmailAuth, verifyEmailAuthCode, signInWithGoogle, signOut } = useMemo(
        () => createAuthActions({ user, setToastMessage }),
        [user],
    );

    useEffect(() => {
        if (!toastMessage) return;
        const timer = setTimeout(() => setToastMessage(null), 3000);
        return () => clearTimeout(timer);
    }, [toastMessage]);

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
            prevUserIdRef.current !== null &&
            (prevUserIdRef.current !== user.id || (wasAnonymous === true && !isAnonymousUser))
        ) {
            hasSyncedRef.current = false;
        }
        prevUserIdRef.current = user.id;
        prevAnonymousRef.current = isAnonymousUser;

        setAccountId(user.id);
        setIsAnonymous(isAnonymousUser);

        if (hasSyncedRef.current) return;
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
        if (isOnboarding) return;

        if (loginContext === 'onboarding') {
            setLoginContext(null);
            return;
        }

        if (loginContext === 'settings') {
            handleSettingsLogin(user.id);
        } else {
            processQueue().then(({ failed }) => {
                if (failed === 0) useSyncStatus.getState().clearFailure();
            }).catch((err) => {
                console.warn('[sync]', err);
                useSyncStatus.getState().reportFailure(String(err));
            });
        }
    }, [user, loginContext, handleSettingsLogin, setLoginContext]);

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
            if (cancelled) return;
            setIsTeacher(roles.isTeacher);
            setIsDeveloper(roles.isDeveloper);
        }).catch((error) => {
            console.warn('[auth] Failed to fetch role flags:', error);
            if (cancelled) return;
            setIsTeacher(false);
            setIsDeveloper(false);
        });

        return () => {
            cancelled = true;
        };
    }, [user]);

    useEffect(() => {
        const cleanup = setupOnlineListener();
        return cleanup;
    }, []);

    useEffect(() => {
        if (!user) return;

        const interval = setInterval(() => {
            processQueue().then(({ failed }) => {
                if (failed === 0) useSyncStatus.getState().clearFailure();
            }).catch((err) => {
                console.warn('[sync]', err);
                useSyncStatus.getState().reportFailure(String(err));
            });
        }, 60_000);

        return () => clearInterval(interval);
    }, [user]);

    const initAuth = useCallback(() => {
        if (!supabase) {
            setIsLoading(false);
            return;
        }

        setAuthError(null);
        setIsLoading(true);

        const sb = supabase;

        sb.auth.getSession().then(({ data: { session } }) => {
            if (session?.user) {
                setUser(session.user);
                setIsLoading(false);
            } else {
                sb.auth.signInAnonymously().then(({ error }) => {
                    if (error) {
                        console.warn('[auth] anonymous sign-in failed:', error);
                        setAuthError('サーバーに接続できませんでした');
                    }
                    setIsLoading(false);
                });
            }
        }).catch((error) => {
            console.warn('[auth] getSession failed:', error);
            setAuthError('サーバーに接続できませんでした');
            setIsLoading(false);
        });
    }, []);

    useEffect(() => {
        initAuth();

        if (!supabase) return;

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            const nextUser = session?.user ?? null;
            setUser(nextUser);
            setIsAnonymous(nextUser?.is_anonymous ?? false);
            if (nextUser) setAuthError(null);
        });

        return () => subscription.unsubscribe();
    }, [initAuth]);

    return (
        <AuthContext.Provider
            value={{
                user,
                isLoading,
                isSyncing,
                isAnonymous,
                isTeacher,
                isDeveloper,
                loginContext,
                setLoginContext,
                authError,
                retryAuth: initAuth,
                toastMessage,
                clearToast,
                requestSyncConflictResolution,
                startEmailAuth,
                verifyEmailAuthCode,
                signInWithGoogle,
                signOut,
            }}
        >
            {children}
            <SyncConflictModal
                open={syncConflictPrompt != null}
                localSummary={syncConflictPrompt?.localSummary ?? null}
                cloudSummary={syncConflictPrompt?.cloudSummary ?? null}
                recommendedResolution={syncConflictPrompt?.recommendedResolution ?? null}
                recommendationReason={syncConflictPrompt?.recommendationReason ?? null}
                onChooseCloud={() => resolveSyncConflict('cloud')}
                onChooseMerge={() => resolveSyncConflict('merge')}
            />
        </AuthContext.Provider>
    );
}

export function useAuth(): AuthContextValue {
    const ctx = useContext(AuthContext);
    if (!ctx) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return ctx;
}
