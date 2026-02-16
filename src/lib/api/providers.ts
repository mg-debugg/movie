import { z } from 'zod';

import type { RegionProviders } from '@/lib/types';
import { buildRegionProviders } from '@/lib/provider-transform';

import { tmdbGet, tmdbUrl } from './_client';

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

export async function getWatchProviders(opts: {
  media_type: 'movie' | 'tv';
  id: number;
}): Promise<TmdbWatchProviders> {
  const u = new URL(tmdbUrl(`/${opts.media_type}/${opts.id}/watch/providers`));
  return tmdbGet(u.toString(), tmdbWatchProvidersSchema);
}

export async function getProvidersForKorea(opts: {
  media_type: 'movie' | 'tv';
  id: number;
}): Promise<{ kr: RegionProviders; fallback?: RegionProviders }> {
  const providers = await getWatchProviders(opts);

  const krEntry = providers.results['KR'];
  const usEntry = providers.results['US'];

  const kr = buildRegionProviders('KR', krEntry);
  const fallback = !krEntry && usEntry ? buildRegionProviders('US', usEntry) : undefined;

  return { kr, fallback };
}

