import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
const lazyConfetti = () => import('canvas-confetti').then((m) => m.default);
import { CurrentContextBadge } from '../components/CurrentContextBadge';
import { PageHeader } from '../components/PageHeader';
import { PublicExerciseBrowser } from '../components/PublicExerciseBrowser';
import { PublicMenuBrowser } from '../components/PublicMenuBrowser';
import { ScreenScaffold } from '../components/ScreenScaffold';
import { ConfirmDeleteModal } from '../components/ConfirmDeleteModal';
import { ExerciseDetailSheet } from '../components/ExerciseDetailSheet';
import { MenuDetailSheet } from '../components/MenuDetailSheet';
import { PersonalChallengeDetailSheet } from '../components/PersonalChallengeDetailSheet';
import {
    PersonalChallengeFormSheet,
    type PersonalChallengeCreateSeed,
} from '../components/PersonalChallengeFormSheet';
import { Toast } from '../components/Toast';
import { EXERCISES } from '../data/exercises';
import type { ExercisePlacement } from '../data/exercisePlacement';
import type { MenuGroup } from '../data/menuGroups';
import { getCustomGroups } from '../lib/customGroups';
import { getCustomExercises, type CustomExercise } from '../lib/db';
import { type PublicExercise } from '../lib/publicExercises';
import { type PublicMenu } from '../lib/publicMenus';
import {
    canDeletePersonalChallenge,
    deletePersonalChallenge,
    endPersonalChallenge,
} from '../lib/personalChallenges';
import type { TeacherExercise, TeacherMenu } from '../lib/teacherContent';
import { audio } from '../lib/audio';
import { haptics } from '../lib/haptics';
import { resolvePublicMenuToSessionPlannedItems } from '../lib/publicMenuUtils';
import { pickTeacherContentHighlights } from '../lib/teacherExerciseMetadata';
import { useAppStore } from '../store/useAppStore';
import type { FuwafuwaMilestoneEvent } from '../store/useAppStore';
import { useTeacherContent } from '../hooks/useTeacherContent';
import { HomeMilestoneModal } from './home/HomeMilestoneModal';
import { HomeAnimatedBackground } from './home/HomeAnimatedBackground';
import { FuwafuwaHomeCard } from './home/FuwafuwaHomeCard';
import { ChallengeHubSheet } from './home/ChallengeHubSheet';
import { HomeChallengesAndMenus } from './home/HomeChallengesAndMenus';
import { TeacherExerciseDetailSheet } from './home/TeacherExerciseDetailSheet';
import { TeacherMenuDetailSheet } from './home/TeacherMenuDetailSheet';
import {
    getFamilyHomeContextKey,
    getSoloHomeContextKey,
    type HomeAfterglow,
} from './home/homeAfterglow';
import { pickHomeAnnouncement } from './home/homeAnnouncementUtils';
import {
    getFamilyVisitMemoryKey,
    getHomeVisitRecency,
    type HomeVisitRecency,
} from './home/homeVisitMemory';
import { useHomeChallenges } from './home/hooks/useHomeChallenges';
import {
    usePersonalChallenges,
    type PersonalChallengeCompletionNotice,
    type PersonalChallengeProgressItem,
} from './home/hooks/usePersonalChallenges';
import { useHomeSessions } from './home/hooks/useHomeSessions';
import { useHomePublicDiscovery } from './home/hooks/useHomePublicDiscovery';
import {
    getMilestoneStage,
    useHomeMilestoneWatcher,
} from './home/hooks/useHomeMilestoneWatcher';
import { pickTeacherExerciseDiscovery } from './home/homeMenuUtils';
import { getMinClassLevel } from './menu/menuPageUtils';
import { findPersonalChallengePreset } from '../components/personal-challenge/shared';

const noop = () => {};

