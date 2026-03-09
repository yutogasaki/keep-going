import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import type { EmailAuthMode } from '../contexts/auth/types';
import { AuthFormView } from './login/AuthFormView';

interface LoginPageProps {
    onBack: () => void;
    onLoginSuccess?: () => void;
    initialMode?: EmailAuthMode;
}

export const LoginPage: React.FC<LoginPageProps> = ({
    onBack,
    onLoginSuccess,
    initialMode = 'signIn',
}) => {
    const {
        user,
        signInWithGoogle,
        startEmailAuth,
        verifyEmailAuthCode,
    } = useAuth();

    const [mode, setMode] = useState<EmailAuthMode>(initialMode);
    const [email, setEmail] = useState('');
    const [code, setCode] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [hasSentEmail, setHasSentEmail] = useState(false);

    useEffect(() => {
        setMode(initialMode);
        setCode('');
        setError(null);
        setHasSentEmail(false);
    }, [initialMode]);

    useEffect(() => {
        if (user && !user.is_anonymous) {
            onLoginSuccess?.();
        }
    }, [user, onLoginSuccess]);

    const submitEmail = async (event: React.FormEvent) => {
        event.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const { error: authError } = await startEmailAuth(email.trim(), mode);
            if (authError) {
                setError(authError.message);
                return;
            }
            setHasSentEmail(true);
            setCode('');
        } finally {
            setLoading(false);
        }
    };

    const verifyCode = async (event: React.FormEvent) => {
        event.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const { error: authError } = await verifyEmailAuthCode(email.trim(), code.trim(), mode);
            if (authError) {
                setError(authError.message);
            }
        } finally {
            setLoading(false);
        }
    };

    const resendEmail = async () => {
        setError(null);
        setLoading(true);

        try {
            const { error: authError } = await startEmailAuth(email.trim(), mode);
            if (authError) {
                setError(authError.message);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setError(null);
        setLoading(true);

        try {
            const { error: googleError } = await signInWithGoogle();
            if (googleError) {
                setError(googleError.message);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthFormView
            mode={mode}
            email={email}
            code={code}
            error={error}
            loading={loading}
            hasSentEmail={hasSentEmail}
            onBack={onBack}
            onStartEmailAuth={submitEmail}
            onVerifyCode={verifyCode}
            onGoogleLogin={handleGoogleLogin}
            onEmailChange={setEmail}
            onCodeChange={setCode}
            onToggleMode={() => {
                setMode((previous) => (previous === 'signUp' ? 'signIn' : 'signUp'));
                setHasSentEmail(false);
                setCode('');
                setError(null);
            }}
            onResend={resendEmail}
            onEditEmail={() => {
                setHasSentEmail(false);
                setCode('');
                setError(null);
            }}
        />
    );
};
