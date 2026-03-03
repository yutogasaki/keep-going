export function formatDateShort(dateKey: string): string {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateKey);
    if (!match) {
        return dateKey;
    }
    return `${Number(match[2])}/${Number(match[3])}`;
}
