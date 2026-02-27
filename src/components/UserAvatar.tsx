import React, { useState } from 'react';

interface UserAvatarProps {
    avatarUrl?: string;
    name: string;
    size?: number;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
    avatarUrl,
    name,
    size = 24,
}) => {
    const [imgError, setImgError] = useState(false);

    if (avatarUrl && !imgError) {
        return (
            <img
                src={avatarUrl}
                alt={name}
                style={{
                    width: size,
                    height: size,
                    borderRadius: '50%',
                    objectFit: 'cover',
                    flexShrink: 0,
                }}
                onError={() => setImgError(true)}
            />
        );
    }

    return (
        <span
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: size,
                height: size,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #E8F8F0, #D4F0E7)',
                fontSize: size * 0.45,
                fontWeight: 700,
                color: '#2BBAA0',
                flexShrink: 0,
            }}
        >
            {name.charAt(0) || '?'}
        </span>
    );
};
