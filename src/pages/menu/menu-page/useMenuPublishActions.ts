import { useCallback, useEffect, useState } from 'react';
import type { MenuGroup } from '../../../data/menuGroups';
import type { CustomExercise } from '../../../lib/db';
import { getAccountId } from '../../../lib/sync';
import {
    fetchMyPublishedMenus,
    publishMenu,
    type PublicMenu,
    unpublishMenu,
} from '../../../lib/publicMenus';
import {
    fetchMyPublishedExercises,
    publishExercise,
    type PublicExercise,
    unpublishExercise,
} from '../../../lib/publicExercises';
import type { MenuToastMessage } from './shared';

interface UseMenuPublishActionsParams {
    authorName: string;
    onToast: (toast: MenuToastMessage) => void;
}

export function useMenuPublishActions({
    authorName,
    onToast,
}: UseMenuPublishActionsParams) {
    const [myPublishedMenus, setMyPublishedMenus] = useState<PublicMenu[]>([]);
    const [myPublishedExercises, setMyPublishedExercises] = useState<PublicExercise[]>([]);

    const canPublish = Boolean(getAccountId());

    const refreshPublishedData = useCallback(async () => {
        if (!getAccountId()) {
            setMyPublishedMenus([]);
            setMyPublishedExercises([]);
            return;
        }

        try {
            const [menus, exercises] = await Promise.all([
                fetchMyPublishedMenus(),
                fetchMyPublishedExercises(),
            ]);
            setMyPublishedMenus(menus);
            setMyPublishedExercises(exercises);
        } catch (error) {
            console.warn('[menu] failed to load published data:', error);
        }
    }, []);

    useEffect(() => {
        void refreshPublishedData();
    }, [refreshPublishedData]);

    const findPublishedMenu = useCallback((group: MenuGroup): PublicMenu | undefined => {
        return myPublishedMenus.find(
            (publishedMenu) => publishedMenu.name === group.name
                && publishedMenu.exerciseIds.join(',') === group.exerciseIds.join(','),
        );
    }, [myPublishedMenus]);

    const findPublishedExercise = useCallback((exercise: CustomExercise): PublicExercise | undefined => {
        return myPublishedExercises.find(
            (publishedExercise) => publishedExercise.name === exercise.name
                && publishedExercise.emoji === exercise.emoji
                && publishedExercise.sec === exercise.sec,
        );
    }, [myPublishedExercises]);

    const handlePublishGroup = useCallback(async (group: MenuGroup) => {
        if (!getAccountId()) {
            return;
        }

        try {
            await publishMenu(group, authorName);
            onToast({ text: 'メニューを公開しました！', type: 'success' });
            await refreshPublishedData();
        } catch (error) {
            console.warn('[menu] publish failed:', error);
            onToast({ text: '公開に失敗しました', type: 'error' });
        }
    }, [authorName, onToast, refreshPublishedData]);

    const handleUnpublishGroup = useCallback(async (group: MenuGroup) => {
        const publishedMenu = findPublishedMenu(group);
        if (!publishedMenu) {
            return;
        }

        try {
            await unpublishMenu(publishedMenu.id);
            onToast({ text: 'メニューを非公開にしました', type: 'success' });
            await refreshPublishedData();
        } catch (error) {
            console.warn('[menu] unpublish failed:', error);
            onToast({ text: '非公開に失敗しました', type: 'error' });
        }
    }, [findPublishedMenu, onToast, refreshPublishedData]);

    const handlePublishExercise = useCallback(async (exercise: CustomExercise) => {
        if (!getAccountId()) {
            return;
        }

        try {
            await publishExercise(exercise, authorName);
            onToast({ text: '種目を公開しました！', type: 'success' });
            await refreshPublishedData();
        } catch (error) {
            console.warn('[menu] exercise publish failed:', error);
            onToast({ text: '公開に失敗しました', type: 'error' });
        }
    }, [authorName, onToast, refreshPublishedData]);

    const handleUnpublishExercise = useCallback(async (exercise: CustomExercise) => {
        const publishedExercise = findPublishedExercise(exercise);
        if (!publishedExercise) {
            return;
        }

        try {
            await unpublishExercise(publishedExercise.id);
            onToast({ text: '種目を非公開にしました', type: 'success' });
            await refreshPublishedData();
        } catch (error) {
            console.warn('[menu] exercise unpublish failed:', error);
            onToast({ text: '非公開に失敗しました', type: 'error' });
        }
    }, [findPublishedExercise, onToast, refreshPublishedData]);

    return {
        canPublish,
        myPublishedMenus,
        myPublishedExercises,
        refreshPublishedData,
        findPublishedMenu,
        findPublishedExercise,
        handlePublishGroup,
        handleUnpublishGroup,
        handlePublishExercise,
        handleUnpublishExercise,
    };
}
