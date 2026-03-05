import React from 'react';
import type { MenuGroup } from '../../../data/menuGroups';
import { GroupCard } from '../GroupCard';

interface PresetGroupsSectionProps {
    groups: MenuGroup[];
    exerciseMap: Map<string, { name: string; emoji: string; sec: number }>;
    onTap: (group: MenuGroup) => void;
    teacherMenuIds?: Set<string>;
    isNewTeacherContent?: (id: string) => boolean;
}

export const PresetGroupsSection: React.FC<PresetGroupsSectionProps> = ({ groups, exerciseMap, onTap, teacherMenuIds, isNewTeacherContent }) => {
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
                セットメニュー
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
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
