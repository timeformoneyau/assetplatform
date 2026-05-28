export function fmtDate(s: string): string {
  const d = new Date(s + 'T00:00:00');
  return d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function fmtKm(n: number | null | undefined): string {
  return n != null ? n.toLocaleString('en-AU') + ' km' : '—';
}

export function fmtMoney(n: number | null | undefined): string {
  if (n == null) return '—';
  if (n === 0) return 'Warranty / no charge';
  return '$' + n.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function timeAgo(s: string): string {
  const d = new Date(s);
  const days = Math.floor((Date.now() - d.getTime()) / 86400000);
  if (days < 1) return 'today';
  if (days < 30) return `${days}d ago`;
  if (days < 365) return `${Math.floor(days / 30)} months ago`;
  return `${(days / 365).toFixed(1)} years ago`;
}

export function truncate(s: string, n: number): string {
  return s.length > n ? s.slice(0, n) + '…' : s;
}

export function stripNumeric(s: string): number {
  return parseInt(s.replace(/[^\d]/g, ''), 10) || 0;
}
