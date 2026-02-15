import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';

type Suggestion = { id: number; title: string; year?: number; posterUrl?: string };

function BrandMark() {
  return (
    <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-rose-500/20 to-white/5 ring-1 ring-white/10">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M5 7.5c0-1.38 1.12-2.5 2.5-2.5h9C17.88 5 19 6.12 19 7.5v9c0 1.38-1.12 2.5-2.5 2.5h-9C6.12 19 5 17.88 5 16.5v-9Z"
          stroke="currentColor"
          strokeWidth="1.6"
          className="text-white/85"
        />
        <path
          d="M9 5v14M15 5v14"
          stroke="currentColor"
          strokeWidth="1.6"
          className="text-white/35"
        />
        <path
          d="M5 9h14M5 15h14"
          stroke="currentColor"
          strokeWidth="1.6"
          className="text-white/35"
        />
      </svg>
    </div>
  );
}

export function Header({
  siteName = '화원시네마',
  query,
  busy,
  suggestions,
  onQueryChange,
  onSubmit,
  onPickSuggestion,
}: {
  siteName?: string;
  query: string;
  busy: boolean;
  suggestions: Suggestion[];
  onQueryChange: (v: string) => void;
  onSubmit: () => void;
  onPickSuggestion: (id: number, title: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [openInfo, setOpenInfo] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node | null;
      if (!t) return;
      if (!rootRef.current?.contains(t)) {
        setOpen(false);
        setOpenInfo(false);
      }
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  return (
    <div ref={rootRef} className="sticky top-0 z-50 border-b border-white/10 bg-[#0b0b0f]/70 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <BrandMark />
          <div className="hidden sm:block">
            <div className="text-sm font-semibold text-white">{siteName}</div>
            <div className="text-xs text-white/55">KR OTT Finder</div>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-2xl">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              onSubmit();
              setOpen(false);
            }}
            className="relative"
          >
            <input
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              onFocus={() => setOpen(true)}
              placeholder="작품 제목을 검색하세요"
              className="h-11 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 pr-24 text-sm text-white placeholder:text-white/40 shadow-sm outline-none transition focus:border-white/20 focus:ring-2 focus:ring-rose-500/60"
            />
            <button
              type="submit"
              disabled={busy}
              className="absolute right-1 top-1 inline-flex h-9 items-center justify-center rounded-xl bg-rose-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-500 disabled:opacity-60"
            >
              {busy ? '검색 중…' : '검색'}
            </button>
          </form>

          {open && suggestions.length ? (
            <div className="absolute left-0 right-0 mt-2 overflow-hidden rounded-2xl border border-white/10 bg-[#0f0f16] shadow-[0_30px_120px_-60px_rgba(0,0,0,0.9)]">
              {suggestions.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-white/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/60"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    onPickSuggestion(s.id, s.title);
                    setOpen(false);
                  }}
                >
                  <span className="relative h-10 w-7 shrink-0 overflow-hidden rounded bg-white/[0.04]">
                    {s.posterUrl ? <Image src={s.posterUrl} alt={s.title} fill className="object-cover" /> : null}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-white">
                      {s.title}
                      {s.year ? <span className="text-white/45">{` (${s.year})`}</span> : null}
                    </span>
                  </span>
                  <span className="text-xs text-white/40">선택</span>
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div className="relative flex items-center gap-2">
          <button
            type="button"
            onClick={() => setOpenInfo((v) => !v)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-white/85 shadow-sm hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/60"
            aria-label="정보"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M12 17v-6"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                className="text-white/85"
              />
              <path
                d="M12 8h.01"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                className="text-white/85"
              />
              <path
                d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                stroke="currentColor"
                strokeWidth="1.6"
                className="text-white/35"
              />
            </svg>
          </button>

          {openInfo ? (
            <div className="absolute right-0 top-12 w-64 overflow-hidden rounded-2xl border border-white/10 bg-[#0f0f16] p-4 text-sm text-white/75 shadow-[0_30px_120px_-60px_rgba(0,0,0,0.9)]">
              <div className="text-sm font-semibold text-white">안내</div>
              <div className="mt-2 text-xs leading-5 text-white/65">
                제공처 정보는 데이터 소스에 따라 일부 누락될 수 있어요.
              </div>
              <div className="mt-3 text-xs text-white/55">키보드: Tab 이동, Enter 검색</div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

