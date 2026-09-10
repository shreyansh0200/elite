const DEMO = [
  { state: 'Uttar Pradesh', district: 'Kanpur Nagar', market: 'Kanpur', commodity: 'Wheat', variety: 'Local', grade: 'FAQ', arrival_date: new Date().toISOString().slice(0, 10), min_price: 2350, max_price: 2500, modal_price: 2450 },
  { state: 'Uttar Pradesh', district: 'Unnao', market: 'Unnao', commodity: 'Rice', variety: 'Common', grade: 'FAQ', arrival_date: new Date().toISOString().slice(0, 10), min_price: 2050, max_price: 2250, modal_price: 2180 },
  { state: 'Uttar Pradesh', district: 'Fatehpur', market: 'Fatehpur', commodity: 'Pulses', variety: 'Arhar', grade: 'FAQ', arrival_date: new Date().toISOString().slice(0, 10), min_price: 5900, max_price: 6500, modal_price: 6200 },
];

const DEFAULT_RESOURCE_ID = '9ef84268-d588-465a-a308-a864a43d0070';
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000;

function clean(value) {
  return String(value ?? '').trim();
}

function numeric(value) {
  if (value === null || value === undefined || value === '') return 0;
  const n = Number(String(value).replace(/,/g, ''));
  return Number.isFinite(n) ? n : 0;
}

function normalizeRecord(record = {}) {
  return {
    state: clean(record.State ?? record.state),
    district: clean(record.District ?? record.district),
    market: clean(record.Market ?? record.market),
    commodity: clean(record.Commodity ?? record.commodity),
    variety: clean(record.Variety ?? record.variety),
    grade: clean(record.Grade ?? record.grade),
    arrival_date: clean(record.Arrival_Date ?? record.arrival_date ?? record.ArrivalDate),
    min_price: numeric(record.Min_Price ?? record.min_price),
    max_price: numeric(record.Max_Price ?? record.max_price),
    modal_price: numeric(record.Modal_Price ?? record.modal_price),
  };
}

function demoRecords({ state, commodity, market, limit }) {
  const s = clean(state).toLowerCase();
  const c = clean(commodity).toLowerCase();
  const m = clean(market).toLowerCase();

  return DEMO.filter((r) =>
    (!s || r.state.toLowerCase().includes(s)) &&
    (!c || r.commodity.toLowerCase().includes(c)) &&
    (!m || r.market.toLowerCase().includes(m)),
  ).slice(0, limit);
}

function cacheKey({ state, commodity, market, limit }) {
  return JSON.stringify([clean(state).toLowerCase(), clean(commodity).toLowerCase(), clean(market).toLowerCase(), limit]);
}

async function fetchJson(url, timeoutMs = 12000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { signal: controller.signal, headers: { Accept: 'application/json' } });
    const text = await response.text();
    if (!response.ok) {
      throw new Error(`data.gov.in returned HTTP ${response.status}${text ? `: ${text.slice(0, 180)}` : ''}`);
    }
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error('data.gov.in returned a non-JSON response');
    }
    return data;
  } finally {
    clearTimeout(timer);
  }
}

export async function getMandiPrices({ state = '', commodity = '', market = '', limit = 50 } = {}) {
  const safeLimit = Math.min(Math.max(Number(limit) || 50, 1), 100);
  const requested = { state, commodity, market, limit: safeLimit };

  if (!process.env.DATA_GOV_API_KEY) {
    return { source: 'demo', live: false, warning: 'DATA_GOV_API_KEY is not configured.', records: demoRecords(requested) };
  }

  const key = cacheKey(requested);
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return { ...cached.value, cached: true };
  }

  const url = new URL(`https://api.data.gov.in/resource/${process.env.DATA_GOV_MANDI_RESOURCE_ID || DEFAULT_RESOURCE_ID}`);
  url.searchParams.set('api-key', process.env.DATA_GOV_API_KEY);
  url.searchParams.set('format', 'json');
  url.searchParams.set('limit', String(safeLimit));

  // These are the field names published by the mandi resource. Empty filters are omitted.
  if (clean(state)) url.searchParams.set('filters[state]', clean(state));
  if (clean(commodity)) url.searchParams.set('filters[commodity]', clean(commodity));
  if (clean(market)) url.searchParams.set('filters[market]', clean(market));

  try {
    const data = await fetchJson(url);
    const records = Array.isArray(data.records) ? data.records.map(normalizeRecord) : [];
    if (records.length === 0) {
      const value = {
        source: 'demo',
        live: false,
        cached: false,
        total: 0,
        records: demoRecords(requested),
        warning: 'Live data.gov.in returned no matching prices. Showing clearly labelled sample data.',
      };
      cache.set(key, { timestamp: Date.now(), value });
      return value;
    }

    const value = {
      source: 'data.gov.in',
      live: true,
      cached: false,
      total: Number(data.total ?? data.count ?? records.length) || records.length,
      records,
    };
    cache.set(key, { timestamp: Date.now(), value });
    return value;
  } catch (error) {
    console.warn('Mandi API failed:', error.message);
    const stale = cache.get(key)?.value;
    if (stale) return { ...stale, cached: true, warning: 'Live API was temporarily unavailable; showing cached government data.' };

    const demo = demoRecords(requested);
    return {
      source: 'demo',
      live: false,
      records: demo,
      warning: 'Live data.gov.in could not be reached. Showing clearly labelled sample data.',
    };
  }
}
