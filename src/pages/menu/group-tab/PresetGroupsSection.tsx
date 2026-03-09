import React from 'react';
import type { ExercisePlacement } from '../../../data/exercisePlacement';
import type { MenuGroup } from '../../../data/menuGroups';
import { GroupCard } from '../GroupCard';

interface PresetGroupsSectionProps {
    groups: MenuGroup[];
    exerciseMap: Map<string, { name: string; emoji: string; sec: number; placement: ExercisePlacement }>;
    onTap: (group: MenuGroup) => void;
    teacherMenuIds?: Set<string>;
    isNewTeacherContent?: (id: string) => boolean;
    title?: string;
    emptyMessage?: string | null;
}

export const PresetGroupsSection: React.FC<PresetGroupsSectionProps> = ({
    groups,
    exerciseMap,
    onTap,
    teacherMenuIds,
    isNewTeacherContent,
    title = '標準メニュー',
    emptyMessage = null,
}) => {
    return (
        <section>
            <h2 style={{
                fontFamily: "'Noto Sans JP', sans-serif",
                fontSize: 13,
                fontWeight: 700,
                color: '#8395A7',
                marginBottom: 10,
                letterSpacing: 1,
            }}>
                {title}
            </h2>
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
        </section>
    );
};
