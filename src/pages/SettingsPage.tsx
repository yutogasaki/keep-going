import React, { lazy, Suspense, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { useAuth } from '../contexts/AuthContext';
import { PageHeader } from '../components/PageHeader';
import { CurrentContextBadge } from '../components/CurrentContextBadge';
import { ConfirmDeleteModal } from '../components/ConfirmDeleteModal';
import { AccountSection } from './settings/AccountSection';
import { TeacherSection } from './settings/TeacherSection';
import { UserManagementSection } from './settings/UserManagementSection';
import { SoundNotificationSettingsSection } from './settings/SoundNotificationSettingsSection';
import { HelpCenterSection } from './settings/HelpCenterSection';
import { FeedbackSection } from './settings/FeedbackSection';
import { AppInfoActionsSection } from './settings/AppInfoActionsSection';
import { DeveloperDebugSection } from './settings/DeveloperDebugSection';

const TeacherDashboard = lazy(() =>
    import('./TeacherDashboard').then((module) => ({ default: module.TeacherDashboard }))
);

const DeveloperDashboard = lazy(() =>
    import('./DeveloperDashboard').then((module) => ({ default: module.DeveloperDashboard }))
);

const FullPageFallback: React.FC = () => (
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
);

export const SettingsPage: React.FC = () => {
    const users = useAppStore(s => s.users);
    const addUser = useAppStore(s => s.addUser);
    const updateUser = useAppStore(s => s.updateUser);
    const deleteUser = useAppStore(s => s.deleteUser);
    const { isTeacher, isDeveloper } = useAuth();
    const [showTeacherDashboard, setShowTeacherDashboard] = useState(false);
    const [showDeveloperDashboard, setShowDeveloperDashboard] = useState(false);
    const [showCacheClearConfirm, setShowCacheClearConfirm] = useState(false);

    if (showTeacherDashboard) {
        return (
            <Suspense fallback={<FullPageFallback />}>
                <TeacherDashboard onBack={() => setShowTeacherDashboard(false)} />
            </Suspense>
        );
    }
    if (showDeveloperDashboard) {
        return (
            <Suspense fallback={<FullPageFallback />}>
                <DeveloperDashboard onBack={() => setShowDeveloperDashboard(false)} />
            </Suspense>
        );
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
                            onClick={() => setShowCacheClearConfirm(true)}
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
                <FeedbackSection />
                <AppInfoActionsSection />
                {import.meta.env.DEV && <DeveloperDebugSection />}
            </div>

            <ConfirmDeleteModal
                open={showCacheClearConfirm}
                title="キャッシュをクリアしますか？"
                message="アプリのキャッシュを削除して最新版に更新します。データは消えませんが、一時的に読み込みが遅くなることがあります。"
                onCancel={() => setShowCacheClearConfirm(false)}
                onConfirm={async () => {
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
                confirmLabel="クリアする"
                loadingLabel="クリア中..."
                confirmColor="#0984E3"
            />
        </div>
    );
};
