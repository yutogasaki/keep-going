import type { MenuSectionVisibilityState } from './types';

const MENU_SECTION_KEYS: Array<keyof MenuSectionVisibilityState> = [
    'standard',
    'teacher',
    'custom',
];

export function toggleMenuSection(
    current: MenuSectionVisibilityState,
    sectionId: keyof MenuSectionVisibilityState,
    nextExpanded: boolean,
): MenuSectionVisibilityState {
    if (!nextExpanded) {
        return {
            ...current,
            [sectionId]: false,
        };
    }

    return MENU_SECTION_KEYS.reduce<MenuSectionVisibilityState>((next, key) => {
        next[key] = key === sectionId;
        return next;
    }, {});
}
