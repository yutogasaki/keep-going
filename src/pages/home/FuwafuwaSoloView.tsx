import { FuwafuwaCharacter } from '../../components/FuwafuwaCharacter';
import { MagicTank } from '../../components/MagicTank';
import type { SessionRecord } from '../../lib/db';
import { SPACE } from '../../lib/styles';
import type { UserProfileStore } from '../../store/useAppStore';
import type { FuwafuwaSpeech } from './fuwafuwaHomeCardCopy';
import { FuwafuwaSpeechBubble } from './FuwafuwaSpeechBubble';
import { FuwafuwaSilentCue } from './FuwafuwaSilentCue';
import { getSpeechReactionStyle } from './fuwafuwaSpeechReaction';

interface FuwafuwaSoloViewProps {
    allSessions: SessionRecord[];
    displaySeconds: number;
    isMagicDeliveryActive: boolean;
    onCharacterTap?: () => void;
    onSpeechTap?: () => void;
    onTankReset: () => void;
    onSpeechAction?: () => void;
    selectedUser: UserProfileStore;
    selectedUserSpeech: FuwafuwaSpeech;
    showSpeechBubble: boolean;
    targetSeconds: number;
}

export function FuwafuwaSoloView({
    allSessions,
    displaySeconds,
    isMagicDeliveryActive,
    onCharacterTap,
    onSpeechTap,
    onTankReset,
    onSpeechAction,
    selectedUser,
    selectedUserSpeech,
    showSpeechBubble,
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
                    isSending={isMagicDeliveryActive}
                />
            </div>

            {showSpeechBubble ? (
                <FuwafuwaSpeechBubble
                    lines={selectedUserSpeech.lines}
                    accent={selectedUserSpeech.accent}
                    reactionStyle={reactionStyle}
                    actionLabel={selectedUserSpeech.actionLabel}
                    onAction={onSpeechAction}
                    onTap={onSpeechTap}
                />
            ) : (
                <FuwafuwaSilentCue onTap={onCharacterTap} />
            )}

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
