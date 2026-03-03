import type { UserProfileStore } from '../../store/useAppStore';

export type SwipePage =
    | { kind: 'user'; id: string; name: string; user: UserProfileStore }
    | { kind: 'together'; id: 'TOGETHER'; name: 'みんなで！' };

export interface PerUserMagic {
    userId: string;
    userName: string;
    displaySeconds: number;
    targetSeconds: number;
}
