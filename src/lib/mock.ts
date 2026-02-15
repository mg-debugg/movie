import type { MovieProvidersResponse } from './types';

export function getMockProviders(queryOrId: string): MovieProvidersResponse {
  const q = String(queryOrId ?? '').trim().toLowerCase();
  const isParasite = q.includes('기생충') || q.includes('parasite');

  return {
    query: queryOrId,
    movie: {
      id: isParasite ? 496243 : 0,
      title: isParasite ? '기생충' : '샘플 영화',
      year: isParasite ? 2019 : 2024,
      posterUrl: undefined,
    },
    kr: {
      country: 'KR',
      exists: true,
      primaryProviders: isParasite
        ? [
            { key: 'netflix', name: 'Netflix', link: 'https://www.justwatch.com' },
            { key: 'tving', name: 'TVING', link: 'https://www.justwatch.com' },
          ]
        : [],
      paidProviders: {
        rent: [{ key: 'appletvplus', name: 'Apple TV+', link: 'https://www.justwatch.com' }],
        buy: [{ key: 'appletvplus', name: 'Apple TV+', link: 'https://www.justwatch.com' }],
      },
      showPaid: !isParasite,
    },
    fallback: {
      country: 'US',
      exists: true,
      primaryProviders: [{ key: 'netflix', name: 'Netflix', link: 'https://www.justwatch.com' }],
      paidProviders: { rent: [], buy: [] },
      showPaid: false,
    },
    usedMock: true,
    fromCache: false,
  };
}

