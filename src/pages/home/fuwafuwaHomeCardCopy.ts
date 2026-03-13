// Keep import paths stable while the speech content lives in smaller modules.
export type {
    FamilyMilestoneLead,
    FuwafuwaDailyGroup,
    FuwafuwaDailySelection,
    FuwafuwaDailyTopic,
    FuwafuwaSpeech,
    FuwafuwaSpeechAccent,
    FuwafuwaSpeechCategory,
} from './fuwafuwa-home-card-copy/types';
export {
    getFamilyDailySpeech,
    getFamilyEventSpeech,
} from './fuwafuwa-home-card-copy/family';
export {
    getSoftProgress,
    getSoftProgressShort,
    getStageLabel,
} from './fuwafuwa-home-card-copy/shared';
export {
    getUserDailySpeech,
    getUserEventSpeech,
} from './fuwafuwa-home-card-copy/user';