export const HomeScreen: React.FC = () => {
    const users = useAppStore((state) => state.users);
    const sessionUserIds = useAppStore((state) => state.sessionUserIds);
    const setSessionUserIds = useAppStore((state) => state.setSessionUserIds);
    const setTab = useAppStore((state) => state.setTab);
    const updateUser = useAppStore((state) => state.updateUser);
    const activeMilestoneModal = useAppStore((state) => state.activeMilestoneModal);
    const setActiveMilestoneModal = useAppStore((state) => state.setActiveMilestoneModal);
    const consumeUserMagicEnergy = useAppStore((state) => state.consumeUserMagicEnergy);
    const startSessionWithExercises = useAppStore((state) => state.startSessionWithExercises);
    const startSessionWithPlan = useAppStore((state) => state.startSessionWithPlan);
    const joinedChallengeIds = useAppStore((state) => state.joinedChallengeIds);
    const dismissedHomeAnnouncementIds = useAppStore((state) => state.dismissedHomeAnnouncementIds);
    const dismissHomeAnnouncement = useAppStore((state) => state.dismissHomeAnnouncement);
    const homeVisitMemory = useAppStore((state) => state.homeVisitMemory);
    const markSoloHomeVisit = useAppStore((state) => state.markSoloHomeVisit);
    const markFamilyHomeVisit = useAppStore((state) => state.markFamilyHomeVisit);
    const currentTab = useAppStore((state) => state.currentTab);

    const [menuBrowserOpen, setMenuBrowserOpen] = useState(false);
    const [exerciseBrowserOpen, setExerciseBrowserOpen] = useState(false);
    const [pendingMilestoneEvents, setPendingMilestoneEvents] = useState<FuwafuwaMilestoneEvent[]>([]);
    const [recentMilestoneEvent, setRecentMilestoneEvent] = useState<FuwafuwaMilestoneEvent | null>(null);
    const [recentAfterglow, setRecentAfterglow] = useState<HomeAfterglow | null>(null);
    const [activeMagicDeliveryContextKey, setActiveMagicDeliveryContextKey] = useState<string | null>(null);
    const [selectedUserVisitRecency, setSelectedUserVisitRecency] = useState<HomeVisitRecency>('first');
    const [familyVisitRecency, setFamilyVisitRecency] = useState<HomeVisitRecency>('first');
    const [selectedPublicMenu, setSelectedPublicMenu] = useState<PublicMenu | null>(null);
    const [selectedPublicExercise, setSelectedPublicExercise] = useState<PublicExercise | null>(null);
    const [selectedTeacherMenu, setSelectedTeacherMenu] = useState<TeacherMenu | null>(null);
    const [selectedTeacherExercise, setSelectedTeacherExercise] = useState<TeacherExercise | null>(null);
    const [challengeHubOpen, setChallengeHubOpen] = useState(false);
    const [selectedPersonalChallenge, setSelectedPersonalChallenge] = useState<PersonalChallengeProgressItem | null>(null);
    const [editingPersonalChallenge, setEditingPersonalChallenge] = useState<PersonalChallengeProgressItem | null>(null);
    const [personalChallengeSeed, setPersonalChallengeSeed] = useState<PersonalChallengeCreateSeed | null>(null);
    const [personalFormOpen, setPersonalFormOpen] = useState(false);
    const [personalChallengeToastMessage, setPersonalChallengeToastMessage] = useState<string | null>(null);
    const [personalChallengeDeleteOpen, setPersonalChallengeDeleteOpen] = useState(false);
    const [deletingPersonalChallenge, setDeletingPersonalChallenge] = useState(false);
    const [customChallengeExercises, setCustomChallengeExercises] = useState<CustomExercise[]>([]);
    const [customChallengeMenus, setCustomChallengeMenus] = useState<MenuGroup[]>([]);
    const lastSoloVisitKeyRef = useRef('');
    const lastFamilyVisitKeyRef = useRef('');
    const magicDeliveryTimerRef = useRef<number | null>(null);
    const currentTabRef = useRef(currentTab);

    const { allSessions, activeUsers, targetSeconds, perUserMagic, displaySeconds } = useHomeSessions({
        users,
        sessionUserIds,
    });
    const {
        recommendedMenus,
        recommendedExercises,
        ambientCue,
    } = useHomePublicDiscovery();

    useEffect(() => {
        currentTabRef.current = currentTab;
    }, [currentTab]);

    useEffect(() => {
        if (users.length === 0) {
            return;
        }

        if (sessionUserIds.length === 0) {
            setSessionUserIds([users[0].id]);
            return;
        }

        const userIdSet = new Set(users.map((user) => user.id));
        const validIds = sessionUserIds.filter((id) => userIdSet.has(id));
        if (validIds.length !== sessionUserIds.length) {
            setSessionUserIds(validIds.length > 0 ? validIds : [users[0].id]);
        }
    }, [users, sessionUserIds, setSessionUserIds]);

    const isTogetherMode = sessionUserIds.length > 1;
    const currentUsers = useMemo(
        () => users.filter((user) => sessionUserIds.includes(user.id)),
        [sessionUserIds, users],
    );
    const currentClassLevel = useMemo(
        () => getMinClassLevel(currentUsers),
        [currentUsers],
    );
    const selectedUser = useMemo(
        () => activeUsers[0] ?? users.find((user) => user.id === sessionUserIds[0]) ?? null,
        [activeUsers, sessionUserIds, users],
    );
    const familyVisitKey = useMemo(
        () => (isTogetherMode ? getFamilyVisitMemoryKey(currentUsers.map((user) => user.id)) : ''),
        [currentUsers, isTogetherMode],
    );
    const currentHomeContextKey = useMemo(
        () => (isTogetherMode
            ? getFamilyHomeContextKey(currentUsers.map((user) => user.id))
            : getSoloHomeContextKey(selectedUser?.id ?? sessionUserIds[0] ?? '')),
        [currentUsers, isTogetherMode, selectedUser?.id, sessionUserIds],
    );
    const activeMilestoneUser = useMemo(
        () => activeMilestoneModal
            ? users.find((user) => user.id === activeMilestoneModal.userId) ?? null
            : null,
        [activeMilestoneModal, users],
    );
    const pendingMilestoneEventsByUserId = useMemo(
        () => new Map(
            pendingMilestoneEvents.map((event) => [event.userId, event]),
        ),
        [pendingMilestoneEvents],
    );
    const teacherContent = useTeacherContent({
        classLevel: currentClassLevel,
        onLoadError: noop,
    });
    const teacherMenuHighlights = useMemo(
        () => pickTeacherContentHighlights(
            teacherContent.teacherMenus.filter((menu) => menu.displayMode === 'teacher_section'),
            2,
        ),
        [teacherContent.teacherMenus],
    );
    const teacherExerciseHighlight = useMemo(
        () => pickTeacherExerciseDiscovery(teacherContent.teacherExercises),
        [teacherContent.teacherExercises],
    );
    const teacherMenuExerciseMap = useMemo(() => {
        const map = new Map<string, {
            name: string;
            emoji: string;
            sec: number;
            placement: ExercisePlacement;
        }>();
        for (const exercise of EXERCISES) {
            map.set(exercise.id, {
                name: exercise.name,
                emoji: exercise.emoji,
                sec: exercise.sec,
                placement: exercise.placement,
            });
        }
        for (const exercise of teacherContent.teacherExercises) {
            map.set(exercise.id, {
                name: exercise.name,
                emoji: exercise.emoji,
                sec: exercise.sec,
                placement: exercise.placement,
            });
        }
        return map;
    }, [teacherContent.teacherExercises]);

    const {
        filteredChallenges,
        todayDoneChallenges,
        pastChallenges,
        completions,
        rewardGrants,
        teacherExercises,
        pastExpanded,
        setPastExpanded,
        loadChallenges,
    } = useHomeChallenges({
        users,
        sessionUserIds,
    });
    const {
        activeChallenges: personalActiveChallenges,
        todayDoneChallenges: personalTodayDoneChallenges,
        pastChallenges: personalPastChallenges,
        loading: personalChallengesLoading,
        reload: reloadPersonalChallenges,
    } = usePersonalChallenges({
        users,
        sessionUserIds,
        onChallengeCompleted: useCallback((notice: PersonalChallengeCompletionNotice) => {
            if (currentTabRef.current !== 'home') {
                return;
            }

            const resultLine = notice.rewardStars > 0
                ? `「${notice.title}」をクリアして ほしを1こ もらったよ`
                : `「${notice.title}」をクリアしたよ`;
            setPersonalChallengeToastMessage(
                notice.memberName
                    ? `${notice.memberName}が${resultLine}`
                    : resultLine,
            );
            haptics.success();
            audio.playSuccess();
            lazyConfetti().then((confetti) => confetti({
                particleCount: 36,
                spread: 64,
                startVelocity: 24,
                origin: { y: 0.78 },
                colors: ['#2BBAA0', '#A8E6CF', '#FFEAA7', '#FDCB6E'],
            }));
        }, []),
    });
    const loadCustomChallengeTargets = useCallback(async () => {
        const [menus, exercises] = await Promise.all([
            getCustomGroups(),
            getCustomExercises(),
        ]);
        setCustomChallengeMenus(menus);
        setCustomChallengeExercises(exercises);
    }, []);
    const activeAnnouncementUserIds = useMemo(
        () => (currentUsers.length > 0 ? currentUsers.map((user) => user.id) : sessionUserIds),
        [currentUsers, sessionUserIds],
    );
    const homeAnnouncement = useMemo(
        () => pickHomeAnnouncement({
            activeUserIds: activeAnnouncementUserIds,
            challenges: filteredChallenges,
            joinedChallengeIds,
            dismissedAnnouncementIds: dismissedHomeAnnouncementIds,
            teacherMenuHighlights,
            teacherExerciseHighlight,
            isNewTeacherContent: teacherContent.isNewTeacherContent,
        }),
        [
            activeAnnouncementUserIds,
            dismissedHomeAnnouncementIds,
            filteredChallenges,
            joinedChallengeIds,
            teacherContent.isNewTeacherContent,
            teacherExerciseHighlight,
            teacherMenuHighlights,
        ],
    );

    useEffect(() => {
        void loadCustomChallengeTargets();
    }, [loadCustomChallengeTargets]);

    const queueMilestoneEvent = useCallback((event: FuwafuwaMilestoneEvent) => {
        setPendingMilestoneEvents((current) => (
            current.some((item) => item.userId === event.userId && item.kind === event.kind)
                ? current
                : [...current, event]
        ));
    }, []);

    const hasKnownMilestoneEvent = useCallback((event: FuwafuwaMilestoneEvent) => (
        pendingMilestoneEvents.some((item) => item.userId === event.userId && item.kind === event.kind)
        || (activeMilestoneModal?.userId === event.userId && activeMilestoneModal.kind === event.kind)
    ), [activeMilestoneModal, pendingMilestoneEvents]);

    useHomeMilestoneWatcher({
        allSessions,
        hasKnownMilestoneEvent,
        queueMilestoneEvent,
        users,
    });

    useEffect(() => {
        const validUserIds = new Set(users.map((user) => user.id));
        setPendingMilestoneEvents((current) => current.filter((event) => validUserIds.has(event.userId)));
    }, [users]);

    useEffect(() => {
        if (!recentMilestoneEvent) {
            return;
        }

        const timerId = window.setTimeout(() => {
            setRecentMilestoneEvent((current) => (
                current?.userId === recentMilestoneEvent.userId && current.kind === recentMilestoneEvent.kind
                    ? null
                    : current
            ));
        }, 12000);

        return () => window.clearTimeout(timerId);
    }, [recentMilestoneEvent]);

    useEffect(() => {
        if (!recentAfterglow) {
            return;
        }

        const timerId = window.setTimeout(() => {
            setRecentAfterglow((current) => (
                current?.kind === recentAfterglow.kind && current.contextKey === recentAfterglow.contextKey
                    ? null
                    : current
            ));
        }, 10000);

        return () => window.clearTimeout(timerId);
    }, [recentAfterglow]);

    useEffect(() => {
        return () => {
            if (magicDeliveryTimerRef.current !== null) {
                window.clearTimeout(magicDeliveryTimerRef.current);
                magicDeliveryTimerRef.current = null;
            }
        };
    }, []);

    useEffect(() => {
        if (isTogetherMode || !selectedUser) {
            lastSoloVisitKeyRef.current = '';
            setSelectedUserVisitRecency('first');
            return;
        }

        const visitKey = selectedUser.id;
        if (lastSoloVisitKeyRef.current === visitKey) {
            return;
        }

        lastSoloVisitKeyRef.current = visitKey;
        setSelectedUserVisitRecency(
            getHomeVisitRecency(homeVisitMemory.soloByUserId[visitKey] ?? null),
        );
        markSoloHomeVisit(visitKey, new Date().toISOString());
    }, [homeVisitMemory.soloByUserId, isTogetherMode, markSoloHomeVisit, selectedUser]);

    useEffect(() => {
        if (!isTogetherMode || familyVisitKey.length === 0) {
            lastFamilyVisitKeyRef.current = '';
            setFamilyVisitRecency('first');
            return;
        }

        if (lastFamilyVisitKeyRef.current === familyVisitKey) {
            return;
        }

        lastFamilyVisitKeyRef.current = familyVisitKey;
        setFamilyVisitRecency(
            getHomeVisitRecency(homeVisitMemory.familyByUserSet[familyVisitKey] ?? null),
        );
        markFamilyHomeVisit(currentUsers.map((user) => user.id), new Date().toISOString());
    }, [currentUsers, familyVisitKey, homeVisitMemory.familyByUserSet, isTogetherMode, markFamilyHomeVisit]);

    useEffect(() => {
        if (isTogetherMode || !selectedUser || activeMilestoneModal) {
            return;
        }

        const nextEvent = pendingMilestoneEvents.find((event) => event.userId === selectedUser.id);
        if (!nextEvent) {
            return;
        }

        setPendingMilestoneEvents((current) => current.filter(
            (event) => !(event.userId === nextEvent.userId && event.kind === nextEvent.kind),
        ));
        setActiveMilestoneModal(nextEvent);
    }, [activeMilestoneModal, isTogetherMode, pendingMilestoneEvents, selectedUser, setActiveMilestoneModal]);

    const handleMilestoneModalClose = useCallback(() => {
        if (activeMilestoneModal?.source === 'system' && activeMilestoneUser) {
            const stage = getMilestoneStage(activeMilestoneModal.kind);
            if (!(activeMilestoneUser.notifiedFuwafuwaStages || []).includes(stage)) {
                updateUser(activeMilestoneUser.id, {
                    notifiedFuwafuwaStages: [...(activeMilestoneUser.notifiedFuwafuwaStages || []), stage],
                });
            }
        }

        if (activeMilestoneModal) {
            setRecentMilestoneEvent(activeMilestoneModal);
        }
        setActiveMilestoneModal(null);
    }, [activeMilestoneModal, activeMilestoneUser, setActiveMilestoneModal, updateUser]);

    useEffect(() => {
        if (
            currentTab === 'menu'
            && homeAnnouncement
            && (homeAnnouncement.kind === 'teacher_menu' || homeAnnouncement.kind === 'teacher_exercise')
        ) {
            dismissHomeAnnouncement(homeAnnouncement.id);
        }
    }, [currentTab, dismissHomeAnnouncement, homeAnnouncement]);

    const handleTankReset = () => {
        if (displaySeconds < targetSeconds || magicDeliveryTimerRef.current !== null) {
            return;
        }

        const deliveryContextKey = currentHomeContextKey;
        const deliveryTargets = activeUsers.map((user) => ({
            userId: user.id,
            targetSeconds: (user.dailyTargetMinutes || 10) * 60,
        }));

        if (deliveryContextKey) {
            setActiveMagicDeliveryContextKey(deliveryContextKey);
        }

        const duration = 3000;
        const end = Date.now() + duration;

        lazyConfetti().then((confetti) => {
            const frame = () => {
                confetti({
                    particleCount: 5,
                    angle: 60,
                    spread: 55,
                    origin: { x: 0 },
                    colors: ['#2BBAA0', '#A8E6CF', '#FFEAA7', '#FDCB6E'],
                });
                confetti({
                    particleCount: 5,
                    angle: 120,
                    spread: 55,
                    origin: { x: 1 },
                    colors: ['#2BBAA0', '#A8E6CF', '#FFEAA7', '#FDCB6E'],
                });

                if (Date.now() < end) {
                    requestAnimationFrame(frame);
                }
            };

            frame();
        });
        audio.playSuccess();

        magicDeliveryTimerRef.current = window.setTimeout(() => {
            deliveryTargets.forEach((target) => {
                consumeUserMagicEnergy(target.userId, target.targetSeconds);
            });

            if (deliveryContextKey) {
                setRecentAfterglow({
                    kind: 'magic_delivery',
                    contextKey: deliveryContextKey,
                });
            }

            setActiveMagicDeliveryContextKey((current) => (
                current === deliveryContextKey ? null : current
            ));
            magicDeliveryTimerRef.current = null;
        }, 900);
    };

    const canCreatePersonalChallenge = !isTogetherMode && Boolean(selectedUser);
    const personalChallengeFormMember = editingPersonalChallenge?.owner ?? selectedUser;

    const handleOpenPersonalChallenge = useCallback((item: PersonalChallengeProgressItem) => {
        setSelectedPersonalChallenge(item);
    }, []);

    const openPersonalChallengeForm = useCallback((seed: PersonalChallengeCreateSeed | null = null) => {
        setChallengeHubOpen(false);
        setSelectedPersonalChallenge(null);
        setEditingPersonalChallenge(null);
        setPersonalChallengeSeed(seed);
        setPersonalFormOpen(true);
    }, []);

    const handleCreatePersonalChallenge = useCallback(() => {
        openPersonalChallengeForm(null);
    }, [openPersonalChallengeForm]);

    const handleCreatePersonalChallengeFromPublicMenu = useCallback(async (seed: PersonalChallengeCreateSeed) => {
        await loadCustomChallengeTargets();
        setSelectedPublicMenu(null);
        openPersonalChallengeForm(seed);
    }, [loadCustomChallengeTargets, openPersonalChallengeForm]);

    const handleCreatePersonalChallengeFromPublicExercise = useCallback(async (seed: PersonalChallengeCreateSeed) => {
        await loadCustomChallengeTargets();
        setSelectedPublicExercise(null);
        openPersonalChallengeForm(seed);
    }, [loadCustomChallengeTargets, openPersonalChallengeForm]);

    const handleCreatePersonalChallengeFromTeacherMenu = useCallback((menu: TeacherMenu) => {
        setSelectedTeacherMenu(null);
        openPersonalChallengeForm({
            challengeType: 'menu',
            menuSource: 'teacher',
            targetMenuId: menu.id,
            description: menu.description ?? '',
            iconEmoji: menu.emoji,
        });
    }, [openPersonalChallengeForm]);

    const handleCreatePersonalChallengeFromTeacherExercise = useCallback((exercise: TeacherExercise) => {
        setSelectedTeacherExercise(null);
        openPersonalChallengeForm({
            challengeType: 'exercise',
            exerciseSource: 'teacher',
            exerciseId: exercise.id,
            description: exercise.description ?? '',
            iconEmoji: exercise.emoji,
        });
    }, [openPersonalChallengeForm]);

    const handleEditPersonalChallenge = useCallback(() => {
        if (!selectedPersonalChallenge) {
            return;
        }

        setEditingPersonalChallenge(selectedPersonalChallenge);
        setSelectedPersonalChallenge(null);
        setChallengeHubOpen(false);
        setPersonalChallengeSeed(null);
        setPersonalFormOpen(true);
    }, [selectedPersonalChallenge]);

    const handleRetryPersonalChallenge = useCallback(async () => {
        if (!selectedPersonalChallenge) {
            return;
        }

        const { challenge } = selectedPersonalChallenge;
        const presetId = findPersonalChallengePreset(challenge) ?? 'week';

        if (
            challenge.challengeType === 'menu'
            || customChallengeExercises.some((exercise) => exercise.id === challenge.exerciseId)
        ) {
            await loadCustomChallengeTargets();
        }

        openPersonalChallengeForm({
            challengeType: challenge.challengeType === 'menu' ? 'menu' : 'exercise',
            presetId,
            exerciseSource: challenge.challengeType === 'exercise'
                ? (
                    teacherContent.teacherExercises.some((exercise) => exercise.id === challenge.exerciseId)
                        ? 'teacher'
                        : customChallengeExercises.some((exercise) => exercise.id === challenge.exerciseId)
                            ? 'custom'
                            : 'standard'
                )
                : undefined,
            menuSource: challenge.challengeType === 'menu'
                ? (
                    challenge.menuSource === 'teacher'
                        ? 'teacher'
                        : challenge.menuSource === 'custom'
                            ? 'custom'
                            : 'preset'
                )
                : undefined,
            exerciseId: challenge.exerciseId,
            targetMenuId: challenge.targetMenuId,
            title: challenge.title,
            description: challenge.description ?? '',
            iconEmoji: challenge.iconEmoji ?? '',
        });
    }, [
        customChallengeExercises,
        loadCustomChallengeTargets,
        openPersonalChallengeForm,
        selectedPersonalChallenge,
        teacherContent.teacherExercises,
    ]);

    const handleEndPersonalChallenge = useCallback(async () => {
        if (!selectedPersonalChallenge) {
            return;
        }

        try {
            await endPersonalChallenge(selectedPersonalChallenge.challenge.id, 'manual');
            setSelectedPersonalChallenge(null);
            reloadPersonalChallenges();
        } catch (error) {
            console.warn('[personalChallenges] manual end failed:', error);
        }
    }, [reloadPersonalChallenges, selectedPersonalChallenge]);

    const handlePromptDeletePersonalChallenge = useCallback(() => {
        if (!selectedPersonalChallenge) {
            return;
        }
        setPersonalChallengeDeleteOpen(true);
    }, [selectedPersonalChallenge]);

    const handleDeletePersonalChallenge = useCallback(async () => {
        if (!selectedPersonalChallenge) {
            return;
        }
        if (!canDeletePersonalChallenge(selectedPersonalChallenge.challenge, selectedPersonalChallenge.progress)) {
            setPersonalChallengeDeleteOpen(false);
            return;
        }

        setDeletingPersonalChallenge(true);
        try {
            await deletePersonalChallenge(selectedPersonalChallenge.challenge.id);
            setPersonalChallengeDeleteOpen(false);
            setSelectedPersonalChallenge(null);
            reloadPersonalChallenges();
        } catch (error) {
            console.warn('[personalChallenges] delete failed:', error);
        } finally {
            setDeletingPersonalChallenge(false);
        }
    }, [reloadPersonalChallenges, selectedPersonalChallenge]);

    return (
        <div
            style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                overflow: 'hidden',
            }}
        >
            <HomeMilestoneModal
                activeMilestoneModal={activeMilestoneModal}
                user={activeMilestoneUser}
                onClose={handleMilestoneModalClose}
            />

            <HomeAnimatedBackground />

            <ScreenScaffold
                header={<PageHeader title="ホーム" rightElement={<CurrentContextBadge />} />}
                withBottomNav
                style={{ position: 'relative', zIndex: 1 }}
                contentStyle={{
                    position: 'relative',
                    zIndex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    width: '100%',
                    paddingTop: 12,
                }}
            >
                <FuwafuwaHomeCard
                    isTogetherMode={isTogetherMode}
                    perUserMagic={perUserMagic}
                    displaySeconds={displaySeconds}
                    targetSeconds={targetSeconds}
                    isMagicDeliveryActive={activeMagicDeliveryContextKey === currentHomeContextKey}
                    onTankReset={handleTankReset}
                    selectedUser={selectedUser}
                    activeUsers={activeUsers}
                    allSessions={allSessions}
                    milestoneEventsByUserId={pendingMilestoneEventsByUserId}
                    recentMilestoneEvent={selectedUser && recentMilestoneEvent?.userId === selectedUser.id ? recentMilestoneEvent : null}
                    recentAfterglow={recentAfterglow}
                    onSelectUser={(userId) => setSessionUserIds([userId])}
                    announcement={homeAnnouncement}
                    ambientCue={ambientCue}
                    familyVisitRecency={familyVisitRecency}
                    selectedUserVisitRecency={selectedUserVisitRecency}
                    onAnnouncementAction={() => {
                        if (!homeAnnouncement) {
                            return;
                        }

                        if (currentHomeContextKey) {
                            setRecentAfterglow({
                                kind: 'announcement',
                                contextKey: currentHomeContextKey,
                                announcement: homeAnnouncement,
                            });
                        }

                        dismissHomeAnnouncement(homeAnnouncement.id);

                        if (homeAnnouncement.kind === 'challenge') {
                            document.getElementById('home-challenges-section')?.scrollIntoView({
                                behavior: 'smooth',
                                block: 'start',
                            });
                            return;
                        }

                        setTab('menu');
                    }}
                />

                <HomeChallengesAndMenus
                    showChallengeSection={Boolean(selectedUser)}
                    filteredChallenges={filteredChallenges}
                    todayDoneChallenges={todayDoneChallenges}
                    pastChallenges={pastChallenges}
                    personalActiveChallenges={personalActiveChallenges.slice(0, 2)}
                personalTodayDoneChallenges={personalTodayDoneChallenges.slice(0, 2)}
                personalPastChallenges={personalPastChallenges.slice(0, 2)}
                completions={completions}
                rewardGrants={rewardGrants}
                recommendedMenus={recommendedMenus}
                recommendedExercises={recommendedExercises}
                teacherExercises={teacherExercises}
                teacherMenus={teacherContent.teacherMenus}
                customChallengeExercises={customChallengeExercises}
                customChallengeMenus={customChallengeMenus}
                teacherMenuHighlights={teacherMenuHighlights}
                teacherExerciseHighlight={teacherExerciseHighlight}
                teacherMenuExerciseMap={teacherMenuExerciseMap}
                    isNewTeacherContent={teacherContent.isNewTeacherContent}
                    pastExpanded={pastExpanded}
                    onTogglePastExpanded={() => setPastExpanded((previous) => !previous)}
                    onChallengesUpdated={loadChallenges}
                    onOpenChallengeHub={() => setChallengeHubOpen(true)}
                    onOpenPersonalChallenge={handleOpenPersonalChallenge}
                    onCreatePersonalChallenge={handleCreatePersonalChallenge}
                    onOpenMenuBrowser={() => setMenuBrowserOpen(true)}
                    onOpenExerciseBrowser={() => setExerciseBrowserOpen(true)}
                    onOpenMenuTab={() => setTab('menu')}
                    onTeacherMenuPreview={setSelectedTeacherMenu}
                    onTeacherExercisePreview={setSelectedTeacherExercise}
                    onTeacherMenuStart={(menu) => {
                        startSessionWithExercises(menu.exerciseIds, {
                            sourceMenuId: menu.id,
                            sourceMenuSource: 'teacher',
                            sourceMenuName: menu.name,
                        });
                    }}
                    onMenuTap={setSelectedPublicMenu}
                    onExerciseTap={setSelectedPublicExercise}
                />
            </ScreenScaffold>

            <ChallengeHubSheet
                open={challengeHubOpen}
                onClose={() => setChallengeHubOpen(false)}
                teacherActiveChallenges={filteredChallenges}
                teacherTodayDoneChallenges={todayDoneChallenges}
                teacherPastChallenges={pastChallenges}
                completions={completions}
                rewardGrants={rewardGrants}
                teacherExercises={teacherExercises}
                teacherMenus={teacherContent.teacherMenus}
                customExercises={customChallengeExercises}
                customMenus={customChallengeMenus}
                personalActiveChallenges={personalActiveChallenges}
                personalTodayDoneChallenges={personalTodayDoneChallenges}
                personalPastChallenges={personalPastChallenges}
                personalLoading={personalChallengesLoading}
                canCreatePersonalChallenge={canCreatePersonalChallenge}
                onCreatePersonalChallenge={handleCreatePersonalChallenge}
                onOpenPersonalChallenge={handleOpenPersonalChallenge}
                onTeacherChallengesUpdated={loadChallenges}
            />

            <PersonalChallengeDetailSheet
                open={selectedPersonalChallenge !== null}
                item={selectedPersonalChallenge}
                teacherExercises={teacherContent.teacherExercises}
                teacherMenus={teacherContent.teacherMenus}
                customExercises={customChallengeExercises}
                customMenus={customChallengeMenus}
                onClose={() => setSelectedPersonalChallenge(null)}
                onEdit={handleEditPersonalChallenge}
                onEnd={handleEndPersonalChallenge}
                onDelete={handlePromptDeletePersonalChallenge}
                onRetry={handleRetryPersonalChallenge}
            />

            <ConfirmDeleteModal
                open={personalChallengeDeleteOpen}
                title="じぶんチャレンジを削除"
                message={`「${selectedPersonalChallenge?.challenge.title ?? ''}」を削除しますか？まだ進んでいないチャレンジだけ削除できます。`}
                onCancel={() => {
                    if (deletingPersonalChallenge) {
                        return;
                    }
                    setPersonalChallengeDeleteOpen(false);
                }}
                onConfirm={handleDeletePersonalChallenge}
                loading={deletingPersonalChallenge}
            />

            <PersonalChallengeFormSheet
                open={personalFormOpen}
                member={personalChallengeFormMember}
                teacherExercises={teacherContent.teacherExercises}
                teacherMenus={teacherContent.teacherMenus}
                customExercises={customChallengeExercises}
                customMenus={customChallengeMenus}
                initialItem={editingPersonalChallenge}
                initialSeed={personalChallengeSeed}
                onClose={() => {
                    setPersonalFormOpen(false);
                    setEditingPersonalChallenge(null);
                    setPersonalChallengeSeed(null);
                }}
                onSaved={() => {
                    reloadPersonalChallenges();
                    setEditingPersonalChallenge(null);
                    setPersonalChallengeSeed(null);
                }}
            />

            <PublicMenuBrowser
                open={menuBrowserOpen}
                onClose={() => setMenuBrowserOpen(false)}
            />

            <TeacherMenuDetailSheet
                menu={selectedTeacherMenu}
                exerciseMap={teacherMenuExerciseMap}
                onClose={() => setSelectedTeacherMenu(null)}
                onOpenMenuTab={() => setTab('menu')}
                onCreatePersonalChallenge={canCreatePersonalChallenge ? handleCreatePersonalChallengeFromTeacherMenu : undefined}
                onStart={(menu) => {
                    startSessionWithExercises(menu.exerciseIds, {
                        sourceMenuId: menu.id,
                        sourceMenuSource: 'teacher',
                        sourceMenuName: menu.name,
                    });
                }}
            />

            <TeacherExerciseDetailSheet
                exercise={selectedTeacherExercise}
                onClose={() => setSelectedTeacherExercise(null)}
                onOpenMenuTab={() => setTab('menu')}
                onCreatePersonalChallenge={canCreatePersonalChallenge ? handleCreatePersonalChallengeFromTeacherExercise : undefined}
                onStart={(exercise) => {
                    startSessionWithExercises([exercise.id]);
                }}
            />

            <PublicExerciseBrowser
                open={exerciseBrowserOpen}
                onClose={() => setExerciseBrowserOpen(false)}
            />

            <MenuDetailSheet
                menu={selectedPublicMenu}
                onClose={() => setSelectedPublicMenu(null)}
                onImported={() => {
                    void loadCustomChallengeTargets();
                }}
                onCreatePersonalChallenge={handleCreatePersonalChallengeFromPublicMenu}
                onTry={(menu, metadata) => {
                    setSelectedPublicMenu(null);
                    startSessionWithPlan(resolvePublicMenuToSessionPlannedItems(menu), {
                        sourceMenuId: metadata.menuId,
                        sourceMenuSource: metadata.menuSource,
                        sourceMenuName: metadata.menuName,
                    });
                }}
            />

            <ExerciseDetailSheet
                exercise={selectedPublicExercise}
                onClose={() => setSelectedPublicExercise(null)}
                onImported={() => {
                    void loadCustomChallengeTargets();
                }}
                onCreatePersonalChallenge={handleCreatePersonalChallengeFromPublicExercise}
                onTry={(exerciseId) => {
                    setSelectedPublicExercise(null);
                    startSessionWithExercises([exerciseId]);
                }}
            />

            <Toast
                message={personalChallengeToastMessage}
                onClose={() => setPersonalChallengeToastMessage(null)}
            />
        </div>
    );
};
