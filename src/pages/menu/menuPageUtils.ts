import type { ClassLevel } from '../../data/exercises';
import type { UserProfileStore } from '../../store/useAppStore';

const CLASS_LEVEL_WEIGHTS: Record<ClassLevel | 'その他', number> = {
    プレ: 0,
    初級: 1,
    中級: 2,
    上級: 3,
    その他: 1,
};

export function getMinClassLevel(users: UserProfileStore[]): ClassLevel {
    if (users.length === 0) {
        return '初級';
    }

    return users.reduce((minClassLevel, user) => {
        const userWeight = CLASS_LEVEL_WEIGHTS[user.classLevel] ?? CLASS_LEVEL_WEIGHTS['その他'];
        const minWeight = CLASS_LEVEL_WEIGHTS[minClassLevel] ?? CLASS_LEVEL_WEIGHTS['その他'];
        return userWeight < minWeight ? user.classLevel : minClassLevel;
    }, users[0].classLevel);
}

export function getCreatorNameById(users: UserProfileStore[], creatorId?: string): string | null {
    if (!creatorId) {
        return null;
    }
    const user = users.find((targetUser) => targetUser.id === creatorId);
    return user ? user.name : null;
}
