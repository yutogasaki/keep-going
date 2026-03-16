import React, { useMemo } from 'react';
import { ChevronRight, Clock, Play, Sparkles } from 'lucide-react';
import { HomeSection } from '../../components/home/HomeSection';
import {
    getHomeBadgeStyle,
    getHomeCardStyle,
    getHomeIconSurfaceStyle,
    homeCardBodyTextStyle,
    homeCardButtonResetStyle,
    homeCardFooterRowStyle,
    homeCardMetaChipStyle,
    homeCardTitleStyle,
} from '../../components/home/homeCardChrome';
import { getExercisePlacementLabel } from '../../data/exercisePlacement';
import { getTeacherVisibilityLabel, isTeacherContentNew } from '../../lib/teacherExerciseMetadata';
import type { TeacherExercise, TeacherMenu } from '../../lib/teacherContent';
import { COLOR, FONT, FONT_SIZE, RADIUS, SPACE } from '../../lib/styles';
import type { GroupExerciseMap } from '../menu/group-card/groupCardUtils';
import { buildGroupCardSummary } from '../menu/group-card/groupCardUtils';
import { getTeacherExerciseLead, getTeacherMenuLead, toTeacherMenuGroup } from './homeMenuUtils';

interface HomeTeacherMenuHighlightsProps {
    menus: TeacherMenu[];
    featuredExercise: TeacherExercise | null;
    exerciseMap: GroupExerciseMap;
    isNewTeacherContent: (id: string) => boolean;
    onPreview: (menu: TeacherMenu) => void;
    onExercisePreview: (exercise: TeacherExercise) => void;
    onStart: (menu: TeacherMenu) => void;
    onOpenMenuTab: () => void;
}

export const HomeTeacherMenuHighlights: React.FC<HomeTeacherMenuHighlightsProps> = ({
    menus,
    featuredExercise,
    exerciseMap,
    isNewTeacherContent,
    onPreview,
    onExercisePreview,
    onStart,
    onOpenMenuTab,
}) => {
    const displayMenus = useMemo(
        () =>
            menus.map((menu) => ({
                menu,
                summary: buildGroupCardSummary(toTeacherMenuGroup(menu), exerciseMap),
                isNew: isNewTeacherContent(menu.id),
            })),
        [exerciseMap, isNewTeacherContent, menus],
    );

    if (displayMenus.length === 0 && !featuredExercise) {
        return null;
    }

    return (
        <HomeSection
            title="先生のメニュー"
            subtitle="すぐはじめやすい"
            actionLabel="もっと見る"
            onAction={onOpenMenuTab}
        >
            <div style={{ display: 'flex', flexDirection: 'column', gap: SPACE.md }}>
                {displayMenus.map(({ menu, summary, isNew }) => (
                    <div key={menu.id} style={getHomeCardStyle('warm', { overflow: 'hidden', padding: 0 })}>
                        <button
                            type="button"
                            onClick={() => onPreview(menu)}
                            style={cardBodyButtonStyle}
                            aria-label={`${menu.name}の詳細をみる`}
                        >
                            <div style={cardHeaderRowStyle}>
                                <div
                                    style={getHomeIconSurfaceStyle('warm', { width: 52, height: 52, borderRadius: 18 })}
                                >
                                    <span style={{ fontSize: 26, lineHeight: 1 }}>{menu.emoji}</span>
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                                        <span style={teacherBadgeStyle}>先生</span>
                                        {menu.recommended ? <span style={recommendedBadgeStyle}>おすすめ</span> : null}
                                        {isNew ? <span style={newBadgeStyle}>New</span> : null}
                                    </div>
                                    <div style={teacherTitleStyle}>{menu.name}</div>
                                    <div style={teacherLeadStyle}>{getTeacherMenuLead(menu)}</div>
                                </div>
                            </div>
                        </button>

                        <div style={teacherFooterRowStyle}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                <span style={teacherMetaChipStyle}>
                                    <Clock size={11} />約{summary.minutes}分
                                </span>
                                <span style={teacherMetaChipStyle}>{summary.exerciseCount}種目</span>
                                {menu.focusTags[0] ? (
                                    <span style={teacherFocusChipStyle}>{menu.focusTags[0]}</span>
                                ) : null}
                            </div>
                            <button
                                type="button"
                                onClick={() => onStart(menu)}
                                style={teacherStartButtonStyle}
                                aria-label={`${menu.name}をはじめる`}
                            >
                                <Play size={14} fill="white" />
                                はじめる
                            </button>
                        </div>
                    </div>
                ))}

                {featuredExercise ? (
                    <div style={getHomeCardStyle('sky', { overflow: 'hidden', padding: 0 })}>
                        <button
                            type="button"
                            onClick={() => onExercisePreview(featuredExercise)}
                            style={teacherDiscoveryButtonStyle}
                            aria-label={`${featuredExercise.name}の詳細をみる`}
                        >
                            <div style={teacherDiscoveryLabelStyle}>
                                <Sparkles size={14} />
                                先生の新しい種目
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%' }}>
                                <div style={getHomeIconSurfaceStyle('sky')}>
                                    <span style={{ fontSize: 24, lineHeight: 1 }}>{featuredExercise.emoji}</span>
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                                        <span style={teacherBadgeStyle}>先生</span>
                                        {featuredExercise.recommended ? (
                                            <span style={recommendedBadgeStyle}>おすすめ</span>
                                        ) : null}
                                        {isTeacherContentNew(featuredExercise.createdAt) ? (
                                            <span style={newBadgeStyle}>New</span>
                                        ) : null}
                                    </div>
                                    <div style={teacherTitleStyle}>{featuredExercise.name}</div>
                                    <div style={teacherLeadStyle}>{getTeacherExerciseLead(featuredExercise)}</div>
                                </div>
                            </div>
                        </button>

                        <div style={teacherDiscoveryFooterStyle}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                <span style={teacherMetaChipStyle}>
                                    <Clock size={11} />
                                    {featuredExercise.sec}秒
                                </span>
                                <span style={teacherMetaChipStyle}>
                                    {getExercisePlacementLabel(featuredExercise.placement)}
                                </span>
                                {featuredExercise.focusTags[0] ? (
                                    <span style={teacherFocusChipStyle}>{featuredExercise.focusTags[0]}</span>
                                ) : null}
                                {featuredExercise.visibility !== 'public' ? (
                                    <span style={teacherMetaChipStyle}>
                                        {getTeacherVisibilityLabel(featuredExercise.visibility)}
                                    </span>
                                ) : null}
                            </div>
                            <button type="button" onClick={onOpenMenuTab} style={teacherDiscoveryLinkStyle}>
                                種目も見る
                                <ChevronRight size={14} />
                            </button>
                        </div>
                    </div>
                ) : null}
            </div>
        </HomeSection>
    );
};

