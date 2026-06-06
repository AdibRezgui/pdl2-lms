'use client';

import { Brain, Sparkles, Users } from 'lucide-react';
import ScrollExpandMedia from '@/components/ui/scroll-expansion-hero';

const highlights = [
  {
    icon: <Brain size={18} style={{ color: '#8b6ef2' }} />,
    title: 'Parcours sur mesure',
    text: "Notre IA analyse votre niveau et votre rythme pour composer un programme qui s'adapte à vous, et non l'inverse.",
  },
  {
    icon: <Sparkles size={18} style={{ color: '#e85586' }} />,
    title: 'Mentorat intelligent',
    text: 'Un chatbot expert répond à vos questions 24/7, débloque les notions difficiles et garde votre motivation intacte.',
  },
  {
    icon: <Users size={18} style={{ color: '#1f9d6f' }} />,
    title: 'Communauté active',
    text: 'Rejoignez plus de 12 000 apprenants qui progressent ensemble, échangent et célèbrent chaque réussite.',
  },
];

export default function ScrollShowcase() {
  return (
    <div className="relative" style={{ background: 'linear-gradient(160deg,#fffdfb 0%,#fdf2f8 60%,#f6f0ff 100%)' }}>
      <ScrollExpandMedia
        mediaType="image"
        mediaSrc="/images/hero-illustration.png"
        bgImageSrc="/images/hero-illustration.png"
        title="Une expérience qui s'adapte à vous"
        date="EduAI Pro — Expérience immersive"
        scrollToExpand="Faites défiler pour explorer"
      >
        <div className="max-w-5xl mx-auto">
          <h3 className="text-2xl sm:text-3xl font-bold text-center mb-4 tracking-[-0.02em]" style={{ color: '#221f2c' }}>
            Conçu pour{' '}
            <span
              style={{
                background: 'linear-gradient(135deg,#a78bfa,#fb7299)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              transformer votre façon d&apos;apprendre
            </span>
          </h3>
          <p className="text-center max-w-2xl mx-auto mb-12 leading-relaxed" style={{ color: '#948da3' }}>
            Chaque parcours, chaque recommandation et chaque session de mentorat est façonnée par
            l&apos;IA pour vous faire progresser plus vite — sans jamais perdre la dimension humaine
            de l&apos;apprentissage.
          </p>

          <div className="grid sm:grid-cols-3 gap-5">
            {highlights.map((h, i) => (
              <div
                key={i}
                className="rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1"
                style={{
                  background: 'rgba(255,255,255,.6)',
                  border: '1px solid rgba(167,139,250,.14)',
                  backdropFilter: 'blur(16px)',
                  boxShadow: '0 8px 28px rgba(167,139,250,.12)',
                }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: 'rgba(167,139,250,.12)', border: '1px solid rgba(167,139,250,.18)' }}
                >
                  {h.icon}
                </div>
                <h4 className="font-semibold mb-2" style={{ color: '#221f2c' }}>{h.title}</h4>
                <p className="text-sm leading-relaxed" style={{ color: '#948da3' }}>{h.text}</p>
              </div>
            ))}
          </div>
        </div>
      </ScrollExpandMedia>
    </div>
  );
}
