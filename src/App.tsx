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
    const { toastMessage } = useAuth();

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
