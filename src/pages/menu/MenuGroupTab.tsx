import React from 'react';
import { AutoMenuSettingsCard } from './group-tab/AutoMenuSettingsCard';
import { PresetGroupsSection } from './group-tab/PresetGroupsSection';
import { TeacherGroupsSection } from './group-tab/TeacherGroupsSection';
import { CustomGroupsSection } from './group-tab/CustomGroupsSection';
import { PublicMenuSection } from './group-tab/PublicMenuSection';
import type { MenuGroupTabProps } from './group-tab/types';

export const MenuGroupTab: React.FC<MenuGroupTabProps> = ({
    exerciseMap,
    isTogetherMode,
    dailyTargetMinutes,
    effectiveRequiredCount,
    effectiveExcludedCount,
    autoMenuMinutes,
    presets,
    customGroups,
    sessionUserCount,
    getCreatorName,
    onOpenCustomMenu,
    onGroupTap,
    onEditGroup,
    onDeleteGroup,
    onCreateGroup,
    canPublish,
    onPublishGroup,
    onUnpublishGroup,
    findPublishedMenu,
    onOpenPublicBrowser,
    teacherMenuIds,
    isNewTeacherContent,
}) => {
    const teacherGroups = presets.filter((group) => teacherMenuIds?.has(group.id));
    const mainGroups = presets.filter((group) => !teacherMenuIds?.has(group.id));

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, padding: '0 20px' }}>
            <AutoMenuSettingsCard
                isTogetherMode={isTogetherMode}
                dailyTargetMinutes={dailyTargetMinutes}
                requiredCount={effectiveRequiredCount}
                excludedCount={effectiveExcludedCount}
                autoMenuMinutes={autoMenuMinutes}
                onOpenCustomMenu={onOpenCustomMenu}
            />

            <PresetGroupsSection
                title="メニュー"
                groups={mainGroups}
                exerciseMap={exerciseMap}
                onTap={onGroupTap}
                teacherMenuIds={teacherMenuIds}
                isNewTeacherContent={isNewTeacherContent}
                emptyMessage="いま使えるメニューはまだありません。"
            />

            <TeacherGroupsSection
                groups={teacherGroups}
                exerciseMap={exerciseMap}
                onTap={onGroupTap}
                isNewTeacherContent={isNewTeacherContent}
            />

            <CustomGroupsSection
                groups={customGroups}
                exerciseMap={exerciseMap}
                sessionUserCount={sessionUserCount}
                canPublish={canPublish}
                getCreatorName={getCreatorName}
                findPublishedMenu={findPublishedMenu}
                onTap={onGroupTap}
                onEdit={onEditGroup}
                onDelete={onDeleteGroup}
                onPublish={onPublishGroup}
                onUnpublish={onUnpublishGroup}
                onCreate={onCreateGroup}
            />

            <PublicMenuSection onOpen={onOpenPublicBrowser} />
        </div>
    );
};
