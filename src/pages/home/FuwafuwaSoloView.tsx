import { FuwafuwaCharacter } from '../../components/FuwafuwaCharacter';
import { MagicTank } from '../../components/MagicTank';
import type { SessionRecord } from '../../lib/db';
import { SPACE } from '../../lib/styles';
import type { UserProfileStore } from '../../store/useAppStore';
import type { FuwafuwaSpeech } from './fuwafuwaHomeCardCopy';
import { FuwafuwaSpeechBubble } from './FuwafuwaSpeechBubble';
import { getSpeechReactionStyle } from './fuwafuwaSpeechReaction';

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

export function FuwafuwaSoloView({
    allSessions,
    displaySeconds,
    onCharacterTap,
    onTankReset,
    onSpeechAction,
    selectedUser,
    selectedUserSpeech,
    targetSeconds,
}: FuwafuwaSoloViewProps) {
    const reactionStyle = getSpeechReactionStyle(selectedUserSpeech);

    return (
        <>
            <div style={{ marginBottom: 4 }}>
                <MagicTank
                    currentSeconds={displaySeconds}
                    maxSeconds={targetSeconds}
                    onReset={onTankReset}
                    ariaLabel="まほうタンク"
                />
            </div>

            <FuwafuwaSpeechBubble
                lines={selectedUserSpeech.lines}
                accent={selectedUserSpeech.accent}
                reactionStyle={reactionStyle}
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
                <FuwafuwaCharacter
                    user={selectedUser}
                    sessions={allSessions}
                    onInteract={onCharacterTap}
                    reactionStyle={reactionStyle}
                />
            </div>
        </>
    );
}
