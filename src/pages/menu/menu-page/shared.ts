export interface MenuOverrideValue {
    name: string | null;
    description: string | null;
    emoji: string | null;
    sec: number | null;
    hasSplit: boolean | null;
    exerciseIds: string[] | null;
    displayMode: string | null;
}

export type MenuOverrideMap = Map<string, MenuOverrideValue>;

export interface MenuToastMessage {
    text: string;
    type: 'success' | 'error';
}
