import React from 'react';
import { FuwafuwaCharacter } from '../../components/FuwafuwaCharacter';
import { MagicTank } from '../../components/MagicTank';
import type { SessionRecord } from '../../lib/db';
import { SPACE } from '../../lib/styles';
import type { UserProfileStore } from '../../store/useAppStore';
import type { FuwafuwaSpeech } from './fuwafuwaHomeCardCopy';
import { FuwafuwaSpeechBubble } from './FuwafuwaSpeechBubble';

interface FuwafuwaSoloViewProps {
    allSessions: SessionRecord[];
    displaySeconds: number;
    onCharacterTap?: () => void;
    onTankReset: () => void;
    onSpeechAction?: () => void;
    selectedUser: UserProfileStore;
    selectedUserSpeech: FuwafuwaSpeech;
    targetSeconds: number;
}

export const FuwafuwaSoloView: React.FC<FuwafuwaSoloViewProps> = ({
    allSessions,
    displaySeconds,
    onCharacterTap,
    onTankReset,
    onSpeechAction,
    selectedUser,
    selectedUserSpeech,
    targetSeconds,
}) => (
    <>
        <div style={{ marginBottom: 4 }}>
            <MagicTank
                currentSeconds={displaySeconds}
                maxSeconds={targetSeconds}
                onReset={onTankReset}
                label="まほうエネルギー"
                fullHint="ぽんって してみよう"
            />
        </div>

        <FuwafuwaSpeechBubble
            lines={selectedUserSpeech.lines}
            accent={selectedUserSpeech.accent}
            actionLabel={selectedUserSpeech.actionLabel}
            onAction={onSpeechAction}
        />

        <div
            style={{
                width: '100%',
                padding: `0 ${SPACE.xl}px`,
                display: 'flex',
                justifyContent: 'center',
            }}
        >
            <FuwafuwaCharacter user={selectedUser} sessions={allSessions} onInteract={onCharacterTap} />
        </div>
    </>
);
