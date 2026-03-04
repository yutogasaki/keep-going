import { lazy, Suspense, useEffect } from 'react';
import { useAppStore } from './store/useAppStore';
import { PwaReloadPrompt } from './components/PwaReloadPrompt';
import { SyncToast } from './components/SyncToast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ErrorBoundary } from './components/ErrorBoundary';

const MainLayout = lazy(() =>
    import('./layouts/MainLayout').then((module) => ({ default: module.MainLayout }))
);

const Onboarding = lazy(() =>
    import('./pages/Onboarding').then((module) => ({ default: module.Onboarding }))
);

function AppContent() {
    const hasCompletedOnboarding = useAppStore(state => state.onboardingCompleted);
    const { toastMessage, authError, retryAuth, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div className="app-container">
                <div style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: "'Noto Sans JP', sans-serif",
                    color: '#8395A7',
                    fontSize: 14,
                }}>
                    読み込み中...
                </div>
            </div>
        );
    }

    if (authError) {
        return (
            <div className="app-container">
                <div style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 16,
                    padding: 32,
                    fontFamily: "'Noto Sans JP', sans-serif",
                }}>
                    <div style={{ fontSize: 40 }}>😵</div>
                    <p style={{
                        color: '#2D3436',
                        fontSize: 16,
                        fontWeight: 700,
                        margin: 0,
                        textAlign: 'center',
                    }}>
                        {authError}
                    </p>
                    <p style={{
                        color: '#636E72',
                        fontSize: 13,
                        margin: 0,
                        textAlign: 'center',
                        lineHeight: 1.6,
                    }}>
                        ネットワーク接続を確認してから、もう一度お試しください
                    </p>
                    <button
                        onClick={retryAuth}
                        style={{
                            marginTop: 8,
                            padding: '12px 32px',
                            borderRadius: 12,
                            border: 'none',
                            background: '#6C5CE7',
                            color: '#fff',
                            fontSize: 14,
                            fontWeight: 700,
                            fontFamily: "'Noto Sans JP', sans-serif",
                            cursor: 'pointer',
                        }}
                    >
                        もういちど
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="app-container">
            <Suspense fallback={
                <div style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: "'Noto Sans JP', sans-serif",
                    color: '#8395A7',
                    fontSize: 14,
                }}>
                    読み込み中...
                </div>
            }>
                {hasCompletedOnboarding ? <MainLayout /> : <Onboarding />}
            </Suspense>
            <PwaReloadPrompt />
            <SyncToast message={toastMessage} />
        </div>
    );
}

function App() {
    useEffect(() => {
        const hour = new Date().getHours();
        if (hour >= 18 || hour < 4) {
            document.documentElement.setAttribute('data-theme', 'evening');
        } else if (hour >= 10 && hour < 18) {
            document.documentElement.setAttribute('data-theme', 'day');
        } else {
            document.documentElement.removeAttribute('data-theme');
        }
    }, []);

    return (
        <ErrorBoundary>
            <AuthProvider>
                <AppContent />
            </AuthProvider>
        </ErrorBoundary>
    );
}

export default App;
