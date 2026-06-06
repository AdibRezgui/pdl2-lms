import Navbar from '@/components/landing/Navbar';
import Hero from '@/components/landing/Hero';
import ScrollShowcase from '@/components/landing/ScrollShowcase';
import Stats from '@/components/landing/Stats';
import Features from '@/components/landing/Features';
import HowItWorks from '@/components/landing/HowItWorks';
import CoursesPreview from '@/components/landing/CoursesPreview';
import Testimonials from '@/components/landing/Testimonials';
import Pricing from '@/components/landing/Pricing';
import FAQ from '@/components/landing/FAQ';
import CTABanner from '@/components/landing/CTABanner';
import Footer from '@/components/landing/Footer';

export const metadata = {
  title: 'EduAI Pro — Maîtrisez n\'importe quelle compétence avec l\'IA',
  description:
    'La plateforme de formation intelligente propulsée par l\'IA. Parcours personnalisés, chatbot 24/7, certifications reconnues. Rejoignez 12 000+ apprenants.',
};

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#020209]">
      <Navbar />
      <Hero />
      <ScrollShowcase />
      <Stats />
      <Features />
      <HowItWorks />
      <CoursesPreview />
      <Testimonials />
      <Pricing />
      <FAQ />
      <CTABanner />
      <Footer />
    </main>
  );
}
