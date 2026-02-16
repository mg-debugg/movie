import { ContentDetail } from '@/components/ContentDetail';

export default function TvDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const num = Number(id);
  return <ContentDetail media_type="tv" id={Number.isFinite(num) ? num : 0} />;
}
