'use client';

import Link from 'next/link';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Brain, ArrowRight, Sparkles, Users, BookOpen, Star, Zap, TrendingUp, MessageSquare, Play } from 'lucide-react';
import { useRef } from 'react';

const floatingBadges = [
  {
    icon: <Brain size={15} className="text-indigo-400" />,
    title: 'IA Adaptative',
    sub: 'Apprentissage personnalisé',
    gradient: 'from-indigo-500/20 to-violet-500/20',
    border: 'border-indigo-500/25',
    position: '-left-8 top-24',
    delay: 0,
  },
  {
    icon: <TrendingUp size={15} className="text-emerald-400" />,
    title: '+340% progression',
    sub: 'Vs. méthodes classiques',
    gradient: 'from-emerald-500/20 to-cyan-500/20',
    border: 'border-emerald-500/25',
    position: '-right-8 top-16',
    delay: 0.4,
  },
  {
    icon: <MessageSquare size={15} className="text-cyan-400" />,
    title: 'Chatbot IA 24/7',
    sub: 'Réponse en < 2 secondes',
    gradient: 'from-cyan-500/20 to-blue-500/20',
    border: 'border-cyan-500/25',
    position: '-left-4 bottom-36',
    delay: 0.8,
  },
];

const socialProof = [
  { value: '12 000+', label: 'Apprenants' },
  { value: '98%', label: 'Satisfaction' },
  { value: '350+', label: 'Cours' },
  { value: '4.9★', label: 'Note' },
];

