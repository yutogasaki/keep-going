import React from 'react';
import { RefreshCw } from 'lucide-react';
import { PageHeader } from '../../components/PageHeader';
import { COLOR, HEADER_ICON_BUTTON_SIZE } from '../../lib/styles';

interface DeveloperHeaderProps {
    onBack: () => void;
    onRefresh: () => void;
    loading?: boolean;
}

export const DeveloperHeader: React.FC<DeveloperHeaderProps> = ({
    onBack,
    onRefresh,
    loading = false,
}) => {
    return (
        <PageHeader
            title="Developer Dashboard"
            onBack={onBack}
            tone="inverted"
            background="#1a1a2e"
            rightElement={(
                <button
                    type="button"
                    onClick={onRefresh}
                    disabled={loading}
                    aria-label="Reload developer data"
                    style={{
                        width: HEADER_ICON_BUTTON_SIZE,
                        height: HEADER_ICON_BUTTON_SIZE,
                        borderRadius: '50%',
                        border: 'none',
                        background: 'rgba(255,255,255,0.15)',
                        color: COLOR.white,
                        cursor: loading ? 'not-allowed' : 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: loading ? 0.7 : 1,
                    }}
                >
                    <RefreshCw size={16} style={loading ? { animation: 'spin 1s linear infinite' } : undefined} />
                </button>
            )}
        />
    );
};
