export type FilterType =
    | 'all'
    | 'new'
    | 'inactive'
    | 'suspend'
    | 'cleanup'
    | 'duplicate'
    | 'multi'
    | 'suspended';

export interface ConfirmAction {
    type: 'suspend' | 'unsuspend' | 'delete' | 'bulk_suspend' | 'bulk_delete' | 'delete_member' | 'bulk_delete_members';
    subjectLabel: string;
    description?: string;
    accountId?: string;
    accountIds?: string[];
    memberId?: string;
    memberIds?: string[];
}
