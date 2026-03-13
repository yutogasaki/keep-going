import type { HomeAfterglow } from '../homeAfterglow';
import type { HomeAnnouncement } from '../homeAnnouncementUtils';
import type { HomeAmbientCue } from '../homeAmbientUtils';
import type { HomeVisitRecency } from '../homeVisitMemory';
import type { FuwafuwaMilestoneEvent } from '../../../store/useAppStore';

export type FuwafuwaSpeechAccent = 'everyday' | 'magic' | 'event' | 'ambient';
export type FuwafuwaSpeechCategory =
    | 'action_hint'
    | 'event_notice'
    | 'progress'
    | 'relationship'
    | 'mechanic_hint';

export type FuwafuwaDailyGroup = 'everyday' | 'magic' | 'ambient';
export type FuwafuwaDailyTopic = 'greeting' | 'mood' | 'mechanic' | 'progress' | 'omen' | 'growth' | 'ambient' | 'naming';

export interface FuwafuwaDailySelection {
    group: FuwafuwaDailyGroup;
    topic: FuwafuwaDailyTopic;
    replyIndex: number;
}

export interface FuwafuwaSpeech {
    id: string;
    category: FuwafuwaSpeechCategory;
    accent: FuwafuwaSpeechAccent;
    lines: string[];
    actionLabel?: string;
    dailyGroup?: FuwafuwaDailyGroup;
    dailyTopic?: FuwafuwaDailyTopic;
    replyId?: string;
}

export interface FamilyMilestoneLead {
    kind: FuwafuwaMilestoneEvent['kind'];
    userId: string;
    userName: string;
    hasMultiple: boolean;
}

export type FuwafuwaSpeechTopic =
    | 'milestone'
    | 'delivery'
    | 'action'
    | 'announcement'
    | 'afterglow'
    | 'growth'
    | 'greeting'
    | 'mood'
    | 'omen'
    | 'progress'
    | 'ambient'
    | 'mechanic'
    | 'naming';

export type FuwafuwaEventTopic =
    | 'milestone'
    | 'delivery'
    | 'action'
    | 'announcement'
    | 'afterglow';

export interface FamilySpeechContext {
    activeCount: number;
    percent: number;
    displaySeconds: number;
    isMagicDeliveryActive: boolean;
    announcement: HomeAnnouncement | null;
    ambientCue: HomeAmbientCue | null;
    milestoneLead: FamilyMilestoneLead | null;
    recentAfterglow: HomeAfterglow | null;
    visitRecency: HomeVisitRecency;
    depth: number;
    variantSeed: number;
    idleBeat: number;
}

export interface UserSpeechContext {
    percent: number;
    displaySeconds: number;
    isMagicDeliveryActive: boolean;
    stage: number;
    activeDays: number;
    daysAlive: number;
    announcement: HomeAnnouncement | null;
    ambientCue: HomeAmbientCue | null;
    recentMilestoneEvent: FuwafuwaMilestoneEvent | null;
    recentAfterglow: HomeAfterglow | null;
    visitRecency: HomeVisitRecency;
    depth: number;
    variantSeed: number;
    idleBeat: number;
}
