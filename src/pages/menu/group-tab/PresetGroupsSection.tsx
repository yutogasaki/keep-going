import React from 'react';
import type { MenuGroup } from '../../../data/menuGroups';
import { GroupCard } from '../GroupCard';

interface PresetGroupsSectionProps {
    groups: MenuGroup[];
    onTap: (group: MenuGroup) => void;
}

export const PresetGroupsSection: React.FC<PresetGroupsSectionProps> = ({ groups, onTap }) => {
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
                        onTap={() => onTap(group)}
                    />
                ))}
            </div>
        </section>
    );
};
