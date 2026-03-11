import type { HomeAnnouncement } from './homeAnnouncementUtils';
import { getFamilyVisitMemoryKey } from './homeVisitMemory';

export interface AnnouncementAfterglow {
    kind: 'announcement';
    contextKey: string;
    announcement: HomeAnnouncement;
}

export interface MagicDeliveryAfterglow {
    kind: 'magic_delivery';
    contextKey: string;
}

export type HomeAfterglow = AnnouncementAfterglow | MagicDeliveryAfterglow;

export function getSoloHomeContextKey(userId: string | null | undefined): string {
    return userId ? `solo:${userId}` : '';
}

export function getFamilyHomeContextKey(userIds: string[]): string {
    const familyKey = getFamilyVisitMemoryKey(userIds);
    return familyKey ? `family:${familyKey}` : '';
}
