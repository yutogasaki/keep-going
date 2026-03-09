import type { AuthError, User } from '@supabase/supabase-js';
import type { SyncConflictPromptData, SyncConflictResolution } from '../../lib/sync';

export type LoginContext = 'onboarding' | 'settings' | null;
export type EmailAuthMode = 'signIn' | 'signUp';

export interface AuthContextValue {
    user: User | null;
    isLoading: boolean;
    isSyncing: boolean;
    isAnonymous: boolean;
    loginContext: LoginContext;
    setLoginContext: (ctx: LoginContext) => void;
    isTeacher: boolean;
    isDeveloper: boolean;
    authError: string | null;
    retryAuth: () => void;
    toastMessage: string | null;
    clearToast: () => void;
    requestSyncConflictResolution: (
        prompt: SyncConflictPromptData,
    ) => Promise<SyncConflictResolution>;
    startEmailAuth: (email: string, mode: EmailAuthMode) => Promise<{ error: AuthError | null }>;
    verifyEmailAuthCode: (email: string, code: string) => Promise<{ error: AuthError | null }>;
    signInWithGoogle: () => Promise<{ error: AuthError | null }>;
    signOut: () => Promise<void>;
}
