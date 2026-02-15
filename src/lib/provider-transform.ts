import type { PaidProviders, ProviderView, RegionProviders } from './types';
import type { TmdbCountryProviders, TmdbProvider } from './tmdb';
import { tmdbLogoUrl } from './tmdb';
import { matchProvider, sortProviders } from './provider-config';

function dedupByKey(arr: ProviderView[]): ProviderView[] {
  const m = new Map<string, ProviderView>();
  for (const p of arr) {
    if (!m.has(p.key)) m.set(p.key, p);
  }
  return Array.from(m.values());
}

function toViews(opts: {
  providers: TmdbProvider[] | undefined;
  link?: string | null;
}): ProviderView[] {
  const dedup = new Map<string, ProviderView>();

  for (const p of opts.providers ?? []) {
    const m = matchProvider({ provider_id: p.provider_id, provider_name: p.provider_name });
    if (!m) continue;
    if (dedup.has(m.key)) continue;

    dedup.set(m.key, {
      key: m.key,
      name: m.name,
      logoUrl: tmdbLogoUrl(p.logo_path),
      link: opts.link ?? undefined,
    });
  }

  return sortProviders(Array.from(dedup.values()));
}

export function buildRegionProviders(country: string, entry?: TmdbCountryProviders): RegionProviders {
  if (!entry) {
    return {
      country,
      exists: false,
      message: country === 'KR' ? '한국(KR) 제공처 데이터가 없습니다.' : undefined,
      primaryProviders: [],
      paidProviders: { rent: [], buy: [] },
      showPaid: false,
    };
  }

  const flatrate = toViews({ providers: entry.flatrate, link: entry.link });
  const free = toViews({ providers: entry.free, link: entry.link });
  const rent = toViews({ providers: entry.rent, link: entry.link });
  const buy = toViews({ providers: entry.buy, link: entry.link });

  const primaryProviders = sortProviders(dedupByKey([...flatrate, ...free]));
  const paidProviders: PaidProviders = { rent, buy };
  const showPaid = primaryProviders.length === 0;

  return {
    country,
    exists: true,
    primaryProviders,
    paidProviders,
    showPaid,
  };
}
