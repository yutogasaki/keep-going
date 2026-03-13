import type { ExercisePlacement } from '../../../data/exercisePlacement';
import type { MenuGroup } from '../../../data/menuGroups';
import type { PublicMenu } from '../../../lib/publicMenus';

export interface MenuGroupTabProps {
    exerciseMap: Map<string, { name: string; emoji: string; sec: number; placement: ExercisePlacement }>;
    isTogetherMode: boolean;
    dailyTargetMinutes: number;
    effectiveRequiredCount: number;
    effectiveExcludedCount: number;
    presets: MenuGroup[];
    customGroups: MenuGroup[];
    sessionUserCount: number;
    getCreatorName: (creatorId?: string) => string | null;
    onOpenCustomMenu: () => void;
    onGroupTap: (group: MenuGroup) => void;
    onEditGroup: (group: MenuGroup) => void;
    onDeleteGroup: (id: string) => void;
    onCreateGroup: () => void;
    canPublish: boolean;
    onPublishGroup: (group: MenuGroup) => void;
    onUnpublishGroup: (group: MenuGroup) => void;
    findPublishedMenu: (group: MenuGroup) => PublicMenu | undefined;
    onOpenPublicBrowser: () => void;
    teacherMenuIds?: Set<string>;
    isNewTeacherContent?: (id: string) => boolean;
}
