import React, { useMemo } from 'react';
import { AutoMenuSettingsCard } from './group-tab/AutoMenuSettingsCard';
import { PresetGroupsSection } from './group-tab/PresetGroupsSection';
import { TeacherGroupsSection } from './group-tab/TeacherGroupsSection';
import { CustomGroupsSection } from './group-tab/CustomGroupsSection';
import { PublicMenuSection } from './group-tab/PublicMenuSection';
import type { MenuGroupTabProps } from './group-tab/types';
import { buildGroupCardSummary } from './group-card/groupCardUtils';
import { MenuHighlightsStrip, type MenuHighlightItem } from './shared/MenuHighlightsStrip';

export const MenuGroupTab: React.FC<MenuGroupTabProps> = ({
    exerciseMap,
    isTogetherMode,
    dailyTargetMinutes,
    effectiveRequiredCount,
    effectiveExcludedCount,
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
    sectionState,
    onToggleSection,
}) => {
    const teacherGroups = presets.filter(
        (group) => group.origin === 'teacher' && group.displayMode !== 'standard_inline'
    );
    const mainGroups = presets.filter(
        (group) => group.origin !== 'teacher' || group.displayMode === 'standard_inline'
    );
    const standardExpanded = sectionState.standard ?? true;
    const hasTeacherHighlights = teacherGroups.some(
        (group) => group.recommended || isNewTeacherContent?.(group.id),
    );
    const teacherExpanded = teacherGroups.length === 0
        ? false
        : sectionState.teacher ?? hasTeacherHighlights;
    const customExpanded = customGroups.length === 0
        ? true
        : sectionState.custom ?? false;
    const highlightItems = useMemo<MenuHighlightItem[]>(
        () => presets
            .filter((group) => group.recommended || isNewTeacherContent?.(group.id))
            .sort((left, right) => {
                const leftRecommended = left.recommended ? 0 : 1;
                const rightRecommended = right.recommended ? 0 : 1;
                if (leftRecommended !== rightRecommended) {
                    return leftRecommended - rightRecommended;
                }

                const leftNew = isNewTeacherContent?.(left.id) ? 0 : 1;
                const rightNew = isNewTeacherContent?.(right.id) ? 0 : 1;
                if (leftNew !== rightNew) {
                    return leftNew - rightNew;
                }

                const leftOrder = left.recommendedOrder ?? Number.MAX_SAFE_INTEGER;
                const rightOrder = right.recommendedOrder ?? Number.MAX_SAFE_INTEGER;
                if (leftOrder !== rightOrder) {
                    return leftOrder - rightOrder;
                }

                return left.name.localeCompare(right.name, 'ja');
            })
            .slice(0, 3)
            .map((group) => {
                const summary = buildGroupCardSummary(group, exerciseMap);
                return {
                    id: group.id,
                    emoji: group.emoji,
                    title: group.name,
                    meta: `約${summary.minutes}分 · ${summary.exerciseCount}種目`,
                    caption: group.recommended
                        ? '先生のおすすめをすぐ始められます'
                        : '新しく届いたメニューを試せます',
                    badges: [
                        ...(group.recommended ? ['おすすめ'] : []),
                        ...(isNewTeacherContent?.(group.id) ? ['New'] : []),
                    ],
                    onSelect: () => onGroupTap(group),
                };
            }),
        [exerciseMap, isNewTeacherContent, onGroupTap, presets],
    );

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, padding: '0 20px' }}>
            <AutoMenuSettingsCard
                isTogetherMode={isTogetherMode}
                dailyTargetMinutes={dailyTargetMinutes}
                requiredCount={effectiveRequiredCount}
                excludedCount={effectiveExcludedCount}
                onOpenCustomMenu={onOpenCustomMenu}
            />

            <MenuHighlightsStrip
                title="先生のおすすめ"
                description="おすすめや新着を先に見て、迷わず始めます"
                items={highlightItems}
            />

            <PresetGroupsSection
                title="今日つかうメニュー"
                groups={mainGroups}
                exerciseMap={exerciseMap}
                onTap={onGroupTap}
                teacherMenuIds={teacherMenuIds}
                isNewTeacherContent={isNewTeacherContent}
                emptyMessage={mainGroups.length === 0 && teacherGroups.length === 0 ? 'いま使えるメニューはまだありません。' : null}
                expanded={standardExpanded}
                onToggle={() => onToggleSection('standard', !standardExpanded)}
            />

            <TeacherGroupsSection
                groups={teacherGroups}
                exerciseMap={exerciseMap}
                onTap={onGroupTap}
                isNewTeacherContent={isNewTeacherContent}
                expanded={teacherExpanded}
                onToggle={() => onToggleSection('teacher', !teacherExpanded)}
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
                expanded={customExpanded}
                onToggle={() => onToggleSection('custom', !customExpanded)}
            />

            <PublicMenuSection onOpen={onOpenPublicBrowser} />
        </div>
    );
};
