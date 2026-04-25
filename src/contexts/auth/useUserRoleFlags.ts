import { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { fetchCurrentUserRoleFlags } from '@/lib/userRoles';

export function useUserRoleFlags(user: User | null): {
    isTeacher: boolean;
    isDeveloper: boolean;
} {
    const [isTeacher, setIsTeacher] = useState(false);
    const [isDeveloper, setIsDeveloper] = useState(false);

    useEffect(() => {
        let cancelled = false;

        if (!user || user.is_anonymous) {
            setIsTeacher(false);
            setIsDeveloper(false);
            return;
        }

        setIsTeacher(false);
        setIsDeveloper(false);

        fetchCurrentUserRoleFlags()
            .then((roles) => {
                if (cancelled) return;
                setIsTeacher(roles.isTeacher);
                setIsDeveloper(roles.isDeveloper);
            })
            .catch((error) => {
                console.warn('[auth] Failed to fetch role flags:', error);
                if (cancelled) return;
                setIsTeacher(false);
                setIsDeveloper(false);
            });

        return () => {
            cancelled = true;
        };
    }, [user]);

    return { isTeacher, isDeveloper };
}
