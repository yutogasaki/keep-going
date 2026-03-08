export type FilterType = 'all' | 'new' | 'inactive' | 'suspend' | 'duplicate' | 'multi' | 'suspended';

export interface ConfirmAction {
    accountId: string;
    type: 'suspend' | 'unsuspend' | 'delete';
}
