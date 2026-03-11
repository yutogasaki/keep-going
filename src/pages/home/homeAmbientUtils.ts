import type { PublicExercise } from '../../lib/publicExercises';
import type { PublicMenu } from '../../lib/publicMenuTypes';
import { getPublicMenuBadgeLabel } from './homeMenuUtils';

export type HomeAmbientCueKind =
    | 'public_menu_new'
    | 'public_menu_custom'
    | 'public_exercise';

export interface HomeAmbientCue {
    kind: HomeAmbientCueKind;
}

export function pickHomeAmbientCue(
    menus: PublicMenu[],
    exercises: PublicExercise[],
    now = Date.now(),
): HomeAmbientCue | null {
    if (menus.some((menu) => getPublicMenuBadgeLabel(menu, now) === 'New')) {
        return { kind: 'public_menu_new' };
    }

    if (menus.some((menu) => getPublicMenuBadgeLabel(menu, now) === 'みんなの種目あり')) {
        return { kind: 'public_menu_custom' };
    }

    if (exercises.length > 0) {
        return { kind: 'public_exercise' };
    }

    return null;
}
