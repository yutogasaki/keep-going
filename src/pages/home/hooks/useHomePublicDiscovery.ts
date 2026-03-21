import { useEffect, useMemo, useState } from 'react';
import { fetchRecommendedExercises, type PublicExercise } from '../../../lib/publicExercises';
import { fetchRecommendedMenus, type PublicMenu } from '../../../lib/publicMenus';
import { pickHomeAmbientCue } from '../homeAmbientUtils';

export function useHomePublicDiscovery(enabled = true) {
    const [menus, setMenus] = useState<PublicMenu[]>([]);
    const [exercises, setExercises] = useState<PublicExercise[]>([]);

    useEffect(() => {
        if (!enabled) {
            return;
        }

        let isActive = true;

        Promise.all([
            fetchRecommendedMenus(),
            fetchRecommendedExercises(),
        ]).then(([nextMenus, nextExercises]) => {
            if (!isActive) {
                return;
            }

            setMenus(nextMenus);
            setExercises(nextExercises);
        }).catch(console.warn);

        return () => {
            isActive = false;
        };
    }, [enabled]);

    const ambientCue = useMemo(
        () => pickHomeAmbientCue(menus, exercises),
        [exercises, menus],
    );

    return {
        recommendedMenus: menus,
        recommendedExercises: exercises,
        ambientCue,
    };
}
