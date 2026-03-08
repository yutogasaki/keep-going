import React from 'react';
import { FuwafuwaCharacter } from '../../components/FuwafuwaCharacter';
import { MagicTank } from '../../components/MagicTank';
import type { SessionRecord } from '../../lib/db';
import { SPACE } from '../../lib/styles';
import type { UserProfileStore } from '../../store/useAppStore';
import { FuwafuwaSpeechBubble } from './FuwafuwaSpeechBubble';

interface FuwafuwaSoloViewProps {
    allSessions: SessionRecord[];
    displaySeconds: number;
    onTankReset: () => void;
    selectedUser: UserProfileStore;
    selectedUserMessage: string;
    targetSeconds: number;
}

export const FuwafuwaSoloView: React.FC<FuwafuwaSoloViewProps> = ({
    allSessions,
    displaySeconds,
    onTankReset,
    selectedUser,
    selectedUserMessage,
    targetSeconds,
}) => (
    <>
        <div style={{ marginBottom: 4 }}>
            <MagicTank
                currentSeconds={displaySeconds}
                maxSeconds={targetSeconds}
                onReset={onTankReset}
            />
        </div>

        <FuwafuwaSpeechBubble message={selectedUserMessage} accent="primary" />

        <div
            style={{
                width: '100%',
                padding: `0 ${SPACE.xl}px`,
                display: 'flex',
                justifyContent: 'center',
            }}
        >
            <FuwafuwaCharacter user={selectedUser} sessions={allSessions} />
        </div>
    </>
);
