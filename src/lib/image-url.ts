const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p';

export function posterUrlFromPath(path?: string | null, size: 'w185' | 'w342' = 'w342'): string | undefined {
  if (!path || !path.trim()) return undefined;
  return `${TMDB_IMAGE_BASE}/${size}${path}`;
}

export function yearFromDate(date?: string | null): number | undefined {
  if (!date) return undefined;
  const y = Number(date.slice(0, 4));
  return Number.isFinite(y) ? y : undefined;
}
