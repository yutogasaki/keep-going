import React, { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { useAuth } from '../contexts/AuthContext';
import { PageHeader } from '../components/PageHeader';
import { CurrentContextBadge } from '../components/CurrentContextBadge';
import { AccountSection } from './settings/AccountSection';
import { TeacherSection } from './settings/TeacherSection';
import { TeacherDashboard } from './TeacherDashboard';
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
    const { isTeacher } = useAuth();
    const [showTeacherDashboard, setShowTeacherDashboard] = useState(false);

    if (showTeacherDashboard) {
        return <TeacherDashboard onBack={() => setShowTeacherDashboard(false)} />;
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
