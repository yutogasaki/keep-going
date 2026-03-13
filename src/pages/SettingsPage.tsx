import React, { lazy, Suspense, useState } from 'react';
import { ChevronRight, Globe, RefreshCw } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { useAuth } from '../contexts/AuthContext';
import { PageHeader } from '../components/PageHeader';
import { CurrentContextBadge } from '../components/CurrentContextBadge';
import { ConfirmDeleteModal } from '../components/ConfirmDeleteModal';
import { ScreenScaffold } from '../components/ScreenScaffold';
import { COLOR, HEADER_ICON_BUTTON_SIZE, SCREEN_PADDING_X } from '../lib/styles';
import { AccountSection } from './settings/AccountSection';
import { TeacherSection } from './settings/TeacherSection';
import { UserManagementSection } from './settings/UserManagementSection';
import { SoundNotificationSettingsSection } from './settings/SoundNotificationSettingsSection';
import { HelpCenterSection } from './settings/HelpCenterSection';
import { FeedbackSection } from './settings/FeedbackSection';
import { AppInfoActionsSection } from './settings/AppInfoActionsSection';

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
        <>
            <ScreenScaffold
                header={
                    <PageHeader
                        title="せってい"
                        rightElement={
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <button
                                    onClick={() => setShowCacheClearConfirm(true)}
                                    style={{
                                        width: HEADER_ICON_BUTTON_SIZE,
                                        height: HEADER_ICON_BUTTON_SIZE,
                                        borderRadius: '50%',
                                        border: 'none',
                                        background: COLOR.bgMuted,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: 'pointer',
                                        color: COLOR.muted,
                                    }}
                                    title="アプリを最新版に更新"
                                >
                                    <RefreshCw size={16} />
                                </button>
                                <CurrentContextBadge />
                            </div>
                        }
                    />
                }
                withBottomNav
            >
                <div style={{ padding: `0 ${SCREEN_PADDING_X}px`, display: 'flex', flexDirection: 'column', gap: 16 }}>
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

                    <div
                        className="card"
                        onClick={() => window.open('/website/', '_blank', 'noopener,noreferrer')}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                            padding: '16px 20px',
                            cursor: 'pointer',
                        }}
                    >
                        <div style={{
                            width: 40,
                            height: 40,
                            borderRadius: 12,
                            background: 'linear-gradient(135deg, #E8F8F0, #F0FDFA)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                        }}>
                            <Globe size={22} color="#2BBAA0" />
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{
                                fontFamily: "'Noto Sans JP', sans-serif",
                                fontSize: 14,
                                fontWeight: 700,
                                color: '#2D3436',
                            }}>
                                ウェブサイト
                            </div>
                            <div style={{
                                fontFamily: "'Noto Sans JP', sans-serif",
                                fontSize: 12,
                                color: '#8395A7',
                            }}>
                                更新情報・Tips・インストール方法
                            </div>
                        </div>
                        <ChevronRight size={18} color="#B2BEC3" />
                    </div>

                    <AppInfoActionsSection />
                </div>
            </ScreenScaffold>

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
        </>
    );
};
