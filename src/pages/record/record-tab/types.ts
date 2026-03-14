import type {
    RecordHistoryAccordionSection,
    RecordSuggestionSummary,
    RecordTopExerciseChip,
    TodayRecordSummary,
    TwoWeekRecordSummary,
} from '../recordOverviewSummary';

export interface RecordTabContentProps {
    loading: boolean;
    todaySummary: TodayRecordSummary;
    twoWeekSummary: TwoWeekRecordSummary;
    suggestion: RecordSuggestionSummary;
    topExercises: RecordTopExerciseChip[];
    historySections: RecordHistoryAccordionSection[];
    onSuggestionClick: () => void;
    canCreatePersonalChallenge?: boolean;
    onCreatePersonalChallengeFromExercise?: (exercise: RecordTopExerciseChip) => void;
}
