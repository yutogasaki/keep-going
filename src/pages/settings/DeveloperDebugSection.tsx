import React, { useState } from 'react';
import { DevPasswordModal } from './developer-debug/DevPasswordModal';
import { DeveloperDebugPanel } from './developer-debug/DeveloperDebugPanel';

const DEV_PASSWORD = '0320';

export const DeveloperDebugSection: React.FC = () => {
    const [showDeveloperDebug, setShowDeveloperDebug] = useState(false);
    const [showDevPasswordModal, setShowDevPasswordModal] = useState(false);
    const [devPasswordInput, setDevPasswordInput] = useState('');

    const appendDevPasswordDigit = (digit: string) => {
        const next = (devPasswordInput + digit).slice(0, 4);
        if (next === devPasswordInput) return;

        setDevPasswordInput(next);

        if (next.length === 4) {
            if (next === DEV_PASSWORD) {
                setShowDevPasswordModal(false);
                setShowDeveloperDebug(true);
            } else {
                window.setTimeout(() => setDevPasswordInput(''), 300);
            }
        }
    };

    const closeDevPasswordModal = () => {
        setShowDevPasswordModal(false);
        setDevPasswordInput('');
    };

    return (
        <>
            {!showDeveloperDebug && (
                <div style={{ display: 'flex', justifyContent: 'center', marginTop: 16 }}>
                    <button
                        onClick={() => {
                            setDevPasswordInput('');
                            setShowDevPasswordModal(true);
                        }}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: '#B2BEC3',
                            fontSize: 11,
                            cursor: 'pointer',
                            padding: '8px 16px',
                            fontFamily: "'Noto Sans JP', sans-serif",
                        }}
                    >
                        開発者モード
                    </button>
                </div>
            )}

            <DevPasswordModal
                isOpen={showDevPasswordModal}
                passwordInput={devPasswordInput}
                onAppendDigit={appendDevPasswordDigit}
                onClose={closeDevPasswordModal}
                onBackspace={() => setDevPasswordInput((prev) => prev.slice(0, -1))}
            />

            {showDeveloperDebug && <DeveloperDebugPanel />}
        </>
    );
};
