import { HeroSection } from '@/components/landing/HeroSection';
import { FeaturesGrid } from '@/components/landing/FeaturesGrid';
import { CTASection } from '@/components/landing/CTASection';

export default function Home() {
  return (
    <div style={{ background: 'linear-gradient(to bottom, #0A0A0B 0%, #0F1419 100%)' }}>
      <HeroSection />
      <FeaturesGrid />
      <CTASection />
    </div>
  );
}
