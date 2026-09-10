export function normalizeCity(value) {
  return String(value || '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

export function displayCity(value) {
  return String(value || '').trim().replace(/\s+/g, ' ');
}
