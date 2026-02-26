import { lazy, Suspense, useEffect } from 'react';
import { useAppStore } from './store/useAppStore';
import { PwaReloadPrompt } from './components/PwaReloadPrompt';
import { SyncToast } from './components/SyncToast';
import { AuthProvider, useAuth } from './contexts/AuthContext';

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
            <Suspense fallback={null}>
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
        <AuthProvider>
            <AppContent />
        </AuthProvider>
    );
}

export default App;
