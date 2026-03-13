import React, { useEffect, useMemo, useState } from 'react';
import { AutoMenuSettingsCard } from './group-tab/AutoMenuSettingsCard';
import { PublicMenuSection } from './group-tab/PublicMenuSection';
import { CreateGroupCard } from './group-tab/CreateGroupCard';
import type { MenuGroupTabProps } from './group-tab/types';
import { GroupCard } from './GroupCard';
import { ShowMoreButton } from './shared/ShowMoreButton';
import { OriginFilter, type OriginFilterId } from './shared/OriginFilter';
import type { MenuGroup } from '../../data/menuGroups';

const INITIAL_VISIBLE = 5;

const RECENT_DAYS = 7;

export const MenuGroupTab: React.FC<MenuGroupTabProps> = ({
    usageStats,
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
}) => {
    const [showAll, setShowAll] = useState(false);
    const [origin, setOrigin] = useState<OriginFilterId>('all');

    const recentCutoff = useMemo(() => {
        const d = new Date();
        d.setDate(d.getDate() - RECENT_DAYS);
        return d.toISOString();
    }, []);

    const allGroups = useMemo(() => {
        const scored = (group: MenuGroup): number => {
            if (group.recommended) return 0;
            if (isNewTeacherContent?.(group.id)) return 1;
            const lastUsed = usageStats.menuLastUsed.get(group.id);
            if (lastUsed && lastUsed >= recentCutoff) return 2;
            if (!group.isPreset && !group.origin) return 5; // custom
            if (group.origin === 'teacher' && group.displayMode !== 'standard_inline') return 4;
            return 3; // standard / inline teacher
        };

        const combined = [...presets, ...customGroups];
        return combined.sort((a, b) => {
            const sa = scored(a);
            const sb = scored(b);
            if (sa !== sb) return sa - sb;
            if (sa === 0) {
                const oa = a.recommendedOrder ?? Number.MAX_SAFE_INTEGER;
                const ob = b.recommendedOrder ?? Number.MAX_SAFE_INTEGER;
                if (oa !== ob) return oa - ob;
            }
            // Within same tier, sort by last used (most recent first)
            const la = usageStats.menuLastUsed.get(a.id) ?? '';
            const lb = usageStats.menuLastUsed.get(b.id) ?? '';
            if (la !== lb) return lb.localeCompare(la);
            return a.name.localeCompare(b.name, 'ja');
        });
    }, [presets, customGroups, isNewTeacherContent, usageStats.menuLastUsed, recentCutoff]);

    const availableOrigins = useMemo<OriginFilterId[]>(() => {
        const origins: OriginFilterId[] = ['all'];
        if (allGroups.some((g) => g.origin === 'teacher')) origins.push('teacher');
        if (allGroups.some((g) => !g.isPreset && !g.origin)) origins.push('custom');
        return origins;
    }, [allGroups]);

    const originFiltered = useMemo(() => {
        if (origin === 'all') return allGroups;
        if (origin === 'teacher') return allGroups.filter((g) => g.origin === 'teacher');
        return allGroups.filter((g) => !g.isPreset && !g.origin);
    }, [allGroups, origin]);

    useEffect(() => {
        if (!availableOrigins.includes(origin)) {
            setOrigin('all');
        }
    }, [availableOrigins, origin]);

    useEffect(() => {
        setShowAll(false);
    }, [origin]);

    const visibleGroups = showAll ? originFiltered : originFiltered.slice(0, INITIAL_VISIBLE);
    const remaining = originFiltered.length - INITIAL_VISIBLE;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, padding: '0 20px' }}>
            <AutoMenuSettingsCard
                isTogetherMode={isTogetherMode}
                dailyTargetMinutes={dailyTargetMinutes}
                requiredCount={effectiveRequiredCount}
                excludedCount={effectiveExcludedCount}
                onOpenCustomMenu={onOpenCustomMenu}
            />

            <OriginFilter
                value={origin}
                onChange={setOrigin}
                available={availableOrigins}
            />

            {originFiltered.length > 0 ? (
                <section>
                    <h2 style={{
                        fontFamily: "'Noto Sans JP', sans-serif",
                        fontSize: 13,
                        fontWeight: 700,
                        color: '#8395A7',
                        marginBottom: 10,
                        letterSpacing: 1,
                    }}>
                        メニュー
                        <span style={{
                            fontFamily: "'Outfit', sans-serif",
                            fontSize: 12,
                            fontWeight: 700,
                            color: '#B2BEC3',
                            marginLeft: 8,
                        }}>
                            {originFiltered.length}
                        </span>
                    </h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {visibleGroups.map((group, index) => {
                            const isCustom = !group.isPreset && !group.origin;
                            const published = isCustom ? findPublishedMenu(group) : undefined;
                            return (
                                <GroupCard
                                    key={group.id}
                                    group={group}
                                    index={index}
                                    exerciseMap={exerciseMap}
                                    creatorName={sessionUserCount > 1 && isCustom ? getCreatorName(group.creatorId) : undefined}
                                    onTap={() => onGroupTap(group)}
                                    onEdit={isCustom ? () => onEditGroup(group) : undefined}
                                    onDelete={isCustom ? () => onDeleteGroup(group.id) : undefined}
                                    onPublish={isCustom && canPublish ? () => onPublishGroup(group) : undefined}
                                    onUnpublish={isCustom ? () => onUnpublishGroup(group) : undefined}
                                    isCustom={isCustom}
                                    isPublished={isCustom ? !!published : undefined}
                                    downloadCount={published?.downloadCount}
                                    isTeacher={teacherMenuIds?.has(group.id)}
                                    isNew={isNewTeacherContent?.(group.id)}
                                />
                            );
                        })}
                        {remaining > 0 ? (
                            <ShowMoreButton
                                remainingCount={remaining}
                                expanded={showAll}
                                onToggle={() => setShowAll((v) => !v)}
                            />
                        ) : null}
                    </div>
                </section>
            ) : (
                <div
                    className="card card-sm"
                    style={{
                        padding: '14px 16px',
                        fontFamily: "'Noto Sans JP', sans-serif",
                        fontSize: 12,
                        color: '#8395A7',
                    }}
                >
                    いま使えるメニューはまだありません。
                </div>
            )}

            <CreateGroupCard hasGroups={customGroups.length > 0} onCreate={onCreateGroup} />

            <PublicMenuSection onOpen={onOpenPublicBrowser} />
        </div>
    );
};
