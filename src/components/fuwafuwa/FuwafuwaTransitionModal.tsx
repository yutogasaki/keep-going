import React from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence } from 'framer-motion';
import type { DepartingInfo, SayonaraModalState } from './types';
import { FarewellModal } from './transition-modal/FarewellModal';
import { WelcomeModal } from './transition-modal/WelcomeModal';

interface FuwafuwaTransitionModalProps {
    modalState: SayonaraModalState;
    departingInfo: DepartingInfo | null;
    userFuwafuwaType: number;
    onNewEggTransition: () => void;
    onWelcomeClose: () => void;
}

export const FuwafuwaTransitionModal: React.FC<FuwafuwaTransitionModalProps> = ({
    modalState,
    departingInfo,
    userFuwafuwaType,
    onNewEggTransition,
    onWelcomeClose,
}) => {
    if (!modalState) {
        return null;
    }

    return createPortal(
        <AnimatePresence mode="wait">
            {modalState === 'farewell' && departingInfo && (
                <FarewellModal
                    departingInfo={departingInfo}
                    onNewEggTransition={onNewEggTransition}
                />
            )}

            {modalState === 'welcome' && (
                <WelcomeModal
                    userFuwafuwaType={userFuwafuwaType}
                    onWelcomeClose={onWelcomeClose}
                />
            )}
        </AnimatePresence>,
        document.body,
    );
};
