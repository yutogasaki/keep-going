import React from 'react';
import { motion } from 'framer-motion';
import { Plus, Settings2 } from 'lucide-react';
import type { MenuGroup } from '../../data/menuGroups';
import type { PublicMenu } from '../../lib/publicMenus';
import { GroupCard } from './GroupCard';

interface MenuGroupTabProps {
    isTogetherMode: boolean;
    dailyTargetMinutes: number;
    requiredExercises: string[];
    excludedExercises: string[];
    autoMenuMinutes: number;
    presets: MenuGroup[];
    customGroups: MenuGroup[];
    sessionUserCount: number;
    getCreatorName: (creatorId?: string) => string | null;
    onOpenCustomMenu: () => void;
    onGroupTap: (group: MenuGroup) => void;
    onEditGroup: (group: MenuGroup) => void;
    onDeleteGroup: (id: string) => void;
    onCreateGroup: () => void;
    canPublish: boolean;
    onPublishGroup: (group: MenuGroup) => void;
    onUnpublishGroup: (group: MenuGroup) => void;
    findPublishedMenu: (group: MenuGroup) => PublicMenu | undefined;
    onOpenPublicBrowser: () => void;
}

export const MenuGroupTab: React.FC<MenuGroupTabProps> = ({
    isTogetherMode,
    dailyTargetMinutes,
    requiredExercises,
    excludedExercises,
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
}) => {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, padding: '0 20px' }}>
            <div>
                <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={onOpenCustomMenu}
                    className="card"
                    style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 16,
                        padding: '16px 20px',
                        border: 'none',
                        background: 'white',
                        cursor: 'pointer',
                        textAlign: 'left',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                    }}
                >
                    <div style={{
                        width: 44,
                        height: 44,
                        borderRadius: 14,
                        background: 'linear-gradient(135deg, #FFF0F5, #FFE4E1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        boxShadow: '0 2px 8px rgba(255, 228, 225, 0.5)',
                    }}>
                        <Settings2 size={24} color="#E17055" />
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{
                            fontFamily: "'Noto Sans JP', sans-serif",
                            fontSize: 15,
                            fontWeight: 700,
                            color: '#2D3436',
                            marginBottom: 4,
                        }}>
                            おまかせの設定
                        </div>
                        <div style={{
                            fontFamily: "'Noto Sans JP', sans-serif",
                            fontSize: 12,
                            color: '#8395A7',
                            lineHeight: 1.4,
                        }}>
                            {dailyTargetMinutes}分 / ★ 必須: {requiredExercises.length}個 / 🔴 除外: {excludedExercises.length}個
                        </div>
                    </div>
                </motion.button>

                <p style={{
                    fontFamily: "'Noto Sans JP', sans-serif",
                    fontSize: 12,
                    color: '#8395A7',
                    marginTop: 12,
                    textAlign: 'center',
                }}>
                    {isTogetherMode
                        ? '個人モードに切りかえると設定を変更できます'
                        : <>★ 必須にした種目は、ホーム画面のおまかせメニューに必ず入ります<br />（おまかせで約{autoMenuMinutes}分）</>
                    }
                </p>
            </div>

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
                    {presets.map((group, index) => (
                        <GroupCard
                            key={group.id}
                            group={group}
                            index={index}
                            onTap={() => onGroupTap(group)}
                        />
                    ))}
                </div>
            </section>

            <section>
                <h2 style={{
                    fontFamily: "'Noto Sans JP', sans-serif",
                    fontSize: 13,
                    fontWeight: 700,
                    color: '#8395A7',
                    marginBottom: 10,
                    letterSpacing: 1,
                }}>
                    じぶんのメニュー
                </h2>
                {customGroups.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 10 }}>
                        {customGroups.map((group, index) => {
                            const published = findPublishedMenu(group);
                            return (
                                <GroupCard
                                    key={group.id}
                                    group={group}
                                    index={index}
                                    creatorName={sessionUserCount > 1 ? getCreatorName(group.creatorId) : undefined}
                                    onTap={() => onGroupTap(group)}
                                    onEdit={() => onEditGroup(group)}
                                    onDelete={() => onDeleteGroup(group.id)}
                                    onPublish={canPublish ? () => onPublishGroup(group) : undefined}
                                    onUnpublish={() => onUnpublishGroup(group)}
                                    isCustom
                                    isPublished={!!published}
                                    downloadCount={published?.downloadCount}
                                />
                            );
                        })}
                    </div>
                )}
                <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={onCreateGroup}
                    className="card"
                    style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 16,
                        padding: '16px 20px',
                        border: 'none',
                        background: 'white',
                        cursor: 'pointer',
                        textAlign: 'left',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                        marginTop: customGroups.length === 0 ? 0 : 4,
                    }}
                >
                    <div style={{
                        width: 44,
                        height: 44,
                        borderRadius: 14,
                        background: 'linear-gradient(135deg, #E0F2F1, #B2DFDB)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        boxShadow: '0 2px 8px rgba(178, 223, 219, 0.5)',
                    }}>
                        <Plus size={24} color="#00796B" strokeWidth={2.5} />
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{
                            fontFamily: "'Noto Sans JP', sans-serif",
                            fontSize: 15,
                            fontWeight: 700,
                            color: '#2D3436',
                            marginBottom: 4,
                        }}>
                            新しくつくる
                        </div>
                        <div style={{
                            fontFamily: "'Noto Sans JP', sans-serif",
                            fontSize: 12,
                            color: '#8395A7',
                            lineHeight: 1.4,
                        }}>
                            自分だけのくみあわせを作成
                        </div>
                    </div>
                </motion.button>
            </section>

            <section>
                <h2 style={{
                    fontFamily: "'Noto Sans JP', sans-serif",
                    fontSize: 13,
                    fontWeight: 700,
                    color: '#8395A7',
                    marginBottom: 10,
                    letterSpacing: 1,
                }}>
                    みんなのメニュー
                </h2>
                <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={onOpenPublicBrowser}
                    className="card"
                    style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 16,
                        padding: '16px 20px',
                        border: 'none',
                        background: 'white',
                        cursor: 'pointer',
                        textAlign: 'left',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                    }}
                >
                    <div style={{
                        width: 44,
                        height: 44,
                        borderRadius: 14,
                        background: 'linear-gradient(135deg, #E8F4FD, #BEE3F8)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        boxShadow: '0 2px 8px rgba(190, 227, 248, 0.5)',
                    }}>
                        <span style={{ fontSize: 22 }}>🌍</span>
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{
                            fontFamily: "'Noto Sans JP', sans-serif",
                            fontSize: 15,
                            fontWeight: 700,
                            color: '#2D3436',
                            marginBottom: 4,
                        }}>
                            みんなのメニューを見る
                        </div>
                        <div style={{
                            fontFamily: "'Noto Sans JP', sans-serif",
                            fontSize: 12,
                            color: '#8395A7',
                            lineHeight: 1.4,
                        }}>
                            他の人が作ったメニューをもらおう
                        </div>
                    </div>
                </motion.button>
            </section>
        </div>
    );
};
