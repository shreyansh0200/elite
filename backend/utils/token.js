export function token(prefix='AGRI'){const d=Date.now().toString(36).slice(-5).toUpperCase();const r=Math.random().toString(36).slice(2,5).toUpperCase();return `${prefix}-${d}${r}`}

// IRCTC-style 10-digit numeric PNR for hub pickup tickets.
export function pnr(){const ts=Date.now().toString().slice(-7);const r=Math.floor(100+Math.random()*900);return `${ts}${r}`}
