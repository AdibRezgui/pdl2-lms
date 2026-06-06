'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';

interface CounterProps {
  end: number;
  decimals?: number;
  suffix?: string;
  prefix?: string;
  duration?: number;
}

function Counter({ end, decimals = 0, suffix = '', prefix = '', duration = 2000 }: CounterProps) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  useEffect(() => {
    if (!inView) return;
    let startTime: number;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3); // cubic ease-out
      setCount(parseFloat((ease * end).toFixed(decimals)));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [inView, end, decimals, duration]);

  return (
    <span ref={ref}>
      {prefix}{decimals > 0 ? count.toFixed(decimals) : Math.floor(count).toLocaleString('fr-FR')}{suffix}
    </span>
  );
}

const stats = [
  {
    value: 12000,
    suffix: '+',
    label: 'Apprenants actifs',
    description: 'À travers 35+ pays',
    gradient: 'from-indigo-500 to-violet-500',
    glow: 'shadow-indigo-500/20',
  },
  {
    value: 350,
    suffix: '+',
    label: 'Cours disponibles',
    description: 'Mis à jour hebdomadairement',
    gradient: 'from-cyan-500 to-blue-500',
    glow: 'shadow-cyan-500/20',
  },
  {
    value: 98,
    suffix: '%',
    label: 'Taux de satisfaction',
    description: 'Basé sur 5 000+ avis',
    gradient: 'from-emerald-500 to-teal-500',
    glow: 'shadow-emerald-500/20',
  },
  {
    value: 4.9,
    decimals: 1,
    suffix: '/5',
    label: 'Note moyenne',
    description: 'Score vérifié',
    gradient: 'from-amber-500 to-orange-500',
    glow: 'shadow-amber-500/20',
  },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};

const item = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.23, 1, 0.32, 1] } },
};

export default function Stats() {
  return (
    <section className="relative py-24 overflow-hidden">
      {/* Top / bottom separator lines */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />

      {/* Very subtle background tint */}
      <div className="absolute inset-0 bg-gradient-to-b from-indigo-600/[0.025] via-transparent to-transparent pointer-events-none" />

      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.23,1,0.32,1] }}
          className="text-center mb-16"
        >
          <p className="text-[13px] text-indigo-400 font-semibold tracking-wider uppercase mb-3">Des chiffres réels</p>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Une plateforme qui prouve ses résultats
          </h2>
        </motion.div>

        {/* Stats grid */}
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-60px' }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6"
        >
          {stats.map((stat, i) => (
            <motion.div
              key={i}
              variants={item}
              className="group relative p-6 sm:p-8 rounded-2xl bg-white/[0.025] border border-white/[0.07] hover:border-white/[0.12] hover:bg-white/[0.04] transition-all duration-300 overflow-hidden"
            >
              {/* Inner glow on hover */}
              <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br ${stat.gradient} blur-3xl scale-150`} style={{ opacity: 0 }} />

              {/* Gradient accent bar */}
              <div className={`w-8 h-1 rounded-full bg-gradient-to-r ${stat.gradient} mb-6 shadow-lg ${stat.glow}`} />

              {/* Value */}
              <div className={`text-4xl sm:text-5xl font-black tracking-tight bg-gradient-to-r ${stat.gradient} bg-clip-text text-transparent mb-2`}>
                <Counter
                  end={stat.value}
                  suffix={stat.suffix}
                  decimals={stat.decimals ?? 0}
                  duration={1800}
                />
              </div>

              <p className="text-base font-bold text-white mb-1">{stat.label}</p>
              <p className="text-[13px] text-slate-500">{stat.description}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Social proof quote */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-12 text-center"
        >
          <div className="inline-flex items-center gap-3 px-5 py-3 rounded-2xl bg-white/[0.03] border border-white/[0.07]">
            <div className="flex -space-x-1.5">
              {['A','K','S','M'].map((initial, i) => (
                <div key={i} className={`w-6 h-6 rounded-full border border-[#020209] flex items-center justify-center text-[9px] font-bold text-white bg-gradient-to-br ${
                  ['from-indigo-600 to-violet-600','from-cyan-600 to-blue-600','from-emerald-600 to-teal-600','from-amber-600 to-orange-600'][i]
                }`}>
                  {initial}
                </div>
              ))}
            </div>
            <p className="text-[13px] text-slate-400">
              <strong className="text-white font-semibold">+250 apprenants</strong> ont rejoint EduAI Pro cette semaine
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
