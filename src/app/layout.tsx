import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from 'react-hot-toast';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'EduAI Pro — Plateforme de Formation Intelligente',
  description:
    'Plateforme LMS de nouvelle génération propulsée par des agents IA. Apprentissage adaptatif, parcours personnalisés et chatbot pédagogique pour une expérience d\'apprentissage révolutionnaire.',
  keywords: ['LMS', 'E-learning', 'Intelligence Artificielle', 'Formation en ligne', 'Apprentissage adaptatif'],
  openGraph: {
    title: 'EduAI Pro — Plateforme de Formation Intelligente',
    description: 'La plateforme d\'apprentissage qui s\'adapte à vous',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className="dark">
      <body className={`${inter.className} bg-[#04040a] text-white antialiased`}>
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: '#0d0d1a',
              color: '#f8fafc',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '12px',
            },
            success: {
              iconTheme: { primary: '#6366f1', secondary: '#fff' },
            },
          }}
        />
      </body>
    </html>
  );
}
