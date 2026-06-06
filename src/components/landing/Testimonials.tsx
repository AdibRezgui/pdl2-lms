'use client';

import { motion } from 'framer-motion';
import { Star, Quote } from 'lucide-react';

const testimonials = [
  {
    name: 'Mariam Touati',
    role: 'Data Engineer',
    company: 'Orange Tunisie',
    avatar: 'MT',
    rating: 5,
    text: 'EduAI Pro a transformé ma façon d\'apprendre. Le chatbot IA m\'a aidée à surmonter mes blocages en Python et les parcours personnalisés m\'ont permis de progresser 3× plus vite. J\'ai décroché mon poste grâce à cette formation !',
    course: 'Data Science avec Python',
    color: 'from-indigo-500 to-violet-600',
    featured: true,
  },
  {
    name: 'Karim Benali',
    role: 'Développeur Full-Stack',
    company: 'Freelance',
    avatar: 'KB',
    rating: 5,
    text: 'La qualité est exceptionnelle. L\'adaptive learning sait exactement où je dois m\'améliorer et propose les ressources adéquates. En 6 mois, j\'ai triplé mes revenus en freelance.',
    course: 'Développement Web Full-Stack',
    color: 'from-cyan-500 to-blue-600',
    featured: false,
  },
  {
    name: 'Sara Kadri',
    role: 'Ingénieure DevOps',
    company: 'Sofrecom',
    avatar: 'SK',
    rating: 5,
    text: 'J\'étais sceptique sur l\'IA dans l\'apprentissage, mais j\'ai été bluffée. Les évaluations sont parfaitement adaptées et le niveau de personnalisation est incroyable. Je recommande à 100%.',
    course: 'DevOps & Cloud Computing',
    color: 'from-emerald-500 to-teal-600',
    featured: false,
  },
  {
    name: 'Amine Zouari',
    role: 'CTO & Fondateur',
    company: 'TechStart',
    avatar: 'AZ',
    rating: 5,
    text: 'Nous formons toute notre équipe avec EduAI Pro. Les analytics permettent de suivre l\'évolution de chaque collaborateur avec précision. ROI exceptionnel vs. formations traditionnelles.',
    course: 'Intelligence Artificielle & ML',
    color: 'from-amber-500 to-orange-600',
    featured: false,
  },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};

const cardVariant = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.23, 1, 0.32, 1] } },
};

function Stars({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: count }).map((_, i) => (
        <Star key={i} size={13} className="text-amber-400 fill-amber-400" />
      ))}
    </div>
  );
}

export default function Testimonials() {
  const featured = testimonials[0];
  const rest = testimonials.slice(1);

  return (
    <section id="testimonials" className="relative py-28 sm:py-36 overflow-hidden">
      {/* Bg glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-violet-600/[0.04] blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.23,1,0.32,1] }}
          className="text-center mb-16"
        >
          <div className="section-badge mb-6 mx-auto w-fit">
            <Star size={13} className="text-amber-400 fill-amber-400" />
            Témoignages clients
          </div>
          <h2 className="text-4xl sm:text-5xl font-black text-white tracking-tight mb-5">
            Ils ont transformé
            <br />
            <span className="gradient-text">leur carrière avec nous</span>
          </h2>
          <p className="text-slate-400 text-lg max-w-xl mx-auto">
            Plus de 12 000 apprenants font confiance à EduAI Pro.
            Voici leurs histoires.
          </p>
        </motion.div>

        {/* Testimonials layout: featured left + grid right */}
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-60px' }}
          className="grid grid-cols-1 lg:grid-cols-5 gap-5"
        >
          {/* Featured testimonial */}
          <motion.div
            variants={cardVariant}
            className="lg:col-span-2 relative p-7 sm:p-8 rounded-2xl bg-white/[0.03] border border-white/[0.08] overflow-hidden group hover:border-white/[0.14] transition-all duration-300 flex flex-col"
          >
            {/* Gradient top accent */}
            <div className={`absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r ${featured.color}`} />

            {/* Large quote mark */}
            <div className="absolute top-6 right-6 opacity-[0.07]">
              <Quote size={70} className="text-white" />
            </div>

            <Stars count={featured.rating} />
            <blockquote className="mt-5 text-base sm:text-lg text-slate-200 leading-relaxed flex-1">
              &ldquo;{featured.text}&rdquo;
            </blockquote>

            {/* Course tag */}
            <div className="mt-6 mb-5 inline-flex">
              <span className="px-3 py-1 rounded-full text-[11px] font-medium bg-indigo-500/10 border border-indigo-500/20 text-indigo-300">
                {featured.course}
              </span>
            </div>

            <div className="flex items-center gap-3 pt-5 border-t border-white/[0.06]">
              <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${featured.color} flex items-center justify-center text-xs font-black text-white shadow-lg`}>
                {featured.avatar}
              </div>
              <div>
                <p className="text-sm font-bold text-white">{featured.name}</p>
                <p className="text-[12px] text-slate-500">{featured.role} · {featured.company}</p>
              </div>
            </div>
          </motion.div>

          {/* Right grid */}
          <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-5">
            {rest.map((t, i) => (
              <motion.div
                key={i}
                variants={cardVariant}
                className="relative p-6 rounded-2xl bg-white/[0.025] border border-white/[0.07] overflow-hidden group hover:border-white/[0.13] hover:bg-white/[0.04] transition-all duration-300 flex flex-col"
              >
                {/* Top accent */}
                <div className={`absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r ${t.color}`} />

                <Stars count={t.rating} />
                <blockquote className="mt-4 text-[13px] text-slate-300 leading-relaxed flex-1">
                  &ldquo;{t.text}&rdquo;
                </blockquote>

                <div className="mt-4 pt-4 border-t border-white/[0.05] flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${t.color} flex items-center justify-center text-[10px] font-black text-white shrink-0`}>
                    {t.avatar}
                  </div>
                  <div>
                    <p className="text-[12px] font-bold text-white">{t.name}</p>
                    <p className="text-[11px] text-slate-500">{t.role} · {t.company}</p>
                  </div>
                </div>
              </motion.div>
            ))}

            {/* Social proof aggregate */}
            <motion.div
              variants={cardVariant}
              className="sm:col-span-2 p-6 rounded-2xl bg-gradient-to-br from-indigo-600/15 to-violet-600/10 border border-indigo-500/20 flex flex-col sm:flex-row items-center gap-6"
            >
              <div className="text-center sm:text-left">
                <div className="text-4xl font-black text-white mb-1">4.9<span className="text-2xl text-slate-400">/5</span></div>
                <div className="flex justify-center sm:justify-start gap-0.5 mb-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={14} className="text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-[12px] text-slate-400">Note moyenne sur 5 000+ avis</p>
              </div>
              <div className="hidden sm:block w-px h-16 bg-white/10" />
              <div className="text-center sm:text-left">
                <div className="text-4xl font-black text-white mb-1">98%</div>
                <p className="text-[12px] text-slate-400">des apprenants recommandent</p>
                <p className="text-[12px] text-slate-400">EduAI Pro à leur entourage</p>
              </div>
              <div className="hidden sm:block w-px h-16 bg-white/10" />
              <div className="text-center sm:text-left">
                <div className="text-4xl font-black text-white mb-1">12k+</div>
                <p className="text-[12px] text-slate-400">apprenants actifs dans</p>
                <p className="text-[12px] text-slate-400">35+ pays</p>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
