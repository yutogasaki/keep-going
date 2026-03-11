import React, { useMemo } from 'react';
import type { ExercisePlacement } from '../../../data/exercisePlacement';
import type { MenuGroup } from '../../../data/menuGroups';
import type { PublicMenu } from '../../../lib/publicMenus';
import { GroupCard } from '../GroupCard';
import { CreateGroupCard } from './CreateGroupCard';
import { CollapsibleSectionHeader } from '../shared/CollapsibleSectionHeader';

interface CustomGroupsSectionProps {
    groups: MenuGroup[];
    exerciseMap: Map<string, { name: string; emoji: string; sec: number; placement: ExercisePlacement }>;
    sessionUserCount: number;
    canPublish: boolean;
    getCreatorName: (creatorId?: string) => string | null;
    findPublishedMenu: (group: MenuGroup) => PublicMenu | undefined;
    onTap: (group: MenuGroup) => void;
    onEdit: (group: MenuGroup) => void;
    onDelete: (groupId: string) => void;
    onPublish: (group: MenuGroup) => void;
    onUnpublish: (group: MenuGroup) => void;
    onCreate: () => void;
    expanded: boolean;
    onToggle: () => void;
}

export const CustomGroupsSection: React.FC<CustomGroupsSectionProps> = ({
    groups,
    exerciseMap,
    sessionUserCount,
    canPublish,
    getCreatorName,
    findPublishedMenu,
    onTap,
    onEdit,
    onDelete,
    onPublish,
    onUnpublish,
    onCreate,
    expanded,
    onToggle,
}) => {
    const hasGroups = groups.length > 0;
    const publishedCount = useMemo(
        () => groups.filter((group) => Boolean(findPublishedMenu(group))).length,
        [findPublishedMenu, groups],
    );
    const summary = publishedCount > 0 ? `公開中${publishedCount}` : undefined;

    return (
        <section>
            {hasGroups ? (
                <div style={{ marginBottom: 10 }}>
                    <CollapsibleSectionHeader
                        title="じぶんのメニュー"
                        count={groups.length}
                        summary={summary}
                        expanded={expanded}
                        onToggle={onToggle}
                    />
                </div>
            ) : (
                <h2 style={{
                    fontFamily: "'Noto Sans JP', sans-serif",
                    fontSize: 13,
                    fontWeight: 700,
                    color: '#8395A7',
                    marginBottom: 10,
                    letterSpacing: 1,
                }}>
                    じぶんのメニュー
                </h2>
            )}

            {hasGroups && expanded ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 10 }}>
                    {groups.map((group, index) => {
                        const published = findPublishedMenu(group);
                        return (
                            <GroupCard
                                key={group.id}
                                group={group}
                                index={index}
                                exerciseMap={exerciseMap}
                                creatorName={sessionUserCount > 1 ? getCreatorName(group.creatorId) : undefined}
                                onTap={() => onTap(group)}
                                onEdit={() => onEdit(group)}
                                onDelete={() => onDelete(group.id)}
                                onPublish={canPublish ? () => onPublish(group) : undefined}
                                onUnpublish={() => onUnpublish(group)}
                                isCustom
                                isPublished={!!published}
                                downloadCount={published?.downloadCount}
                            />
                        );
                    })}
                </div>
            ) : null}

            {expanded ? <CreateGroupCard hasGroups={groups.length > 0} onCreate={onCreate} /> : null}
        </section>
    );
};
