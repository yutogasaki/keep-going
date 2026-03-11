import { DISPLAY_TERMS } from '../../../lib/terminology';

export type MenuTab = 'group' | 'individual';

export interface MenuSectionVisibilityState {
    teacher?: boolean;
    custom?: boolean;
}

export const MENU_TABS: { id: MenuTab; label: string }[] = [
    { id: 'group', label: DISPLAY_TERMS.groupTab },
    { id: 'individual', label: DISPLAY_TERMS.exerciseTab },
];
