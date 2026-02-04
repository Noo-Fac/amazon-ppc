// Format currency
export function formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(value);
}

// Format percentage
export function formatPercentage(value: number): string {
    return `${value.toFixed(2)}%`;
}

// Format number with commas
export function formatNumber(value: number): string {
    return new Intl.NumberFormat('en-US').format(value);
}

// Format compact number
export function formatCompact(value: number): string {
    if (value >= 1000000) {
        return `${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
        return `${(value / 1000).toFixed(1)}K`;
    }
    return value.toString();
}

// Get color class based on value threshold
export function getMetricColor(value: number, thresholds: { good: number; bad: number }, higherIsBetter: boolean = true): string {
    if (higherIsBetter) {
        if (value >= thresholds.good) return 'metric-positive';
        if (value <= thresholds.bad) return 'metric-negative';
    } else {
        if (value <= thresholds.good) return 'metric-positive';
        if (value >= thresholds.bad) return 'metric-negative';
    }
    return 'metric-neutral';
}

// Calculate percentage change
export function calculateChange(current: number, previous: number): number {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
}

// Debounce function
export function debounce<T extends (...args: unknown[]) => unknown>(
    func: T,
    wait: number
): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}

// Generate unique ID
export function generateId(): string {
    return Math.random().toString(36).substring(2, 15);
}

// Truncate text
export function truncate(text: string, length: number): string {
    if (text.length <= length) return text;
    return text.substring(0, length) + '...';
}

// Parse date string
export function parseDate(dateStr: string): Date {
    return new Date(dateStr);
}

// Format date for display
export function formatDate(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
}

// Format date for API
export function formatDateForApi(date: Date): string {
    return date.toISOString().split('T')[0];
}
