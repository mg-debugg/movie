import Image from 'next/image';

import type { MovieSummary, RegionProviders } from '@/lib/types';

import { ProvidersRow } from './ProvidersRow';

export function HeroResult({
  movie,
  region,
  mainCopy = '지금 한국 주요 OTT에서 바로 볼 수 있는 작품을 찾아보세요.',
}: {
  movie: MovieSummary;
  region: RegionProviders;
  mainCopy?: string;
}) {
  const title = `${movie.title}${movie.year ? ` (${movie.year})` : ''}`;

  return (
    <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] shadow-[0_30px_120px_-60px_rgba(0,0,0,0.9)]">
      <div className="absolute inset-0">
        {movie.posterUrl ? (
          <Image src={movie.posterUrl} alt={movie.title} fill className="object-cover opacity-25 blur-[2px]" />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0b0b0f] via-[#0b0b0f]/75 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
      </div>

      <div className="relative grid gap-6 p-6 sm:grid-cols-[180px_1fr] sm:gap-8 sm:p-8">
        <div className="relative mx-auto aspect-[2/3] w-40 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] shadow-sm sm:mx-0 sm:w-full">
          {movie.posterUrl ? <Image src={movie.posterUrl} alt={movie.title} fill className="object-cover" /> : null}
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 text-xs text-white/70">
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1">KR 기준</span>
            {region.exists ? (
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1">
                {region.primaryProviders.length ? '주요 제공처 확인됨' : '주요 제공처 없음'}
              </span>
            ) : (
              <span className="rounded-full border border-amber-400/30 bg-amber-500/10 px-3 py-1 text-amber-200">
                KR 데이터 없음
              </span>
            )}
          </div>

          <h2 className="mt-3 text-balance text-2xl font-semibold tracking-tight text-white sm:text-3xl">{title}</h2>
          <p className="mt-2 text-sm leading-6 text-white/70">{mainCopy}</p>

          {region.message ? (
            <div className="mt-4 rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white/75">
              {region.message}
            </div>
          ) : null}

          {region.primaryProviders.length ? (
            <div className="mt-5">
              <div className="mb-2 text-xs font-semibold tracking-wide text-white/70">바로 보기</div>
              <ProvidersRow providers={region.primaryProviders} variant="button" />
            </div>
          ) : null}

          {region.showPaid ? (
            <div className="mt-5 rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white/75">
              추가 결제 없이 볼 수 있는 제공처가 없습니다.
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

