import React, { useMemo } from 'react';
import { ChevronRight, Clock, Play } from 'lucide-react';
import type { TeacherMenu } from '../../lib/teacherContent';
import type { GroupExerciseMap } from '../menu/group-card/groupCardUtils';
import { buildGroupCardSummary } from '../menu/group-card/groupCardUtils';
import { COLOR, FONT, FONT_SIZE, RADIUS, SPACE } from '../../lib/styles';
import { getTeacherMenuLead, toTeacherMenuGroup } from './homeMenuUtils';

interface HomeTeacherMenuHighlightsProps {
    menus: TeacherMenu[];
    exerciseMap: GroupExerciseMap;
    isNewTeacherContent: (id: string) => boolean;
    onPreview: (menu: TeacherMenu) => void;
    onStart: (menu: TeacherMenu) => void;
    onOpenMenuTab: () => void;
}

export const HomeTeacherMenuHighlights: React.FC<HomeTeacherMenuHighlightsProps> = ({
    menus,
    exerciseMap,
    isNewTeacherContent,
    onPreview,
    onStart,
    onOpenMenuTab,
}) => {
    const displayMenus = useMemo(
        () => menus.map((menu) => ({
            menu,
            summary: buildGroupCardSummary(toTeacherMenuGroup(menu), exerciseMap),
            isNew: isNewTeacherContent(menu.id),
        })),
        [exerciseMap, isNewTeacherContent, menus],
    );

    if (displayMenus.length === 0) {
        return null;
    }

    return (
        <section
            style={{
                width: '100%',
                padding: '0 16px',
                marginTop: 20,
            }}
        >
            <div style={sectionHeaderStyle}>
                <div style={{ minWidth: 0 }}>
                    <div style={sectionTitleStyle}>先生のメニュー</div>
                    <div style={sectionSubtitleStyle}>先生がおすすめしているメニュー</div>
                </div>
                <button
                    type="button"
                    onClick={onOpenMenuTab}
                    style={sectionLinkStyle}
                >
                    メニューへ
                    <ChevronRight size={14} />
                </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: SPACE.md }}>
                {displayMenus.map(({ menu, summary, isNew }) => (
                    <div key={menu.id} style={teacherCardStyle}>
                        <button
                            type="button"
                            onClick={() => onPreview(menu)}
                            style={cardBodyButtonStyle}
                            aria-label={`${menu.name}の詳細をみる`}
                        >
                            <div style={cardHeaderRowStyle}>
                                <div style={teacherIconStyle}>
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
                                    <Clock size={11} />
                                    約{summary.minutes}分
                                </span>
                                <span style={teacherMetaChipStyle}>{summary.exerciseCount}種目</span>
                                {menu.focusTags[0] ? <span style={teacherFocusChipStyle}>{menu.focusTags[0]}</span> : null}
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
            </div>
        </section>
    );
};

const sectionHeaderStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: SPACE.md,
    marginBottom: 12,
    padding: '0 4px',
};

const sectionTitleStyle: React.CSSProperties = {
    fontFamily: FONT.body,
    fontSize: FONT_SIZE.md + 1,
    fontWeight: 700,
    color: COLOR.dark,
};

const sectionSubtitleStyle: React.CSSProperties = {
    fontFamily: FONT.body,
    fontSize: FONT_SIZE.sm,
    color: COLOR.muted,
    marginTop: 4,
    lineHeight: 1.5,
};

const sectionLinkStyle: React.CSSProperties = {
    background: 'none',
    border: 'none',
    color: COLOR.info,
    fontFamily: FONT.body,
    fontSize: FONT_SIZE.sm,
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 2,
    padding: '2px 0',
    flexShrink: 0,
};

const teacherCardStyle: React.CSSProperties = {
    borderRadius: RADIUS['2xl'],
    border: '1px solid rgba(255,255,255,0.6)',
    background: 'linear-gradient(180deg, rgba(255,250,247,0.98) 0%, rgba(255,255,255,0.98) 100%)',
    boxShadow: '0 6px 18px rgba(0,0,0,0.05)',
    overflow: 'hidden',
};

const cardBodyButtonStyle: React.CSSProperties = {
    width: '100%',
    border: 'none',
    background: 'none',
    padding: `${SPACE.lg}px`,
    cursor: 'pointer',
    textAlign: 'left',
};

const cardHeaderRowStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'flex-start',
    gap: SPACE.md,
};

const teacherIconStyle: React.CSSProperties = {
    width: 52,
    height: 52,
    borderRadius: 18,
    background: 'linear-gradient(135deg, #FFF0E8, #FFF7D6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
};

const teacherTitleStyle: React.CSSProperties = {
    fontFamily: FONT.body,
    fontSize: FONT_SIZE.lg,
    fontWeight: 700,
    color: COLOR.dark,
    lineHeight: 1.35,
};

const teacherLeadStyle: React.CSSProperties = {
    fontFamily: FONT.body,
    fontSize: FONT_SIZE.sm + 1,
    color: COLOR.text,
    marginTop: 8,
    lineHeight: 1.6,
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
};

const teacherFooterRowStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACE.sm,
    padding: `0 ${SPACE.lg}px ${SPACE.lg}px`,
    flexWrap: 'wrap',
};

const teacherMetaChipStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    padding: '6px 10px',
    borderRadius: RADIUS.full,
    background: '#F6F4F2',
    fontFamily: FONT.body,
    fontSize: FONT_SIZE.xs + 1,
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
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '4px 8px',
    borderRadius: RADIUS.full,
    background: 'rgba(9, 132, 227, 0.1)',
    color: '#0984E3',
    fontFamily: FONT.body,
    fontSize: FONT_SIZE.xs + 1,
    fontWeight: 700,
};

const recommendedBadgeStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '4px 8px',
    borderRadius: RADIUS.full,
    background: 'rgba(43, 186, 160, 0.12)',
    color: COLOR.primaryDark,
    fontFamily: FONT.body,
    fontSize: FONT_SIZE.xs + 1,
    fontWeight: 700,
};

const newBadgeStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '4px 8px',
    borderRadius: RADIUS.full,
    background: '#FF7A7A',
    color: COLOR.white,
    fontFamily: FONT.heading,
    fontSize: FONT_SIZE.xs + 1,
    fontWeight: 700,
};
