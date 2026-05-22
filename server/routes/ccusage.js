import { Router } from 'express';
import { execFile } from 'child_process';
import Redis from 'ioredis';

const router = Router();

const redis = new Redis(process.env.REDIS_URL || 'redis://127.0.0.1:6379');
redis.on('error', (e) => console.error('Redis:', e.message));

const CACHE_TTL = 60;
const CACHE_PREFIX = 'ccusage:';

const CCUSAGE_PATH = process.env.CCUSAGE_PATH || 'ccusage';
const TIMEOUT = 30000;

async function getCache(key) {
  try {
    const raw = await redis.get(CACHE_PREFIX + key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

async function setCache(key, data) {
  try {
    await redis.set(CACHE_PREFIX + key, JSON.stringify(data), 'EX', CACHE_TTL);
  } catch {
    // ignore cache write errors
  }
}

function runCcusage(args) {
  return new Promise((resolve, reject) => {
    execFile(CCUSAGE_PATH, args, { timeout: TIMEOUT, maxBuffer: 10 * 1024 * 1024 }, (error, stdout, stderr) => {
      if (error) {
        reject({ error: error.message, stderr: stderr?.slice(0, 500), exitCode: error.code });
        return;
      }
      try {
        resolve(JSON.parse(stdout));
      } catch (parseError) {
        reject({ error: 'JSON parse error', raw: stdout.slice(0, 500) });
      }
    });
  });
}

function buildArgs(report, options) {
  const agent = options.agent && options.agent !== 'all' ? options.agent : null;
  const args = agent ? [agent, report, '--json', '--no-color'] : [report, '--json', '--no-color'];

  if (options.since) args.push('--since', options.since);
  if (options.until) args.push('--until', options.until);
  if (options.offline) args.push('--offline');
  if (options.active) args.push('--active');
  if (options.recent) args.push('--recent');
  if (options.breakdown) args.push('--breakdown');

  return args;
}

// ---- Codex format normalizer ----
function normalizeCodexEntry(entry, periodField = 'date') {
  const models = entry.models || {};
  const modelBreakdowns = Object.entries(models).map(([name, m]) => ({
    modelName: name,
    inputTokens: m.inputTokens || 0,
    outputTokens: m.outputTokens || 0,
    cacheReadTokens: m.cachedInputTokens || 0,
    cacheCreationTokens: 0,
    cost: m.cost || 0,
    totalTokens: m.totalTokens || 0,
  }));

  return {
    period: entry[periodField] || '',
    date: entry[periodField] || '',
    inputTokens: entry.inputTokens || 0,
    outputTokens: entry.outputTokens || 0,
    cacheReadTokens: entry.cachedInputTokens || 0,
    cacheCreationTokens: 0,
    totalTokens: entry.totalTokens || 0,
    totalCost: entry.costUSD || 0,
    modelsUsed: Object.keys(models),
    modelBreakdowns,
    metadata: {},
  };
}

function normalizeCodexSession(entry) {
  const models = entry.models || {};
  const modelBreakdowns = Object.entries(models).map(([name, m]) => ({
    modelName: name,
    inputTokens: m.inputTokens || 0,
    outputTokens: m.outputTokens || 0,
    cacheReadTokens: m.cachedInputTokens || 0,
    cacheCreationTokens: 0,
    cost: m.cost || 0,
  }));

  return {
    period: entry.sessionId || entry.directory || '',
    inputTokens: entry.inputTokens || 0,
    outputTokens: entry.outputTokens || 0,
    cacheReadTokens: entry.cachedInputTokens || 0,
    cacheCreationTokens: 0,
    totalTokens: entry.totalTokens || 0,
    totalCost: entry.costUSD || 0,
    modelsUsed: Object.keys(models),
    modelBreakdowns,
    metadata: { lastActivity: entry.lastActivity || '' },
    agent: '',
  };
}

// ---- Claude/opencode format normalizer ----
function normalizeClaudeEntry(entry, periodField = 'date') {
  return {
    period: entry[periodField] || entry.date || '',
    date: entry[periodField] || entry.date || '',
    inputTokens: entry.inputTokens || 0,
    outputTokens: entry.outputTokens || 0,
    cacheReadTokens: entry.cacheReadTokens || 0,
    cacheCreationTokens: entry.cacheCreationTokens || 0,
    totalTokens: entry.totalTokens || 0,
    totalCost: entry.totalCost || 0,
    modelsUsed: entry.modelsUsed || [],
    modelBreakdowns: (entry.modelBreakdowns || []).map((b) => ({
      modelName: b.modelName,
      inputTokens: b.inputTokens || 0,
      outputTokens: b.outputTokens || 0,
      cacheReadTokens: b.cacheReadTokens || 0,
      cacheCreationTokens: b.cacheCreationTokens || 0,
      cost: b.cost || 0,
    })),
    metadata: entry.metadata || {},
  };
}

function normalizeClaudeSession(entry) {
  return {
    period: entry.sessionId || entry.id || '',
    inputTokens: entry.inputTokens || 0,
    outputTokens: entry.outputTokens || 0,
    cacheReadTokens: entry.cacheReadTokens || 0,
    cacheCreationTokens: entry.cacheCreationTokens || 0,
    totalTokens: entry.totalTokens || 0,
    totalCost: entry.totalCost || 0,
    modelsUsed: entry.modelsUsed || [],
    modelBreakdowns: (entry.modelBreakdowns || []).map((b) => ({
      modelName: b.modelName,
      inputTokens: b.inputTokens || 0,
      outputTokens: b.outputTokens || 0,
      cacheReadTokens: b.cacheReadTokens || 0,
      cacheCreationTokens: b.cacheCreationTokens || 0,
      cost: b.cost || 0,
    })),
    metadata: entry.metadata || {},
    agent: entry.agent || '',
  };
}

// ---- Normalize report data based on agent ----
function normalizeReport(raw, report, agent) {
  if (!raw) return raw;
  if (agent === 'codex') {
    const key = report === 'session' ? 'sessions' : report;
    const entries = raw[key] || [];
    const periodField = report === 'weekly' ? 'week' : report === 'monthly' ? 'month' : 'date';

    const normalized = report === 'session'
      ? entries.map(normalizeCodexSession)
      : entries.map((e) => normalizeCodexEntry(e, periodField));

    const totals = raw.totals ? {
      totalTokens: raw.totals.totalTokens || 0,
      totalCost: raw.totals.costUSD || 0,
      inputTokens: raw.totals.inputTokens || 0,
      outputTokens: raw.totals.outputTokens || 0,
      cacheReadTokens: raw.totals.cachedInputTokens || 0,
      cacheCreationTokens: 0,
    } : undefined;

    const result = { [report]: normalized };
    if (totals) result.totals = totals;
    return result;
  }

  if (agent && agent !== 'all') {
    const key = report === 'session' ? 'sessions' : report;
    const entries = raw[key] || [];
    const periodField = report === 'weekly' ? 'week' : report === 'monthly' ? 'month' : 'date';

    const normalized = report === 'session'
      ? entries.map(normalizeClaudeSession)
      : entries.map((e) => normalizeClaudeEntry(e, periodField));

    const totals = raw.totals ? {
      totalTokens: raw.totals.totalTokens || 0,
      totalCost: raw.totals.totalCost || 0,
      inputTokens: raw.totals.inputTokens || 0,
      outputTokens: raw.totals.outputTokens || 0,
      cacheReadTokens: raw.totals.cacheReadTokens || 0,
      cacheCreationTokens: raw.totals.cacheCreationTokens || 0,
    } : undefined;

    const result = { [report]: normalized };
    if (totals) result.totals = totals;
    return result;
  }

  return raw;
}

function handleQuery(req) {
  const { since, until, offline, active, recent, breakdown, agent } = req.query;
  return {
    agent: agent || 'all',
    since: since || undefined,
    until: until || undefined,
    offline: offline === 'true',
    active: active === 'true',
    recent: recent === 'true',
    breakdown: breakdown === 'true',
  };
}

function makeCacheKey(url) {
  return url.replace(/[^a-zA-Z0-9?&=_/-]/g, '');
}

async function handleReport(req, res, report) {
  const cacheKey = makeCacheKey(req.originalUrl);
  const cached = await getCache(cacheKey);
  if (cached) {
    res.set('X-Cache', 'HIT');
    res.json(cached);
    return;
  }

  const opts = handleQuery(req);
  const args = buildArgs(report, opts);
  try {
    const raw = await runCcusage(args);
    const data = normalizeReport(raw, report, opts.agent);
    await setCache(cacheKey, data);
    res.set('X-Cache', 'MISS');
    res.json(data);
  } catch (err) {
    res.status(502).json({ error: `Failed to run ccusage ${report}`, details: err });
  }
}

router.get('/daily', (req, res) => handleReport(req, res, 'daily'));
router.get('/weekly', (req, res) => handleReport(req, res, 'weekly'));
router.get('/monthly', (req, res) => handleReport(req, res, 'monthly'));
router.get('/session', (req, res) => handleReport(req, res, 'session'));
router.get('/blocks', (req, res) => handleReport(req, res, 'blocks'));

router.get('/blocks/active', async (req, res) => {
  const cacheKey = makeCacheKey(req.originalUrl);
  const cached = await getCache(cacheKey);
  if (cached) {
    res.set('X-Cache', 'HIT');
    res.json(cached);
    return;
  }

  const opts = { ...handleQuery(req), active: true };
  const args = buildArgs('blocks', opts);
  try {
    const raw = await runCcusage(args);
    await setCache(cacheKey, raw);
    res.set('X-Cache', 'MISS');
    res.json(raw);
  } catch (err) {
    res.status(502).json({ error: 'Failed to run ccusage blocks --active', details: err });
  }
});

export default router;
