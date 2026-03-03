export interface EmotionParticle {
    id: number;
    x: number;
    y: number;
    emoji: string;
}

export interface RippleState {
    id: number;
    x: number;
    y: number;
}

export interface DepartingInfo {
    name: string | null;
    type: number;
    stage: number;
    activeDays: number;
}

export type SayonaraModalState = 'farewell' | 'welcome' | null;
