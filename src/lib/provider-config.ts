export type ProviderConfig = {
  key: string;
  name: string;
  order: number;
  matchIds?: number[];
  matchNames: string[];
};

// Whitelist + sort order (KR-focused)
export const PROVIDER_WHITELIST: ProviderConfig[] = [
  { key: 'netflix', name: 'Netflix', order: 0, matchNames: ['netflix'] },
  { key: 'disney', name: 'Disney+', order: 1, matchNames: ['disneyplus', 'disney plus', 'disney+'] },
  { key: 'tving', name: 'TVING', order: 2, matchNames: ['tving'] },
  { key: 'coupangplay', name: 'Coupang Play', order: 3, matchNames: ['coupangplay', 'coupang play'] },
  { key: 'wavve', name: 'Wavve', order: 4, matchNames: ['wavve'] },
  { key: 'watcha', name: 'Watcha', order: 5, matchNames: ['watcha', 'watcha play'] },
  {
    key: 'appletvplus',
    name: 'Apple TV+',
    order: 6,
    matchNames: ['appletvplus', 'apple tv plus', 'apple tv+', 'apple tv'],
  },
];

const byKey = new Map(PROVIDER_WHITELIST.map((p) => [p.key, p]));

function normalizeName(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/\+/g, 'plus')
    .replace(/[^a-z0-9]+/g, '');
}

export function matchProvider(input: { provider_id?: number; provider_name: string }): ProviderConfig | null {
  const id = input.provider_id;
  if (typeof id === 'number') {
    for (const p of PROVIDER_WHITELIST) {
      if (p.matchIds?.includes(id)) return p;
    }
  }

  const n = normalizeName(input.provider_name);
  for (const p of PROVIDER_WHITELIST) {
    for (const mn of p.matchNames) {
      if (n === normalizeName(mn)) return p;
    }
  }
  return null;
}

export function sortProviders<T extends { key: string }>(arr: T[]): T[] {
  return [...arr].sort((a, b) => {
    const pa = byKey.get(a.key)?.order ?? 999;
    const pb = byKey.get(b.key)?.order ?? 999;
    return pa - pb;
  });
}
