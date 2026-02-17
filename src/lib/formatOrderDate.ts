export function formatDate(isoString: string) {
    if (!isoString) return "N/A";
    const date = new Date(isoString);

    return date.toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });
}