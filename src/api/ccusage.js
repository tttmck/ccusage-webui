const API_BASE = '/api/ccusage';

async function fetchApi(path, params) {
  const p = params || {};
  const query = new URLSearchParams();
  if (p.agent && p.agent !== 'all') query.set('agent', p.agent);
  if (p.since) query.set('since', p.since);
  if (p.until) query.set('until', p.until);
  if (p.offline) query.set('offline', 'true');

  const qs = query.toString();
  const url = `${API_BASE}${path}${qs ? `?${qs}` : ''}`;

  const res = await fetch(url);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export function fetchDaily(params) { return fetchApi('/daily', params); }
export function fetchWeekly(params) { return fetchApi('/weekly', params); }
export function fetchMonthly(params) { return fetchApi('/monthly', params); }
export function fetchSession(params) { return fetchApi('/session', params); }
export function fetchBlocks(params) { return fetchApi('/blocks', params); }
export function fetchActiveBlock(params) { return fetchApi('/blocks/active', params); }