export default function Hero() {
  const containerRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ['start start', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const opacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);

  return (
    <section ref={containerRef} className="relative min-h-[100dvh] flex flex-col items-center justify-center overflow-hidden pt-20">
      {/* ── Layered background ───────────────────── */}
      <div className="absolute inset-0 bg-[#020209]" />

      {/* Radial glow orbs */}
      <motion.div style={{ y }} className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[15%] left-[50%] -translate-x-1/2 w-[900px] h-[700px] rounded-full bg-indigo-600/[0.07] blur-[120px]" />
        <div className="absolute top-[30%] left-[20%] w-[500px] h-[500px] rounded-full bg-violet-600/[0.05] blur-[100px]" />
        <div className="absolute top-[20%] right-[15%] w-[400px] h-[400px] rounded-full bg-cyan-600/[0.04] blur-[90px]" />
      </motion.div>

      {/* Grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.025] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(rgba(99,102,241,1) 1px, transparent 1px),linear-gradient(90deg, rgba(99,102,241,1) 1px, transparent 1px)`,
          backgroundSize: '56px 56px',
        }}
      />

      {/* Bottom fade */}
      <div className="absolute bottom-0 inset-x-0 h-48 bg-gradient-to-t from-[#020209] to-transparent pointer-events-none" />

      {/* ── Main content ─────────────────────────── */}
      <motion.div style={{ opacity }} className="relative w-full max-w-7xl mx-auto px-5 sm:px-8 flex flex-col items-center text-center">

        {/* Pill badge */}
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.55, ease: [0.23,1,0.32,1] }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 mb-10"
        >
          <div className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500" />
          </div>
          <Sparkles size={13} className="text-indigo-400" />
          <span className="text-[13px] text-indigo-300 font-medium">Nouvelle génération d&apos;apprentissage IA — v2.0</span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 0.1, ease: [0.23,1,0.32,1] }}
          className="text-5xl sm:text-6xl lg:text-7xl xl:text-[82px] font-black leading-[1.04] tracking-[-0.03em] max-w-5xl"
        >
          <span className="text-white">Maîtrisez</span>
          <span className="text-slate-600"> n&apos;importe quelle</span>
          <br />
          <span className="gradient-text">compétence</span>
          <span className="text-white"> avec l&apos;IA</span>
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: [0.23,1,0.32,1] }}
          className="mt-7 text-lg sm:text-xl text-slate-400 max-w-2xl leading-relaxed font-light"
        >
          EduAI Pro analyse votre profil, crée un parcours sur mesure et vous accompagne
          avec un chatbot expert disponible à tout moment — pour apprendre{' '}
          <strong className="text-slate-200 font-semibold">3× plus vite</strong>.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.3, ease: [0.23,1,0.32,1] }}
          className="mt-10 flex flex-col sm:flex-row gap-4 items-center"
        >
          <Link href="/register">
            <motion.button
              whileHover={{ scale: 1.03, boxShadow: '0 20px 60px rgba(99,102,241,0.45)' }}
              whileTap={{ scale: 0.97 }}
              className="relative group flex items-center gap-2.5 px-7 py-4 rounded-2xl text-base font-bold text-white overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-600 bg-[length:200%_100%] group-hover:bg-right transition-all duration-500" />
              <div className="absolute inset-0 rounded-2xl shadow-lg shadow-indigo-600/40" />
              <span className="relative">Commencer gratuitement</span>
              <ArrowRight size={16} className="relative group-hover:translate-x-1 transition-transform duration-200" />
            </motion.button>
          </Link>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-3 px-5 py-4 rounded-2xl text-slate-300 hover:text-white transition-colors group"
          >
            <div className="relative flex items-center justify-center w-11 h-11 rounded-full bg-white/5 border border-white/10 group-hover:bg-white/8 group-hover:border-white/15 transition-all">
              <Play size={14} className="text-white ml-0.5 fill-white" />
            </div>
            <span className="text-[15px] font-medium">Voir la démo</span>
          </motion.button>
        </motion.div>

        {/* Social proof strip */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.45, ease: [0.23,1,0.32,1] }}
          className="mt-14 flex flex-wrap items-center justify-center gap-8 sm:gap-12"
        >
          {socialProof.map((s, i) => (
            <div key={i} className="flex flex-col items-center">
              <span className="text-2xl sm:text-3xl font-black text-white tracking-tight">{s.value}</span>
              <span className="text-xs text-slate-500 font-medium mt-0.5">{s.label}</span>
            </div>
          ))}
        </motion.div>

        {/* ── Dashboard preview ─────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 70, scale: 0.94 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.9, delay: 0.55, ease: [0.23,1,0.32,1] }}
          className="mt-20 relative w-full max-w-5xl"
        >
          {/* Glow behind preview */}
          <div className="absolute -inset-4 bg-gradient-to-b from-indigo-600/15 via-violet-600/10 to-transparent blur-3xl rounded-3xl pointer-events-none" />

          {/* Browser chrome */}
          <div className="relative rounded-[22px] border border-white/[0.08] bg-[#0a0a16] overflow-hidden shadow-[0_50px_100px_rgba(0,0,0,0.7),0_0_0_1px_rgba(255,255,255,0.04)]">
            {/* Window bar */}
            <div className="flex items-center gap-2 px-5 py-3.5 bg-[#0e0e1c] border-b border-white/[0.05]">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-rose-500/70" />
                <div className="w-3 h-3 rounded-full bg-amber-500/70" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/70" />
              </div>
              <div className="flex-1 mx-6">
                <div className="max-w-[220px] mx-auto h-5 bg-white/[0.05] rounded-md flex items-center px-3 gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-[11px] text-slate-500 font-mono">app.eduai.pro/student/dashboard</span>
                </div>
              </div>
            </div>

            {/* Dashboard content */}
            <div className="flex h-[340px] sm:h-[400px]">
              {/* Sidebar */}
              <div className="hidden sm:flex w-44 flex-col bg-[#07071a] border-r border-white/[0.05] p-3 shrink-0">
                <div className="flex items-center gap-2 mb-5 px-1">
                  <div className="w-6 h-6 rounded-lg bg-indigo-600 flex items-center justify-center">
                    <Brain size={11} className="text-white" />
                  </div>
                  <div className="h-2.5 bg-white/20 rounded w-16" />
                </div>
                {['Tableau de bord','Mes cours','Progression','Évaluations','Certif...','IA Chat'].map((item, i) => (
                  <div key={i} className={`flex items-center gap-2 px-2 py-1.5 rounded-lg mb-0.5 ${i === 0 ? 'bg-indigo-500/15' : ''}`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${i === 0 ? 'bg-indigo-400' : 'bg-slate-700'}`} />
                    <span className={`text-[11px] font-medium ${i === 0 ? 'text-indigo-300' : 'text-slate-600'}`}>{item}</span>
                  </div>
                ))}
              </div>

              {/* Main area */}
              <div className="flex-1 p-4 sm:p-5 overflow-hidden">
                {/* Stats row */}
                <div className="grid grid-cols-3 gap-2.5 mb-4">
                  {[
                    { label: 'Cours en cours', value: '4', color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
                    { label: 'Progression moy.', value: '72%', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
                    { label: 'Certifications', value: '2', color: 'text-amber-400', bg: 'bg-amber-500/10' },
                  ].map((stat, i) => (
                    <div key={i} className={`${stat.bg} border border-white/[0.05] rounded-xl p-3`}>
                      <div className="h-1.5 bg-white/10 rounded w-3/4 mb-2" />
                      <span className={`text-xl font-black ${stat.color}`}>{stat.value}</span>
                    </div>
                  ))}
                </div>

                {/* Course progress cards */}
                <div className="space-y-2 mb-4">
                  {[
                    { title: 'React & Next.js Avancé', progress: 72, color: 'from-indigo-500 to-violet-500' },
                    { title: 'Machine Learning avec Python', progress: 45, color: 'from-cyan-500 to-blue-500' },
                  ].map((course, i) => (
                    <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                      <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${course.color} opacity-80 shrink-0`} />
                      <div className="flex-1 min-w-0">
                        <div className="h-2 bg-white/10 rounded w-3/4 mb-1.5" />
                        <div className="h-1 bg-white/[0.05] rounded-full overflow-hidden">
                          <div className={`h-full bg-gradient-to-r ${course.color} rounded-full`} style={{ width: `${course.progress}%` }} />
                        </div>
                      </div>
                      <span className="text-[11px] font-bold text-slate-400 shrink-0">{course.progress}%</span>
                    </div>
                  ))}
                </div>

                {/* AI Recommendations */}
                <div className="p-3 rounded-xl bg-indigo-500/8 border border-indigo-500/15">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles size={11} className="text-indigo-400" />
                    <span className="text-[11px] font-semibold text-indigo-300">Recommandation IA</span>
                  </div>
                  <div className="h-2 bg-indigo-400/20 rounded w-full mb-1.5" />
                  <div className="h-2 bg-indigo-400/15 rounded w-4/5" />
                </div>
              </div>

              {/* Right: AI chat */}
              <div className="hidden lg:flex w-52 flex-col bg-[#07071a] border-l border-white/[0.05] p-3 shrink-0">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center">
                    <Brain size={10} className="text-white" />
                  </div>
                  <span className="text-[11px] font-semibold text-white">Assistant IA</span>
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-400" />
                </div>
                <div className="flex-1 space-y-2">
                  <div className="bg-indigo-500/15 rounded-xl rounded-tl-none p-2">
                    <div className="h-1.5 bg-indigo-300/30 rounded w-full mb-1" />
                    <div className="h-1.5 bg-indigo-300/20 rounded w-4/5 mb-1" />
                    <div className="h-1.5 bg-indigo-300/20 rounded w-3/5" />
                  </div>
                  <div className="bg-white/[0.04] rounded-xl rounded-tr-none p-2 ml-4">
                    <div className="h-1.5 bg-white/15 rounded w-full mb-1" />
                    <div className="h-1.5 bg-white/10 rounded w-3/4" />
                  </div>
                  <div className="bg-indigo-500/15 rounded-xl rounded-tl-none p-2">
                    <div className="h-1.5 bg-indigo-300/30 rounded w-full mb-1" />
                    <div className="h-1.5 bg-indigo-300/20 rounded w-4/5" />
                  </div>
                  <div className="flex items-center gap-2 px-2 py-1">
                    <div className="typing-dot w-1.5 h-1.5 rounded-full bg-indigo-400" />
                    <div className="typing-dot w-1.5 h-1.5 rounded-full bg-indigo-400" />
                    <div className="typing-dot w-1.5 h-1.5 rounded-full bg-indigo-400" />
                  </div>
                </div>
                <div className="mt-auto">
                  <div className="h-7 bg-white/[0.04] rounded-lg border border-white/[0.06]" />
                </div>
              </div>
            </div>
          </div>

          {/* Floating badges */}
          {floatingBadges.map((badge, i) => (
            <motion.div
              key={i}
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 5 + i, delay: badge.delay, repeat: Infinity, ease: 'easeInOut' }}
              className={`absolute hidden lg:flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl bg-[#0a0a16]/90 backdrop-blur-sm border ${badge.border} shadow-2xl shadow-black/50 ${badge.position}`}
            >
              <div className={`w-7 h-7 rounded-xl bg-gradient-to-br ${badge.gradient} flex items-center justify-center shrink-0`}>
                {badge.icon}
              </div>
              <div>
                <p className="text-[12px] font-bold text-white leading-tight">{badge.title}</p>
                <p className="text-[11px] text-slate-500">{badge.sub}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>

      {/* Scroll hint */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
      >
        <span className="text-[11px] text-slate-600 font-medium tracking-wider uppercase">Découvrir</span>
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          className="w-5 h-8 rounded-full border border-white/10 flex items-start justify-center pt-1.5"
        >
          <div className="w-1 h-1.5 rounded-full bg-slate-500" />
        </motion.div>
      </motion.div>
    </section>
  );
}
