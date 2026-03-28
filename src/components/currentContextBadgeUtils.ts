import type { UserProfileStore } from '../store/use-app-store/types';

export interface ContextOption {
    id: string;
    label: string;
    type: 'user' | 'together';
    userIds: string[];
    avatarUrl?: string;
    subLabel: string;
    impactLabel: string;
}

export const TOGETHER_ID = 'TOGETHER';

export function buildContextOptions(users: UserProfileStore[]): ContextOption[] {
    const userOptions: ContextOption[] = users.map((user) => ({
        id: user.id,
        label: user.name,
        type: 'user',
        userIds: [user.id],
        avatarUrl: user.avatarUrl,
        subLabel: `${user.classLevel}クラス`,
        impactLabel: `${user.name} の ホーム・きろく・メニューを見ます`,
    }));

    if (users.length >= 2) {
        userOptions.push({
            id: TOGETHER_ID,
            label: 'みんなで！',
            type: 'together',
            userIds: users.map((user) => user.id),
            subLabel: `${users.length}人の進みぐあい`,
            impactLabel: '家族みんなの 合計や まとまりを見ます',
        });
    }

    return userOptions;
}

export function getSelectedContextOption({
    options,
    sessionUserIds,
    users,
}: {
    options: ContextOption[];
    sessionUserIds: string[];
    users: UserProfileStore[];
}): ContextOption | null {
    if (sessionUserIds.length > 1) {
        return options.find((option) => option.id === TOGETHER_ID) ?? null;
    }

    const selectedUserId = sessionUserIds[0] ?? users[0]?.id;
    if (!selectedUserId) {
        return null;
    }

    return options.find((option) => option.id === selectedUserId) ?? null;
}

export function getContextHeaderStatus(option: ContextOption): string {
    return option.type === 'together'
        ? `家族${option.userIds.length}人を表示中`
        : '個人を表示中';
}

export function getContextScopeSummary(option: ContextOption): string {
    return option.type === 'together'
        ? 'ホーム・きろく・メニューで、家族みんなのまとまりを見ています'
        : `ホーム・きろく・メニューで、${option.label} を見ています`;
}
