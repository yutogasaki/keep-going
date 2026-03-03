import React, { useEffect, useState } from 'react';
import { DEFAULT_SESSION_TARGET_SECONDS, getExercisesByClass } from '../data/exercises';
import { getPresetsForClass, getCustomGroups, deleteCustomGroup, type MenuGroup } from '../data/menuGroups';
import { getCustomExercises, deleteCustomExercise, type CustomExercise } from '../lib/db';
import { publishMenu, unpublishMenu, fetchMyPublishedMenus, type PublicMenu } from '../lib/publicMenus';
import { getAccountId } from '../lib/sync';
import { PublicMenuBrowser } from '../components/PublicMenuBrowser';
import { audio } from '../lib/audio';
import { PageHeader } from '../components/PageHeader';
import { CurrentContextBadge } from '../components/CurrentContextBadge';
import { useAppStore } from '../store/useAppStore';
import { CustomMenuModal } from './menu/CustomMenuModal';
import { CreateGroupView } from './menu/CreateGroupView';
import { SingleExerciseEditor } from './menu/SingleExerciseEditor';
import { MenuGroupTab } from './menu/MenuGroupTab';
import { MenuIndividualTab } from './menu/MenuIndividualTab';
import { getCreatorNameById, getMinClassLevel } from './menu/menuPageUtils';

type MenuTab = 'group' | 'individual';

const MENU_TABS: { id: MenuTab; label: string }[] = [
    { id: 'group', label: 'くみあわせ' },
    { id: 'individual', label: 'ひとつ' },
];

