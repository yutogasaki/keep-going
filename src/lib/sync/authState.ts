let accountId: string | null = null;
let pulling = false;

export function setAccountId(id: string | null): void {
    accountId = id;
}

export function getAccountId(): string | null {
    return accountId;
}

export function isPulling(): boolean {
    return pulling;
}

export function setPulling(value: boolean): void {
    pulling = value;
}
