import React from 'react';
import { ArrowRightLeft, Cloud, Smartphone } from 'lucide-react';
import { Modal } from './Modal';
import {
    COLOR,
    FONT,
    FONT_SIZE,
    RADIUS,
    SPACE,
    Z,
} from '../lib/styles';
import type { SyncConflictResolution, SyncDataSummary } from '../lib/sync';

interface SyncConflictModalProps {
    open: boolean;
    localSummary: SyncDataSummary | null;
    cloudSummary: SyncDataSummary | null;
    recommendedResolution: SyncConflictResolution | null;
    recommendationReason: string | null;
    onChooseCloud: () => void;
    onChooseMerge: () => void;
}

function SummaryCard({
    icon,
    title,
    summary,
    isRecommended,
}: {
    icon: React.ReactNode;
    title: string;
    summary: SyncDataSummary;
    isRecommended: boolean;
}) {
    const rows = [
        ['おこさま', summary.users],
        ['きろく', summary.sessions],
        ['カスタム', summary.customExercises + summary.customGroups],
        ['せってい', summary.hasSettings ? 'あり' : 'なし'],
    ];

    return (
        <div
            style={{
                borderRadius: RADIUS.xl,
                padding: SPACE.md,
                background: 'rgba(255,255,255,0.72)',
                border: isRecommended ? '1px solid rgba(43, 186, 160, 0.28)' : '1px solid rgba(0,0,0,0.06)',
                boxShadow: isRecommended ? '0 8px 24px rgba(43, 186, 160, 0.10)' : 'none',
                display: 'flex',
                flexDirection: 'column',
                gap: SPACE.sm,
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: SPACE.sm }}>
                <div
                    style={{
                        width: 32,
                        height: 32,
                        borderRadius: RADIUS.full,
                        background: 'rgba(43, 186, 160, 0.12)',
                        color: COLOR.primary,
                        display: 'grid',
                        placeItems: 'center',
                        flexShrink: 0,
                    }}
                >
                    {icon}
                </div>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: SPACE.xs, flexWrap: 'wrap' }}>
                        <div
                            style={{
                                fontFamily: FONT.body,
                                fontSize: FONT_SIZE.md,
                                fontWeight: 700,
                                color: COLOR.dark,
                            }}
                        >
                            {title}
                        </div>
                        {isRecommended && (
                            <span
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    padding: '2px 8px',
                                    borderRadius: RADIUS.full,
                                    background: 'rgba(43, 186, 160, 0.12)',
                                    color: COLOR.primaryDark,
                                    fontFamily: FONT.body,
                                    fontSize: FONT_SIZE.xs,
                                    fontWeight: 700,
                                }}
                            >
                                おすすめ
                            </span>
                        )}
                    </div>
                </div>
            </div>

            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                    gap: SPACE.xs,
                }}
            >
                {rows.map(([label, count]) => (
                    <div
                        key={label}
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 2,
                            padding: '8px 10px',
                            borderRadius: RADIUS.lg,
                            background: 'rgba(248,249,250,0.9)',
                            fontFamily: FONT.body,
                            fontSize: FONT_SIZE.xs,
                            color: COLOR.text,
                        }}
                    >
                        <span>{label}</span>
                        <span style={{ fontSize: FONT_SIZE.md, fontWeight: 700, color: COLOR.dark }}>{count}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

function ChoiceCard({
    icon,
    title,
    description,
    onClick,
    emphasized,
}: {
    icon: React.ReactNode;
    title: string;
    description: string;
    onClick: () => void;
    emphasized: boolean;
}) {
    return (
        <button
            onClick={onClick}
            style={{
                width: '100%',
                display: 'flex',
                alignItems: 'flex-start',
                gap: SPACE.md,
                padding: '14px 16px',
                borderRadius: RADIUS.xl,
                border: emphasized ? 'none' : '1px solid rgba(0,0,0,0.08)',
                background: emphasized
                    ? 'linear-gradient(135deg, rgba(43, 186, 160, 0.96), rgba(36, 160, 138, 0.96))'
                    : 'rgba(255,255,255,0.9)',
                color: emphasized ? COLOR.white : COLOR.dark,
                boxShadow: emphasized ? '0 12px 28px rgba(43, 186, 160, 0.24)' : 'none',
                cursor: 'pointer',
                textAlign: 'left',
            }}
        >
            <div
                style={{
                    width: 36,
                    height: 36,
                    borderRadius: RADIUS.full,
                    display: 'grid',
                    placeItems: 'center',
                    background: emphasized ? 'rgba(255,255,255,0.18)' : 'rgba(43, 186, 160, 0.10)',
                    color: emphasized ? COLOR.white : COLOR.primaryDark,
                    flexShrink: 0,
                }}
            >
                {icon}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{ fontFamily: FONT.body, fontSize: FONT_SIZE.md, fontWeight: 700 }}>
                    {title}
                </div>
                <div
                    style={{
                        fontFamily: FONT.body,
                        fontSize: FONT_SIZE.sm,
                        lineHeight: 1.6,
                        color: emphasized ? 'rgba(255,255,255,0.92)' : COLOR.text,
                    }}
                >
                    {description}
                </div>
            </div>
        </button>
    );
}

