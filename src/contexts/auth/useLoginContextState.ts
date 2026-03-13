import { useCallback, useState } from 'react';
import { LOGIN_CONTEXT_KEY } from './constants';
import type { LoginContext } from './types';

function readStoredLoginContext(): LoginContext {
    if (typeof window === 'undefined') {
        return null;
    }

    const saved = window.sessionStorage.getItem(LOGIN_CONTEXT_KEY);
    return saved === 'onboarding' || saved === 'settings' ? saved : null;
}

export function useLoginContextState() {
    const [loginContext, setLoginContextState] = useState<LoginContext>(readStoredLoginContext);

    const setLoginContext = useCallback((ctx: LoginContext) => {
        setLoginContextState(ctx);

        if (typeof window === 'undefined') {
            return;
        }

        if (ctx) {
            window.sessionStorage.setItem(LOGIN_CONTEXT_KEY, ctx);
        } else {
            window.sessionStorage.removeItem(LOGIN_CONTEXT_KEY);
        }
    }, []);

    return {
        loginContext,
        setLoginContext,
    };
}
