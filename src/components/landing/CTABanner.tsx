'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, Zap } from 'lucide-react';

export default function CTABanner() {
  return (
    <section className="relative py-24 sm:py-32 overflow-hidden">
      {/* Radial glow background */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[800px] h-[400px] rounded-full bg-gradient-to-r from-indigo-600/20 via-violet-600/25 to-purple-600/20 blur-[80px]" />
      </div>

      {/* Noise texture overlay */}
      <div
        className="absolute inset-0 opacity-[0.025] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
          backgroundSize: '128px',
        }}
      />

      {/* Top separator */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent" />

      <div className="relative max-w-4xl mx-auto px-5 sm:px-8 text-center">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[12px] font-semibold text-indigo-300 border border-indigo-500/20 bg-indigo-600/10 mb-8"
        >
          <Zap size={12} className="text-indigo-400" />
          Commencez dès aujourd&apos;hui — C&apos;est gratuit
        </motion.div>

        {/* Headline */}
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.65, delay: 0.1, ease: [0.23,1,0.32,1] }}
          className="text-5xl sm:text-6xl lg:text-7xl font-black text-white tracking-tight leading-[1.05] mb-6"
        >
          Votre prochaine
          <br />
          <span className="gradient-text">grande compétence</span>
          <br />
          commence ici.
        </motion.h2>

        {/* Sub copy */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-slate-400 text-lg sm:text-xl mb-10 max-w-xl mx-auto"
        >
          Rejoignez 12 000+ professionnels qui ont déjà accéléré
          leur carrière avec l&apos;apprentissage IA.
        </motion.p>

        {/* CTA buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link href="/register">
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              className="group relative flex items-center gap-2.5 px-8 py-4 rounded-2xl text-[15px] font-bold text-white overflow-hidden shadow-2xl shadow-indigo-600/25"
            >
              {/* Button bg with animated gradient */}
              <span className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-violet-600 transition-all duration-300 group-hover:from-indigo-500 group-hover:to-violet-500" />
              <Sparkles size={16} className="relative z-10 text-indigo-200" />
              <span className="relative z-10">Démarrer gratuitement</span>
              <ArrowRight size={16} className="relative z-10 text-indigo-200 group-hover:translate-x-0.5 transition-transform" />
            </motion.button>
          </Link>

          <Link href="#features">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-8 py-4 rounded-2xl text-[15px] font-semibold text-slate-300 border border-white/[0.1] hover:bg-white/[0.04] hover:border-white/[0.18] hover:text-white transition-all duration-200"
            >
              Voir la démo
            </motion.button>
          </Link>
        </motion.div>

        {/* Trust chips */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mt-10"
        >
          {[
            '✓ Aucune carte bancaire requise',
            '✓ Annulation sans engagement',
            '✓ Accès immédiat',
            '✓ Support 7j/7',
          ].map(item => (
            <span key={item} className="text-[12px] text-slate-500 font-medium">{item}</span>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
