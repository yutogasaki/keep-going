export type FilterType = 'all' | 'inactive' | 'multi' | 'suspended' | 'temporary';

export interface ConfirmAction {
    accountId: string;
    type: 'suspend' | 'unsuspend' | 'delete';
}
