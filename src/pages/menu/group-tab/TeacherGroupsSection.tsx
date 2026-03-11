import React, { useMemo } from 'react';
import type { ExercisePlacement } from '../../../data/exercisePlacement';
import type { MenuGroup } from '../../../data/menuGroups';
import { GroupCard } from '../GroupCard';
import { CollapsibleSectionHeader } from '../shared/CollapsibleSectionHeader';

interface TeacherGroupsSectionProps {
    groups: MenuGroup[];
    exerciseMap: Map<string, { name: string; emoji: string; sec: number; placement: ExercisePlacement }>;
    onTap: (group: MenuGroup) => void;
    isNewTeacherContent?: (id: string) => boolean;
    expanded: boolean;
    onToggle: () => void;
}

export const TeacherGroupsSection: React.FC<TeacherGroupsSectionProps> = ({
    groups,
    exerciseMap,
    onTap,
    isNewTeacherContent,
    expanded,
    onToggle,
}) => {
    const hasGroups = groups.length > 0;
    const recommendedCount = useMemo(
        () => groups.filter((group) => group.recommended).length,
        [groups],
    );
    const newCount = useMemo(
        () => groups.filter((group) => isNewTeacherContent?.(group.id)).length,
        [groups, isNewTeacherContent],
    );
    const summary = [
        recommendedCount > 0 ? `おすすめ${recommendedCount}` : null,
        newCount > 0 ? `New${newCount}` : null,
    ].filter(Boolean).join(' · ');

    if (!hasGroups) {
        return null;
    }

    return (
        <section>
            <div style={{ marginBottom: 10 }}>
                <CollapsibleSectionHeader
                    title="先生メニュー"
                    count={groups.length}
                    summary={summary || undefined}
                    expanded={expanded}
                    onToggle={onToggle}
                />
            </div>

            {expanded ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {groups.map((group, index) => (
                        <GroupCard
                            key={group.id}
                            group={group}
                            index={index}
                            exerciseMap={exerciseMap}
                            onTap={() => onTap(group)}
                            isTeacher
                            isNew={isNewTeacherContent?.(group.id)}
                        />
                    ))}
                </div>
            ) : null}
        </section>
    );
};
