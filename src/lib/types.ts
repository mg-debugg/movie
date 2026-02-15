export type MovieSummary = {
  id: number;
  title: string;
  year?: number;
  posterUrl?: string;
};

export type ProviderView = {
  key: string; // stable canonical key (for React keys + dedupe)
  name: string;
  logoUrl?: string;
  link?: string;
};

export type PaidProviders = {
  rent: ProviderView[];
  buy: ProviderView[];
};

export type RegionProviders = {
  country: string; // e.g. "KR"
  exists: boolean; // TMDB results[country] exists
  message?: string;
  primaryProviders: ProviderView[]; // flatrate + free (no labels in UI)
  paidProviders: PaidProviders; // rent/buy (only shown when showPaid === true)
  showPaid: boolean; // derived: primaryProviders.length === 0
};

export type MovieProvidersResponse = {
  query?: string;
  movie: MovieSummary;

  // Always describes KR as the primary region per requirement.
  kr: RegionProviders;

  // Optional folded fallback result (e.g. US) when KR is missing.
  fallback?: RegionProviders;

  usedMock: boolean;
  fromCache: boolean;
};

