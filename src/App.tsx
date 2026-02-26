import { lazy, Suspense, useEffect } from 'react';
import { useAppStore } from './store/useAppStore';
import { PwaReloadPrompt } from './components/PwaReloadPrompt';
import { AuthProvider } from './contexts/AuthContext';

const MainLayout = lazy(() =>
    import('./layouts/MainLayout').then((module) => ({ default: module.MainLayout }))
);

const Onboarding = lazy(() =>
    import('./pages/Onboarding').then((module) => ({ default: module.Onboarding }))
);

function App() {
    const hasCompletedOnboarding = useAppStore(state => state.onboardingCompleted);

    useEffect(() => {
        const hour = new Date().getHours();
        if (hour >= 18 || hour < 4) {
            document.documentElement.setAttribute('data-theme', 'evening');
        } else if (hour >= 10 && hour < 18) {
            document.documentElement.setAttribute('data-theme', 'day');
        } else {
            document.documentElement.removeAttribute('data-theme'); // default (morning)
        }
    }, []);

    return (
        <AuthProvider>
            <div className="app-container">
                <Suspense fallback={null}>
                    {hasCompletedOnboarding ? <MainLayout /> : <Onboarding />}
                </Suspense>
                <PwaReloadPrompt />
            </div>
        </AuthProvider>
    );
}

export default App;
