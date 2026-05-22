import dayjs from 'dayjs';

export function formatTokens(n) {
  if (n == null) return '-';
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export function formatCost(n) {
  if (n == null) return '-';
  return `$${n.toFixed(2)}`;
}

export function formatDate(str) {
  if (!str) return '-';
  return dayjs(str).format('YYYY-MM-DD');
}

export function formatMonth(str) {
  if (!str) return '-';
  return dayjs(str).format('YYYY-MM');
}

export function formatDateTime(iso) {
  if (!iso) return '-';
  return dayjs(iso).format('YYYY-MM-DD HH:mm');
}

export function formatDuration(start, end) {
  if (!start) return '-';
  const s = dayjs(start);
  const e = end ? dayjs(end) : dayjs();
  const minutes = e.diff(s, 'minute');
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
}

export function formatPercent(n) {
  if (n == null) return '-';
  return `${n.toFixed(1)}%`;
}
