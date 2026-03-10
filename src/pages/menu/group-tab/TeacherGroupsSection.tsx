import React, { useEffect, useMemo, useState } from 'react';
import type { ExercisePlacement } from '../../../data/exercisePlacement';
import type { MenuGroup } from '../../../data/menuGroups';
import { GroupCard } from '../GroupCard';
import { CollapsibleSectionHeader } from '../shared/CollapsibleSectionHeader';

interface TeacherGroupsSectionProps {
    groups: MenuGroup[];
    exerciseMap: Map<string, { name: string; emoji: string; sec: number; placement: ExercisePlacement }>;
    onTap: (group: MenuGroup) => void;
    isNewTeacherContent?: (id: string) => boolean;
}

export const TeacherGroupsSection: React.FC<TeacherGroupsSectionProps> = ({
    groups,
    exerciseMap,
    onTap,
    isNewTeacherContent,
}) => {
    const hasGroups = groups.length > 0;
    const hasHighlightedGroups = useMemo(
        () => groups.some((group) => group.recommended || isNewTeacherContent?.(group.id)),
        [groups, isNewTeacherContent],
    );
    const [expanded, setExpanded] = useState(hasHighlightedGroups);

    useEffect(() => {
        if (!hasGroups) {
            setExpanded(true);
            return;
        }

        if (hasHighlightedGroups) {
            setExpanded(true);
        }
    }, [hasGroups, hasHighlightedGroups]);

    if (!hasGroups) {
        return null;
    }

    return (
        <section>
            <div style={{ marginBottom: 10 }}>
                <CollapsibleSectionHeader
                    title="先生メニュー"
                    count={groups.length}
                    expanded={expanded}
                    onToggle={() => setExpanded((current) => !current)}
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
