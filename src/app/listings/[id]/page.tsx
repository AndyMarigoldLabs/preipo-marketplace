import { mockListings } from '@/lib/mock-data';
import ListingDetailPage from './ListingDetail';

export function generateStaticParams() {
  return mockListings.map((l) => ({ id: l.id }));
}

export default function Page() {
  return <ListingDetailPage />;
}
