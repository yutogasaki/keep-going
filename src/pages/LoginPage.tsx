import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { SignUpSuccessView } from './login/SignUpSuccessView';
import { AuthFormView } from './login/AuthFormView';

interface LoginPageProps {
    onBack: () => void;
    onLoginSuccess?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onBack, onLoginSuccess }) => {
    const { signIn, signUp, signInWithGoogle } = useAuth();

    const [isSignUp, setIsSignUp] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [signUpSuccess, setSignUpSuccess] = useState(false);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setError(null);
        setLoading(true);

        try {
            if (isSignUp) {
                const { error: signUpError } = await signUp(email, password);
                if (signUpError) {
                    setError(signUpError.message);
                } else {
                    setSignUpSuccess(true);
                }
            } else {
                const { error: signInError } = await signIn(email, password);
                if (signInError) {
                    setError(signInError.message);
                } else {
                    (onLoginSuccess ?? onBack)();
                }
            }
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setError(null);
        const { error: googleError } = await signInWithGoogle();
        if (googleError) {
            setError(googleError.message);
        }
    };

    if (signUpSuccess) {
        return <SignUpSuccessView email={email} onBack={onBack} />;
    }

    return (
        <AuthFormView
            isSignUp={isSignUp}
            email={email}
            password={password}
            error={error}
            loading={loading}
            onBack={onBack}
            onSubmit={handleSubmit}
            onGoogleLogin={handleGoogleLogin}
            onEmailChange={setEmail}
            onPasswordChange={setPassword}
            onToggleMode={() => {
                setIsSignUp(!isSignUp);
                setError(null);
            }}
        />
    );
};
