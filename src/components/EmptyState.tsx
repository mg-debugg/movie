export function EmptyState({
  title = '한국 주요 OTT에서 찾지 못했어요',
  description = '영문 제목으로도 검색해보거나, 띄어쓰기/부제(파트) 표현을 바꿔보세요.',
}: {
  title?: string;
  description?: string;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-6 shadow-sm">
      <div className="text-lg font-semibold text-white">{title}</div>
      <div className="mt-2 text-sm leading-6 text-white/70">{description}</div>
      <div className="mt-4 grid gap-2 text-sm text-white/70 sm:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-black/30 p-4">
          <div className="font-semibold text-white/85">팁</div>
          <div className="mt-1">예: “Dune: Part Two”, “Parasite”</div>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/30 p-4">
          <div className="font-semibold text-white/85">참고</div>
          <div className="mt-1">제공처 정보는 데이터 소스에 따라 일부 누락될 수 있어요.</div>
        </div>
      </div>
    </div>
  );
}

