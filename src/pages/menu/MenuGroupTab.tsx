import React from 'react';
import { AutoMenuSettingsCard } from './group-tab/AutoMenuSettingsCard';
import { PresetGroupsSection } from './group-tab/PresetGroupsSection';
import { CustomGroupsSection } from './group-tab/CustomGroupsSection';
import { PublicMenuSection } from './group-tab/PublicMenuSection';
import type { MenuGroupTabProps } from './group-tab/types';

export const MenuGroupTab: React.FC<MenuGroupTabProps> = ({
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
                groups={presets}
                onTap={onGroupTap}
                teacherMenuIds={teacherMenuIds}
                isNewTeacherContent={isNewTeacherContent}
            />

            <CustomGroupsSection
                groups={customGroups}
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
