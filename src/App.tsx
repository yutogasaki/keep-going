import { useEffect } from 'react';
import { MainLayout } from './layouts/MainLayout';
import { Onboarding } from './pages/Onboarding';
import { useAppStore } from './store/useAppStore';

import { PwaReloadPrompt } from './components/PwaReloadPrompt';

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
        <div className="app-container">
            {hasCompletedOnboarding ? <MainLayout /> : <Onboarding />}
            <PwaReloadPrompt />
        </div>
    );
}

export default App;
