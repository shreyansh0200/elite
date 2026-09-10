// Fare rule for hub pickup tickets (IRCTC-style slot booking):
// ₹100 per 36 quintal block, rounded UP to the next block — same way a train
// fare is charged per class/berth regardless of a passenger being "partial".
export const FARE_PER_BLOCK = 100;
export const BLOCK_QUINTAL = 36;

// Converts a farmer-entered quantity (Quintal / Kg / Ton) into quintal,
// since slot capacity and fare are always calculated in quintal.
export function toQuintal(quantity, unit) {
  const n = Number(quantity) || 0;
  switch (String(unit || 'Quintal').trim().toLowerCase()) {
    case 'kg':
      return n / 100;
    case 'ton':
    case 'tonne':
      return n * 10;
    case 'quintal':
    default:
      return n;
  }
}

// ₹100 per 36 quintal (or part thereof) — mirrors a fixed fare slab.
export function computeFare(quintalEquivalent) {
  const q = Number(quintalEquivalent) || 0;
  if (q <= 0) return 0;
  return Math.ceil(q / BLOCK_QUINTAL) * FARE_PER_BLOCK;
}
