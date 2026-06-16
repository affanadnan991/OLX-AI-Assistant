/**
 * Format a date to a human-readable relative time string
 */
export function timeAgo(date: Date | string): string {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 60) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return then.toLocaleDateString();
}

/**
 * Format PKR currency
 */
export function formatPKR(amount: number): string {
  return `PKR ${amount.toLocaleString('en-PK')}`;
}

/**
 * Truncate a string to a specified length
 */
export function truncate(str: string, length: number = 100): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + '...';
}

/**
 * Get temperature badge class name
 */
export function getTempBadgeClass(temperature: string): string {
  switch (temperature) {
    case 'HOT': return 'badge-hot';
    case 'WARM': return 'badge-warm';
    case 'COLD': return 'badge-cold';
    case 'SPAM': return 'badge-spam';
    default: return '';
  }
}