export const MenuPage: React.FC = () => {
    const users = useAppStore((state) => state.users);
    const sessionUserIds = useAppStore((state) => state.sessionUserIds);
    const startSessionWithExercises = useAppStore((state) => state.startSessionWithExercises);
    const updateUserSettings = useAppStore((state) => state.updateUserSettings);

    const currentUsers = users.filter((user) => sessionUserIds.includes(user.id));
    const classLevel = getMinClassLevel(currentUsers);

    const [tab, setTab] = useState<MenuTab>('group');
    const [presets, setPresets] = useState<MenuGroup[]>([]);
    const [customGroups, setCustomGroups] = useState<MenuGroup[]>([]);
    const [customExercises, setCustomExercises] = useState<CustomExercise[]>([]);
    const [showCreateGroup, setShowCreateGroup] = useState(false);
    const [showCreateEx, setShowCreateEx] = useState(false);
    const [editGroup, setEditGroup] = useState<MenuGroup | null>(null);
    const [editEx, setEditEx] = useState<CustomExercise | null>(null);
    const [showCustomMenu, setShowCustomMenu] = useState(false);
    const [showPublicBrowser, setShowPublicBrowser] = useState(false);
    const [myPublishedMenus, setMyPublishedMenus] = useState<PublicMenu[]>([]);

    const isTogetherMode = sessionUserIds.length > 1;

    const dailyTargetMinutes = isTogetherMode
        ? (currentUsers.length > 0
            ? Math.max(...currentUsers.map((user) => user.dailyTargetMinutes ?? 10))
            : 10)
        : (currentUsers[0]?.dailyTargetMinutes ?? 10);

    const excludedExercises = Array.from(new Set(currentUsers.flatMap((user) => user.excludedExercises || (user.classLevel === 'プレ' ? ['C01', 'C02'] : []))));
    const requiredExercises = Array.from(new Set(currentUsers.flatMap((user) => user.requiredExercises || ['S01', 'S02', 'S07'])));

    const loadCustomData = async () => {
        const currentUserId = sessionUserIds[0] ?? users[0]?.id;

        const allGroups = await getCustomGroups();
        const allExercises = await getCustomExercises();

        setCustomGroups(allGroups.filter((group) => {
            if (isTogetherMode) {
                return true;
            }
            return !group.creatorId || group.creatorId === currentUserId;
        }));

        setCustomExercises(allExercises.filter((exercise) => {
            if (isTogetherMode) {
                return true;
            }
            return !exercise.creatorId || exercise.creatorId === currentUserId;
        }));

        if (getAccountId()) {
            fetchMyPublishedMenus().then(setMyPublishedMenus).catch(console.warn);
        }
    };

    useEffect(() => {
        setPresets(getPresetsForClass(classLevel));
        void loadCustomData();
    }, [classLevel, sessionUserIds]);

    const setDailyTargetMinutes = (minutes: number) => {
        if (!isTogetherMode && currentUsers[0]) {
            updateUserSettings(currentUsers[0].id, { dailyTargetMinutes: minutes });
        }
    };

    const setExcludedExercises = (exerciseIds: string[]) => {
        if (!isTogetherMode && currentUsers[0]) {
            updateUserSettings(currentUsers[0].id, { excludedExercises: exerciseIds });
        }
    };

    const setRequiredExercises = (exerciseIds: string[]) => {
        if (!isTogetherMode && currentUsers[0]) {
            updateUserSettings(currentUsers[0].id, { requiredExercises: exerciseIds });
        }
    };

    const handleGroupTap = (group: MenuGroup) => {
        audio.initTTS();
        startSessionWithExercises(group.exerciseIds);
    };

    const handleDeleteGroup = async (groupId: string) => {
        await deleteCustomGroup(groupId);
        await loadCustomData();
    };

    const handleDeleteEx = async (exerciseId: string) => {
        await deleteCustomExercise(exerciseId);
        await loadCustomData();
    };

    const handleCreatedGroup = () => {
        setShowCreateGroup(false);
        setEditGroup(null);
        void loadCustomData();
    };

    const handleCreatedEx = () => {
        setShowCreateEx(false);
        setEditEx(null);
        void loadCustomData();
    };

    const findPublishedMenu = (group: MenuGroup): PublicMenu | undefined => {
        return myPublishedMenus.find(
            (publishedMenu) => publishedMenu.name === group.name && publishedMenu.exerciseIds.join(',') === group.exerciseIds.join(',')
        );
    };

    const handlePublishGroup = async (group: MenuGroup) => {
        if (!getAccountId()) {
            return;
        }

        const authorName = currentUsers[0]?.name ?? 'ゲスト';

        try {
            await publishMenu(group, authorName);
            alert('メニューを公開しました！');
            void loadCustomData();
        } catch (error) {
            console.warn('[menu] publish failed:', error);
            alert('公開に失敗しました');
        }
    };

    const handleUnpublishGroup = async (group: MenuGroup) => {
        const publishedMenu = findPublishedMenu(group);
        if (!publishedMenu) {
            return;
        }

        try {
            await unpublishMenu(publishedMenu.id);
            alert('メニューを非公開にしました');
            void loadCustomData();
        } catch (error) {
            console.warn('[menu] unpublish failed:', error);
            alert('非公開に失敗しました');
        }
    };

    if (showCreateGroup || editGroup) {
        const publishedId = editGroup ? findPublishedMenu(editGroup)?.id : undefined;

        return (
            <CreateGroupView
                classLevel={classLevel}
                initial={editGroup}
                currentUserId={sessionUserIds.length === 1 ? sessionUserIds[0] : undefined}
                authorName={currentUsers[0]?.name ?? 'ゲスト'}
                publishedMenuId={publishedId}
                onSave={handleCreatedGroup}
                onCancel={() => {
                    setShowCreateGroup(false);
                    setEditGroup(null);
                }}
            />
        );
    }

    if (showCreateEx || editEx) {
        return (
            <SingleExerciseEditor
                initial={editEx}
                currentUserId={sessionUserIds.length === 1 ? sessionUserIds[0] : undefined}
                onSave={handleCreatedEx}
                onCancel={() => {
                    setShowCreateEx(false);
                    setEditEx(null);
                }}
            />
        );
    }

    const exercises = getExercisesByClass(classLevel);
    const autoMenuMinutes = Math.ceil(DEFAULT_SESSION_TARGET_SECONDS / 60);
    const canPublish = !!getAccountId();

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
                title="メニュー"
                rightElement={<CurrentContextBadge />}
            />

            <div style={{
                display: 'flex',
                gap: 4,
                background: 'rgba(0,0,0,0.04)',
                borderRadius: 12,
                padding: 3,
                margin: '0 20px 16px',
            }}>
                {MENU_TABS.map((menuTab) => (
                    <button
                        key={menuTab.id}
                        onClick={() => setTab(menuTab.id)}
                        style={{
                            flex: 1,
                            padding: '8px 0',
                            borderRadius: 10,
                            border: 'none',
                            cursor: 'pointer',
                            fontFamily: "'Noto Sans JP', sans-serif",
                            fontSize: 13,
                            fontWeight: 700,
                            background: tab === menuTab.id ? 'white' : 'transparent',
                            color: tab === menuTab.id ? '#2D3436' : '#8395A7',
                            boxShadow: tab === menuTab.id ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                            transition: 'all 0.2s ease',
                        }}
                    >
                        {menuTab.label}
                    </button>
                ))}
            </div>

            {tab === 'group' && (
                <MenuGroupTab
                    isTogetherMode={isTogetherMode}
                    dailyTargetMinutes={dailyTargetMinutes}
                    requiredExercises={requiredExercises}
                    excludedExercises={excludedExercises}
                    autoMenuMinutes={autoMenuMinutes}
                    presets={presets}
                    customGroups={customGroups}
                    sessionUserCount={sessionUserIds.length}
                    getCreatorName={(creatorId) => getCreatorNameById(users, creatorId)}
                    onOpenCustomMenu={() => setShowCustomMenu(true)}
                    onGroupTap={handleGroupTap}
                    onEditGroup={setEditGroup}
                    onDeleteGroup={handleDeleteGroup}
                    onCreateGroup={() => setShowCreateGroup(true)}
                    canPublish={canPublish}
                    onPublishGroup={handlePublishGroup}
                    onUnpublishGroup={handleUnpublishGroup}
                    findPublishedMenu={findPublishedMenu}
                    onOpenPublicBrowser={() => setShowPublicBrowser(true)}
                />
            )}

            {tab === 'individual' && (
                <MenuIndividualTab
                    exercises={exercises}
                    requiredExercises={requiredExercises}
                    customExercises={customExercises}
                    isTogetherMode={isTogetherMode}
                    getCreatorName={(creatorId) => getCreatorNameById(users, creatorId)}
                    onStartExercise={(exerciseId) => {
                        audio.initTTS();
                        startSessionWithExercises([exerciseId]);
                    }}
                    onEditCustomExercise={setEditEx}
                    onDeleteCustomExercise={handleDeleteEx}
                    onStartCustomExercise={(exerciseId) => startSessionWithExercises([exerciseId])}
                    onCreateCustomExercise={() => setShowCreateEx(true)}
                />
            )}

            <CustomMenuModal
                show={showCustomMenu}
                isTogetherMode={isTogetherMode}
                dailyTargetMinutes={dailyTargetMinutes}
                requiredExercises={requiredExercises}
                excludedExercises={excludedExercises}
                customExercises={customExercises}
                onClose={() => setShowCustomMenu(false)}
                onSetDailyTargetMinutes={setDailyTargetMinutes}
                onSetExcludedExercises={setExcludedExercises}
                onSetRequiredExercises={setRequiredExercises}
            />

            <PublicMenuBrowser
                open={showPublicBrowser}
                onClose={() => setShowPublicBrowser(false)}
                onImported={loadCustomData}
            />
        </div>
    );
};
