import { Navigation } from '@/components/layout/Navigation';

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navigation />
      {children}
    </>
  );
}
