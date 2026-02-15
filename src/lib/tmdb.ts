import { z } from 'zod';

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p';

export const tmdbMovieSchema = z.object({
  id: z.number(),
  title: z.string(),
  release_date: z.string().optional().nullable(),
  poster_path: z.string().optional().nullable(),
});

const tmdbSearchSchema = z.object({
  results: z.array(tmdbMovieSchema),
});

const providerSchema = z.object({
  provider_id: z.number(),
  provider_name: z.string(),
  logo_path: z.string().optional().nullable(),
  display_priority: z.number().optional().nullable(),
});

export type TmdbProvider = z.infer<typeof providerSchema>;

export type TmdbCountryProviders = {
  link?: string | null;
  flatrate?: TmdbProvider[];
  free?: TmdbProvider[];
  rent?: TmdbProvider[];
  buy?: TmdbProvider[];
};

const countryProvidersSchema: z.ZodType<TmdbCountryProviders> = z.object({
  link: z.string().optional().nullable(),
  flatrate: z.array(providerSchema).optional(),
  free: z.array(providerSchema).optional(),
  rent: z.array(providerSchema).optional(),
  buy: z.array(providerSchema).optional(),
});

export type TmdbWatchProviders = { results: Record<string, TmdbCountryProviders> };

const tmdbWatchProvidersSchema: z.ZodType<TmdbWatchProviders> = z.object({
  results: z.record(z.string(), countryProvidersSchema),
});

function getApiKey(): string | undefined {
  const key = process.env.TMDB_API_KEY;
  return key && key.trim() ? key.trim() : undefined;
}

function withKey(url: string): string {
  const key = getApiKey();
  if (!key) throw new Error('TMDB_API_KEY is missing');
  const u = new URL(url);
  u.searchParams.set('api_key', key);
  return u.toString();
}

async function tmdbGet<T>(url: string, schema: z.ZodSchema<T>): Promise<T> {
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

export async function searchMovies(opts: {
  query: string;
  language: string;
  region?: string;
  page?: number;
}): Promise<Array<z.infer<typeof tmdbMovieSchema>>> {
  const u = new URL(`${TMDB_BASE_URL}/search/movie`);
  u.searchParams.set('query', opts.query);
  u.searchParams.set('language', opts.language);
  if (opts.region) u.searchParams.set('region', opts.region);
  u.searchParams.set('include_adult', 'false');
  u.searchParams.set('page', String(opts.page ?? 1));

  const data = await tmdbGet(u.toString(), tmdbSearchSchema);
  return data.results;
}

export async function getMovie(id: number, language: string): Promise<z.infer<typeof tmdbMovieSchema>> {
  const u = new URL(`${TMDB_BASE_URL}/movie/${id}`);
  u.searchParams.set('language', language);
  return tmdbGet(u.toString(), tmdbMovieSchema);
}

export async function getWatchProviders(id: number): Promise<z.infer<typeof tmdbWatchProvidersSchema>> {
  const u = new URL(`${TMDB_BASE_URL}/movie/${id}/watch/providers`);
  return tmdbGet(u.toString(), tmdbWatchProvidersSchema);
}

export function hasTmdbKey(): boolean {
  return Boolean(getApiKey());
}
