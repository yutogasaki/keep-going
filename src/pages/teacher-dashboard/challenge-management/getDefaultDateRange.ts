export function getDefaultDateRange(): { startDate: string; endDate: string } {
    const date = new Date();
    const startDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`;
    const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    const endDate = `${lastDay.getFullYear()}-${String(lastDay.getMonth() + 1).padStart(2, '0')}-${String(lastDay.getDate()).padStart(2, '0')}`;
    return { startDate, endDate };
}
