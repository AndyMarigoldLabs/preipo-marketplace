import DealRoomPage from './DealRoom';

export function generateStaticParams() {
  return [{ id: 'placeholder' }];
}

export default function Page() {
  return <DealRoomPage />;
}
