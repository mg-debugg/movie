import { z } from 'zod';

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p';

function getApiKey(): string | undefined {
  const key = process.env.TMDB_API_KEY;
  return key && key.trim() ? key.trim() : undefined;
}

export function hasTmdbKey(): boolean {
  return Boolean(getApiKey());
}

function withKey(url: string): string {
  const key = getApiKey();
  if (!key) throw new Error('TMDB_API_KEY is missing');
  const u = new URL(url);
  u.searchParams.set('api_key', key);
  return u.toString();
}

export async function tmdbGet<T>(url: string, schema: z.ZodSchema<T>): Promise<T> {
  const res = await fetch(withKey(url), { headers: { accept: 'application/json' } });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`TMDB error: ${res.status} ${res.statusText}${text ? `: ${text}` : ''}`);
  }
  const json = await res.json();
  return schema.parse(json);
}

export function tmdbPosterUrl(path?: string | null, size: 'w185' | 'w342' = 'w342'): string | undefined {
  if (!path) return undefined;
  return `${TMDB_IMAGE_BASE}/${size}${path}`;
}

export function tmdbLogoUrl(path?: string | null, size: 'w45' | 'w92' = 'w45'): string | undefined {
  if (!path) return undefined;
  return `${TMDB_IMAGE_BASE}/${size}${path}`;
}

export function releaseYear(releaseDate?: string | null): number | undefined {
  if (!releaseDate) return undefined;
  const y = Number(releaseDate.slice(0, 4));
  return Number.isFinite(y) ? y : undefined;
}

export function tmdbUrl(path: string): string {
  return `${TMDB_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

