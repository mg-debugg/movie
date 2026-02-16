import { ContentDetail } from '@/components/ContentDetail';

export default function MovieDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const num = Number(id);
  return <ContentDetail media_type="movie" id={Number.isFinite(num) ? num : 0} />;
}
