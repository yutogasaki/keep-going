import {
    createContext,
    useCallback,
    useContext,
    useMemo,
    useState,
    type ReactNode,
} from 'react';
import type { User } from '@supabase/supabase-js';
import { SyncConflictModal } from '../components/SyncConflictModal';
import { createAuthActions } from './auth/authActions';
import { runSettingsLoginSync } from './auth/syncFlows';
import type { AuthContextValue, LoginContext } from './auth/types';
import { useAuthBootstrap } from './auth/useAuthBootstrap';
import { useAuthSideEffects } from './auth/useAuthSideEffects';
import { useLoginContextState } from './auth/useLoginContextState';
import { useSyncConflictPromptState } from './auth/useSyncConflictPromptState';

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSyncing, setIsSyncing] = useState(false);
    const [isAnonymous, setIsAnonymous] = useState(false);
    const [isTeacher, setIsTeacher] = useState(false);
    const [isDeveloper, setIsDeveloper] = useState(false);
    const [toastMessage, setToastMessage] = useState<string | null>(null);
    const [authError, setAuthError] = useState<string | null>(null);
    const { loginContext, setLoginContext } = useLoginContextState();
    const {
        requestSyncConflictResolution,
        resolveSyncConflict,
        syncConflictPrompt,
    } = useSyncConflictPromptState();

    const setLoginContextSafe = useCallback((ctx: LoginContext) => {
        setLoginContext(ctx);
    }, [setLoginContext]);

    const clearToast = useCallback(() => setToastMessage(null), []);

    const handleSettingsLogin = useCallback(async (accountId: string) => {
        await runSettingsLoginSync({
            accountId,
            resolveConflict: requestSyncConflictResolution,
            setIsSyncing,
            setToastMessage,
            setLoginContext: setLoginContextSafe,
        });
    }, [requestSyncConflictResolution, setLoginContextSafe]);

    const { startEmailAuth, verifyEmailAuthCode, signInWithGoogle, signOut } = useMemo(
        () => createAuthActions({ user, setToastMessage }),
        [user],
    );

    useAuthSideEffects({
        handleSettingsLogin,
        loginContext,
        setIsAnonymous,
        setIsDeveloper,
        setIsTeacher,
        setLoginContext: setLoginContextSafe,
        setToastMessage,
        toastMessage,
        user,
    });

    const { retryAuth } = useAuthBootstrap({
        setAuthError,
        setIsAnonymous,
        setIsLoading,
        setUser,
    });

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
                setLoginContext: setLoginContextSafe,
                authError,
                retryAuth,
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
