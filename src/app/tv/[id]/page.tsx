import { ContentDetail } from '@/components/ContentDetail';
import { notFound } from 'next/navigation';

export default function TvDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const num = Number(id);
  if (!Number.isFinite(num) || num <= 0) notFound();
  return <ContentDetail media_type="tv" id={num} />;
}
