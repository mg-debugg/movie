import Image from 'next/image';

import type { ProviderView } from '@/lib/types';

export function ProvidersRow({
  providers,
  variant = 'pill',
}: {
  providers: ProviderView[];
  variant?: 'pill' | 'button';
}) {
  if (providers.length === 0) return null;

  const base =
    variant === 'button'
      ? 'inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/70'
      : 'inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white shadow-sm hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/70';

  return (
    <div className="flex flex-wrap gap-2">
      {providers.map((p) => (
        <a
          key={p.key}
          href={p.link ?? '#'}
          target="_blank"
          rel="noreferrer"
          className={base}
          aria-label={`${p.name}에서 보기`}
        >
          {p.logoUrl ? (
            <span className="relative h-5 w-5 overflow-hidden rounded">
              <Image src={p.logoUrl} alt={p.name} fill className="object-cover" />
            </span>
          ) : (
            <span className="h-5 w-5 rounded bg-white/10" />
          )}
          <span className="max-w-[12rem] truncate">{p.name}</span>
        </a>
      ))}
    </div>
  );
}

