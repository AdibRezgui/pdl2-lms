'use client';

import { motion } from 'framer-motion';
import { UserPlus, Search, Brain, Trophy } from 'lucide-react';

const steps = [
  {
    number: '01',
    icon: <UserPlus size={22} />,
    title: 'Créez votre profil',
    description: 'Inscrivez-vous en 30 secondes. Notre IA analyse vos objectifs, votre niveau et votre rythme d\'apprentissage pour construire un profil apprenant personnalisé.',
    gradient: 'from-indigo-500 to-violet-500',
    glow: 'shadow-indigo-500/20',
  },
  {
    number: '02',
    icon: <Search size={22} />,
    title: 'Choisissez votre parcours',
    description: 'Explorez 350+ cours ou laissez l\'IA vous recommander un parcours sur mesure selon vos ambitions professionnelles et votre secteur d\'activité.',
    gradient: 'from-cyan-500 to-blue-500',
    glow: 'shadow-cyan-500/20',
  },
  {
    number: '03',
    icon: <Brain size={22} />,
    title: 'Apprenez avec l\'IA',
    description: 'Progressez à votre rythme grâce aux évaluations adaptatives, au chatbot 24/7 et aux exercices pratiques générés en temps réel par l\'intelligence artificielle.',
    gradient: 'from-violet-500 to-purple-500',
    glow: 'shadow-violet-500/20',
  },
  {
    number: '04',
    icon: <Trophy size={22} />,
    title: 'Certifiez-vous',
    description: 'Obtenez des certificats reconnus par les employeurs. Partagez vos accomplissements sur LinkedIn et boostez votre carrière avec vos nouvelles compétences.',
    gradient: 'from-amber-500 to-orange-500',
    glow: 'shadow-amber-500/20',
  },
];

export default function HowItWorks() {
  return (
    <section className="relative py-28 sm:py-36 overflow-hidden">
      {/* Subtle bg */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-violet-600/[0.02] to-transparent pointer-events-none" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.07] to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/[0.07] to-transparent" />

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
            <Brain size={13} />
            Comment ça marche
          </div>
          <h2 className="text-4xl sm:text-5xl font-black text-white tracking-tight mb-5">
            De zéro à expert
            <br />
            <span className="gradient-text">en 4 étapes simples</span>
          </h2>
          <p className="text-slate-400 text-lg max-w-xl mx-auto">
            Un processus conçu pour maximiser votre apprentissage
            dès la première minute.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="relative">
          {/* Connector line */}
          <div className="hidden lg:block absolute top-[52px] left-[12%] right-[12%] h-px bg-gradient-to-r from-indigo-500/20 via-violet-500/40 to-amber-500/20" />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-4">
            {steps.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.55, delay: i * 0.12, ease: [0.23,1,0.32,1] }}
                className="flex flex-col items-center text-center"
              >
                {/* Icon circle */}
                <div className="relative mb-6">
                  {/* Outer glow ring */}
                  <div className={`absolute inset-0 rounded-full bg-gradient-to-br ${step.gradient} opacity-20 blur-md scale-125`} />
                  <div className={`relative w-[68px] h-[68px] rounded-full bg-gradient-to-br ${step.gradient} flex items-center justify-center text-white shadow-xl ${step.glow}`}>
                    {step.icon}
                  </div>
                  {/* Step number badge */}
                  <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#020209] border border-white/10 flex items-center justify-center text-[9px] font-black text-slate-400">
                    {i + 1}
                  </div>
                </div>

                <h3 className="text-base font-bold text-white mb-3">{step.title}</h3>
                <p className="text-[13px] text-slate-400 leading-relaxed max-w-[220px]">
                  {step.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Bottom CTA hint */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6 }}
          className="mt-16 text-center"
        >
          <p className="text-[13px] text-slate-500">
            Durée moyenne pour compléter un parcours complet:{' '}
            <span className="text-white font-semibold">3 à 6 mois</span> selon le rythme
          </p>
        </motion.div>
      </div>
    </section>
  );
}
