const MONTH_NAMES = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];

/**
 * Converts a month string to a sortable integer (YYYYMM).
 * Handles formats: "2025-01", "Jan 2025", "January 2025", "1/2025"
 */
export function parseMonthToSortable(monthStr: string): number {
  if (!monthStr || monthStr.trim() === '') return 0;
  const s = monthStr.trim();

  // ISO: 2025-01 or 2025-01-01
  const isoMatch = s.match(/^(\d{4})-(\d{1,2})/);
  if (isoMatch) {
    return parseInt(isoMatch[1]) * 100 + parseInt(isoMatch[2]);
  }

  // "Jan 2025" or "January 2025"
  const nameMatch = s.match(/^([A-Za-z]+)\s+(\d{4})$/);
  if (nameMatch) {
    const idx = MONTH_NAMES.indexOf(nameMatch[1].toLowerCase().slice(0, 3));
    if (idx >= 0) return parseInt(nameMatch[2]) * 100 + (idx + 1);
  }

  // "1/2025" or "01/2025"
  const slashMatch = s.match(/^(\d{1,2})\/(\d{4})$/);
  if (slashMatch) {
    return parseInt(slashMatch[2]) * 100 + parseInt(slashMatch[1]);
  }

  // Fallback: try native Date parse
  const d = new Date(s);
  if (!isNaN(d.getTime())) {
    return d.getFullYear() * 100 + (d.getMonth() + 1);
  }

  return 0;
}

export function isMonthAfter(monthA: string, monthB: string): boolean {
  return parseMonthToSortable(monthA) > parseMonthToSortable(monthB);
}

export function sortMonths(months: string[]): string[] {
  return [...months].sort((a, b) => parseMonthToSortable(a) - parseMonthToSortable(b));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatCurrencyPrecise(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? '')
    .join('');
}

export function getSalesforceUrl(combinedFunnelId: string): string {
  return `https://brightwheel1.lightning.force.com/lightning/r/Combined_Funnel__c/${combinedFunnelId}/view`;
}

/** Converts a string to a URL-safe slug: "Tyler Parrot" → "tyler-parrot" */
export function toSlug(str: string): string {
  return str.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

/** Generates and triggers a CSV download in the browser. */
export function downloadCSV(filename: string, headers: string[], rows: string[][]): void {
  const escape = (cell: string) => `"${cell.replace(/"/g, '""')}"`;
  const csv = [headers.map(escape).join(','), ...rows.map((r) => r.map(escape).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
