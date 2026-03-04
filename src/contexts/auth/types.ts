import type { AuthError, User } from '@supabase/supabase-js';

export type LoginContext = 'onboarding' | 'settings' | null;

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
    signUp: (email: string, password: string) => Promise<{ error: AuthError | null }>;
    signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
    signInWithGoogle: () => Promise<{ error: AuthError | null }>;
    signOut: () => Promise<void>;
}
