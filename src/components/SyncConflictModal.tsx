import React from 'react';
import { Cloud, Smartphone } from 'lucide-react';
import { Modal } from './Modal';
import {
    btnPrimary,
    btnSecondary,
    COLOR,
    FONT,
    FONT_SIZE,
    RADIUS,
    SPACE,
    Z,
} from '../lib/styles';
import type { SyncDataSummary } from '../lib/sync';

interface SyncConflictModalProps {
    open: boolean;
    localSummary: SyncDataSummary | null;
    cloudSummary: SyncDataSummary | null;
    onChooseCloud: () => void;
    onChooseLocal: () => void;
}

function SummaryCard({
    icon,
    title,
    subtitle,
    summary,
}: {
    icon: React.ReactNode;
    title: string;
    subtitle: string;
    summary: SyncDataSummary;
}) {
    const rows = [
        ['おこさま', summary.users],
        ['きろく', summary.sessions],
        ['しゅもく', summary.customExercises],
        ['メニュー', summary.customGroups],
    ];

    return (
        <div
            style={{
                flex: 1,
                minWidth: 0,
                borderRadius: RADIUS.xl,
                padding: SPACE.lg,
                background: 'rgba(255,255,255,0.72)',
                border: '1px solid rgba(0,0,0,0.06)',
                display: 'flex',
                flexDirection: 'column',
                gap: SPACE.md,
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
                    <div
                        style={{
                            fontFamily: FONT.body,
                            fontSize: FONT_SIZE.sm,
                            color: COLOR.muted,
                            marginTop: 2,
                        }}
                    >
                        {subtitle}
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gap: SPACE.xs }}>
                {rows.map(([label, count]) => (
                    <div
                        key={label}
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            fontFamily: FONT.body,
                            fontSize: FONT_SIZE.sm,
                            color: COLOR.text,
                        }}
                    >
                        <span>{label}</span>
                        <span style={{ fontWeight: 700, color: COLOR.dark }}>{count}</span>
                    </div>
                ))}
                {summary.hasSettings && (
                    <div
                        style={{
                            marginTop: SPACE.xs,
                            fontFamily: FONT.body,
                            fontSize: FONT_SIZE.xs,
                            color: COLOR.primaryDark,
                            fontWeight: 700,
                        }}
                    >
                        せってい あり
                    </div>
                )}
            </div>
        </div>
    );
}

export const SyncConflictModal: React.FC<SyncConflictModalProps> = ({
    open,
    localSummary,
    cloudSummary,
    onChooseCloud,
    onChooseLocal,
}) => {
    if (!localSummary || !cloudSummary) {
        return null;
    }

    return (
        <Modal open={open} zIndex={Z.confirm} maxWidth={420} ariaLabel="同期するデータの選択">
            <div style={{ display: 'flex', flexDirection: 'column', gap: SPACE.lg }}>
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
                        どちらのデータをつかいますか？
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
                        このアカウントにはすでにデータがあります。いまの端末にもデータがあるので、
                        どちらをベースにするか選んでください。
                    </p>
                </div>

                <div style={{ display: 'flex', gap: SPACE.md, flexWrap: 'wrap' }}>
                    <SummaryCard
                        icon={<Cloud size={16} />}
                        title="クラウド"
                        subtitle="すでに保存されているデータ"
                        summary={cloudSummary}
                    />
                    <SummaryCard
                        icon={<Smartphone size={16} />}
                        title="この端末"
                        subtitle="いま使っているデータ"
                        summary={localSummary}
                    />
                </div>

                <div
                    style={{
                        padding: SPACE.md,
                        borderRadius: RADIUS.lg,
                        background: 'rgba(255,255,255,0.6)',
                        border: '1px solid rgba(0,0,0,0.05)',
                        display: 'grid',
                        gap: SPACE.sm,
                    }}
                >
                    <div
                        style={{
                            fontFamily: FONT.body,
                            fontSize: FONT_SIZE.sm,
                            lineHeight: 1.6,
                            color: COLOR.text,
                        }}
                    >
                        <strong style={{ color: COLOR.dark }}>クラウドを使う</strong>
                        : この端末の未同期データは使わず、クラウドの内容を復元します。
                    </div>
                    <div
                        style={{
                            fontFamily: FONT.body,
                            fontSize: FONT_SIZE.sm,
                            lineHeight: 1.6,
                            color: COLOR.text,
                        }}
                    >
                        <strong style={{ color: COLOR.dark }}>この端末を使う</strong>
                        : この端末の内容をクラウドに送り、記録やカスタム項目は重複を避けて統合します。
                    </div>
                </div>

                <div style={{ display: 'flex', gap: SPACE.sm }}>
                    <button
                        onClick={onChooseCloud}
                        style={{
                            ...btnPrimary,
                            flex: 1,
                            padding: '12px 16px',
                        }}
                    >
                        クラウドを使う
                    </button>
                    <button
                        onClick={onChooseLocal}
                        style={{
                            ...btnSecondary,
                            flex: 1,
                            padding: '12px 16px',
                        }}
                    >
                        この端末を使う
                    </button>
                </div>
            </div>
        </Modal>
    );
};
