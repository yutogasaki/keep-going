import React from 'react';
import {
    fieldHintStyle,
    fieldLabelStyle,
    sectionDescriptionStyle,
    sectionStyle,
    sectionTitleStyle,
} from './styles';

export function Field({
    label,
    hint,
    children,
}: {
    label: string;
    hint?: string;
    children: React.ReactNode;
}) {
    return (
        <div>
            <div style={fieldLabelStyle}>{label}</div>
            {children}
            {hint ? <div style={fieldHintStyle}>{hint}</div> : null}
        </div>
    );
}

export function Section({
    title,
    description,
    children,
}: {
    title: string;
    description?: string;
    children: React.ReactNode;
}) {
    return (
        <section style={sectionStyle}>
            <div>
                <div style={sectionTitleStyle}>{title}</div>
                {description ? <div style={sectionDescriptionStyle}>{description}</div> : null}
            </div>
            {children}
        </section>
    );
}
