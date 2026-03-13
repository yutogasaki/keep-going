import React from 'react';
import { ScreenHeader, type ScreenHeaderTone } from './ScreenHeader';

interface PageHeaderProps {
    title: string;
    rightElement?: React.ReactNode;
    onBack?: () => void;
    sticky?: boolean;
    tone?: ScreenHeaderTone;
    background?: string;
    showBackLabel?: boolean;
    backLabel?: string;
    titleId?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = React.memo(({
    title,
    rightElement,
    onBack,
    sticky,
    tone,
    background,
    showBackLabel,
    backLabel,
    titleId,
}) => {
    return (
        <ScreenHeader
            title={title}
            rightElement={rightElement}
            onBack={onBack}
            sticky={sticky}
            tone={tone}
            background={background}
            showBackLabel={showBackLabel}
            backLabel={backLabel}
            titleId={titleId}
        />
    );
});
