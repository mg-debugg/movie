import { ContentDetail } from '@/components/ContentDetail';
import { notFound } from 'next/navigation';

type Params = { id: string };

export default async function MovieDetailPage({ params }: { params: Promise<Params> | Params }) {
  // Next.js 15+ may pass `params` as a Promise.
  const { id } = await params;
  const num = Number.parseInt(id, 10);
  if (!Number.isFinite(num) || num <= 0) notFound();
  return <ContentDetail media_type="movie" id={num} />;
}