const cardBodyButtonStyle: React.CSSProperties = {
    ...homeCardButtonResetStyle,
    width: '100%',
    padding: `${SPACE.lg}px`,
};

const cardHeaderRowStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'flex-start',
    gap: SPACE.md,
};

const teacherDiscoveryButtonStyle: React.CSSProperties = {
    ...homeCardButtonResetStyle,
    width: '100%',
    padding: `${SPACE.lg}px`,
};

const teacherDiscoveryLabelStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
    padding: '6px 10px',
    borderRadius: RADIUS.full,
    background: 'rgba(9, 132, 227, 0.08)',
    color: COLOR.info,
    fontFamily: FONT.body,
    fontSize: FONT_SIZE.xs + 1,
    fontWeight: 700,
};

const teacherDiscoveryFooterStyle: React.CSSProperties = {
    ...homeCardFooterRowStyle,
    padding: `0 ${SPACE.lg}px ${SPACE.lg}px`,
};

const teacherDiscoveryLinkStyle: React.CSSProperties = {
    background: 'none',
    border: 'none',
    color: COLOR.info,
    fontFamily: FONT.body,
    fontSize: FONT_SIZE.sm,
    fontWeight: 700,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 2,
    padding: 0,
    flexShrink: 0,
};

const teacherTitleStyle: React.CSSProperties = {
    ...homeCardTitleStyle,
    fontSize: FONT_SIZE.lg,
};

const teacherLeadStyle: React.CSSProperties = {
    ...homeCardBodyTextStyle,
    marginTop: 8,
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
};

const teacherFooterRowStyle: React.CSSProperties = {
    ...homeCardFooterRowStyle,
    padding: `0 ${SPACE.lg}px ${SPACE.lg}px`,
};

const teacherMetaChipStyle: React.CSSProperties = {
    ...homeCardMetaChipStyle,
    background: '#F6F4F2',
    color: COLOR.muted,
};

const teacherFocusChipStyle: React.CSSProperties = {
    ...teacherMetaChipStyle,
    background: '#FFF2E4',
    color: '#B86A2C',
};

const teacherStartButtonStyle: React.CSSProperties = {
    border: 'none',
    background: COLOR.primary,
    color: COLOR.white,
    borderRadius: RADIUS.full,
    padding: '10px 14px',
    fontFamily: FONT.body,
    fontSize: FONT_SIZE.sm,
    fontWeight: 700,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
};

const teacherBadgeStyle: React.CSSProperties = {
    ...getHomeBadgeStyle('sky'),
};

const recommendedBadgeStyle: React.CSSProperties = {
    ...getHomeBadgeStyle('mint'),
};

const newBadgeStyle: React.CSSProperties = {
    ...getHomeBadgeStyle('danger'),
};
