import React, { useMemo } from 'react';
import type { ExercisePlacement } from '../../../data/exercisePlacement';
import type { MenuGroup } from '../../../data/menuGroups';
import { GroupCard } from '../GroupCard';
import { CollapsibleSectionHeader } from '../shared/CollapsibleSectionHeader';

interface PresetGroupsSectionProps {
    groups: MenuGroup[];
    exerciseMap: Map<string, { name: string; emoji: string; sec: number; placement: ExercisePlacement }>;
    onTap: (group: MenuGroup) => void;
    teacherMenuIds?: Set<string>;
    isNewTeacherContent?: (id: string) => boolean;
    title?: string;
    emptyMessage?: string | null;
    expanded: boolean;
    onToggle: () => void;
}

export const PresetGroupsSection: React.FC<PresetGroupsSectionProps> = ({
    groups,
    exerciseMap,
    onTap,
    teacherMenuIds,
    isNewTeacherContent,
    title = '標準メニュー',
    emptyMessage = null,
    expanded,
    onToggle,
}) => {
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

    return (
        <section>
            <div style={{ marginBottom: expanded ? 10 : 0 }}>
                <CollapsibleSectionHeader
                    title={title}
                    count={groups.length}
                    summary={summary || undefined}
                    expanded={expanded}
                    onToggle={onToggle}
                />
            </div>

            {expanded ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {groups.length === 0 && emptyMessage ? (
                        <div
                            className="card card-sm"
                            style={{
                                padding: '14px 16px',
                                fontFamily: "'Noto Sans JP', sans-serif",
                                fontSize: 12,
                                color: '#8395A7',
                            }}
                        >
                            {emptyMessage}
                        </div>
                    ) : null}
                    {groups.map((group, index) => (
                        <GroupCard
                            key={group.id}
                            group={group}
                            index={index}
                            exerciseMap={exerciseMap}
                            onTap={() => onTap(group)}
                            isTeacher={teacherMenuIds?.has(group.id)}
                            isNew={isNewTeacherContent?.(group.id)}
                        />
                    ))}
                </div>
            ) : null}
        </section>
    );
};
