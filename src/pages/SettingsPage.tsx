import React, { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { useAuth } from '../contexts/AuthContext';
import { PageHeader } from '../components/PageHeader';
import { CurrentContextBadge } from '../components/CurrentContextBadge';
import { AccountSection } from './settings/AccountSection';
import { TeacherSection } from './settings/TeacherSection';
import { TeacherDashboard } from './TeacherDashboard';
import { DeveloperDashboard } from './DeveloperDashboard';
import { UserManagementSection } from './settings/UserManagementSection';
import { SoundNotificationSettingsSection } from './settings/SoundNotificationSettingsSection';
import { HelpCenterSection } from './settings/HelpCenterSection';
import { AppInfoActionsSection } from './settings/AppInfoActionsSection';
import { DeveloperDebugSection } from './settings/DeveloperDebugSection';

export const SettingsPage: React.FC = () => {
    const users = useAppStore(s => s.users);
    const addUser = useAppStore(s => s.addUser);
    const updateUser = useAppStore(s => s.updateUser);
    const deleteUser = useAppStore(s => s.deleteUser);
    const { isTeacher, isDeveloper } = useAuth();
    const [showTeacherDashboard, setShowTeacherDashboard] = useState(false);
    const [showDeveloperDashboard, setShowDeveloperDashboard] = useState(false);

    if (showTeacherDashboard) {
        return <TeacherDashboard onBack={() => setShowTeacherDashboard(false)} />;
    }
    if (showDeveloperDashboard) {
        return <DeveloperDashboard onBack={() => setShowDeveloperDashboard(false)} />;
    }

    return (
        <div style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            overflowY: 'auto',
            paddingBottom: 100,
        }}>
            <PageHeader
                title="せってい"
                rightElement={
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <button
                            onClick={async () => {
                                if ('serviceWorker' in navigator) {
                                    const registrations = await navigator.serviceWorker.getRegistrations();
                                    for (const reg of registrations) {
                                        await reg.update();
                                    }
                                }
                                if ('caches' in window) {
                                    const names = await caches.keys();
                                    for (const name of names) {
                                        await caches.delete(name);
                                    }
                                }
                                window.location.reload();
                            }}
                            style={{
                                width: 36,
                                height: 36,
                                borderRadius: '50%',
                                border: 'none',
                                background: '#F0F3F5',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                color: '#8395A7',
                            }}
                            title="アプリを最新版に更新"
                        >
                            <RefreshCw size={16} />
                        </button>
                        <CurrentContextBadge />
                    </div>
                }
            />

            <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                <AccountSection />

                {isTeacher && (
                    <TeacherSection onEnterDashboard={() => setShowTeacherDashboard(true)} />
                )}

                {isDeveloper && (
                    <div style={{
                        background: 'linear-gradient(135deg, #1a1a2e, #16213e)',
                        borderRadius: 16, padding: 16,
                    }}>
                        <button
                            onClick={() => setShowDeveloperDashboard(true)}
                            style={{
                                width: '100%', padding: '12px 16px', borderRadius: 10,
                                border: 'none', background: 'rgba(255,255,255,0.15)',
                                color: '#fff', fontWeight: 700, fontSize: 14,
                                cursor: 'pointer', display: 'flex', alignItems: 'center',
                                justifyContent: 'center', gap: 8,
                            }}
                        >
                            Developer Dashboard
                        </button>
                    </div>
                )}

                <UserManagementSection
                    users={users}
                    onAddUser={addUser}
                    onUpdateUser={updateUser}
                    onDeleteUser={deleteUser}
                />

                <SoundNotificationSettingsSection />
                <HelpCenterSection />
                <AppInfoActionsSection />
                <DeveloperDebugSection />
            </div>
        </div>
    );
};