export const SyncConflictModal: React.FC<SyncConflictModalProps> = ({
    open,
    localSummary,
    cloudSummary,
    recommendedResolution,
    recommendationReason,
    onChooseCloud,
    onChooseMerge,
}) => {
    if (!localSummary || !cloudSummary) {
        return null;
    }

    return (
        <Modal
            open={open}
            zIndex={Z.confirm}
            maxWidth={440}
            ariaLabel="同期するデータの選択"
            contentStyle={{
                maxHeight: 'min(84dvh, 760px)',
                overflowY: 'auto',
                overscrollBehavior: 'contain',
            }}
        >
            <div style={{ display: 'flex', flexDirection: 'column', gap: SPACE.md }}>
                <div>
                    <h3
                        style={{
                            margin: 0,
                            fontFamily: FONT.body,
                            fontSize: FONT_SIZE.xl,
                            fontWeight: 700,
                            color: COLOR.dark,
                        }}
                    >
                        どのデータで続けますか？
                    </h3>
                    <p
                        style={{
                            margin: `${SPACE.sm}px 0 0`,
                            fontFamily: FONT.body,
                            fontSize: FONT_SIZE.sm,
                            lineHeight: 1.7,
                            color: COLOR.text,
                        }}
                    >
                        クラウドにもこの端末にもデータがあります。片方だけ使うか、両方をまとめるか選べます。
                    </p>
                </div>

                <div style={{ display: 'grid', gap: SPACE.sm }}>
                    <SummaryCard
                        icon={<Cloud size={16} />}
                        title="クラウド"
                        summary={cloudSummary}
                        isRecommended={recommendedResolution === 'cloud'}
                    />
                    <SummaryCard
                        icon={<Smartphone size={16} />}
                        title="この端末"
                        summary={localSummary}
                        isRecommended={recommendedResolution === 'merge'}
                    />
                </div>

                {recommendationReason && (
                    <div
                        style={{
                            padding: SPACE.md,
                            borderRadius: RADIUS.lg,
                            background: 'rgba(43, 186, 160, 0.08)',
                            border: '1px solid rgba(43, 186, 160, 0.16)',
                            fontFamily: FONT.body,
                            fontSize: FONT_SIZE.sm,
                            lineHeight: 1.7,
                            color: COLOR.text,
                        }}
                    >
                        <strong style={{ color: COLOR.primaryDark }}>おすすめ</strong>
                        : {recommendationReason}
                    </div>
                )}

                <div style={{ display: 'grid', gap: SPACE.sm }}>
                    <ChoiceCard
                        icon={<Cloud size={18} />}
                        title="クラウドを使う"
                        description="クラウドの内容でこの端末を復元します。この端末だけにある未同期データは引き継がれません。"
                        onClick={onChooseCloud}
                        emphasized={recommendedResolution === 'cloud'}
                    />
                    <ChoiceCard
                        icon={<ArrowRightLeft size={18} />}
                        title="両方をまとめる"
                        description="この端末とクラウドの内容を、残せるものは両方残すようにまとめます。重複しそうな記録やカスタム項目は整理します。"
                        onClick={onChooseMerge}
                        emphasized={recommendedResolution === 'merge'}
                    />
                </div>
            </div>
        </Modal>
    );
};
