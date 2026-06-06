'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Zap, Crown, Building2, Sparkles, ArrowRight } from 'lucide-react';

const plans = [
  {
    name: 'Découverte',
    icon: <Zap size={20} />,
    monthlyPrice: 0,
    annualPrice: 0,
    period: 'Gratuit pour toujours',
    description: 'Parfait pour explorer la plateforme.',
    gradient: 'from-emerald-500 to-teal-500',
    border: 'border-white/[0.08]',
    glow: '',
    features: [
      '5 cours gratuits au choix',
      'Chatbot IA (20 messages/jour)',
      'Suivi de progression',
      'Certificats de complétion',
      'Accès mobile',
    ],
    cta: 'Commencer gratuitement',
    href: '/register',
    popular: false,
    ctaStyle: 'border border-white/[0.1] text-slate-300 hover:bg-white/5 hover:border-white/20 hover:text-white',
  },
  {
    name: 'Pro',
    icon: <Crown size={20} />,
    monthlyPrice: 79,
    annualPrice: 63,
    period: '/mois',
    description: 'Pour les apprenants qui veulent tout maîtriser.',
    gradient: 'from-indigo-500 to-violet-500',
    border: 'border-indigo-500/30',
    glow: 'shadow-2xl shadow-indigo-500/15',
    features: [
      'Tous les cours (350+)',
      'Chatbot IA illimité',
      'Parcours personnalisés IA',
      'Évaluations adaptatives',
      'Analytics avancées',
      'Certificats reconnus',
      'Support prioritaire 24/7',
      'Accès hors ligne',
    ],
    cta: "Démarrer l'essai gratuit",
    href: '/register',
    popular: true,
    ctaStyle: 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:from-indigo-500 hover:to-violet-500',
  },
  {
    name: 'Entreprise',
    icon: <Building2 size={20} />,
    monthlyPrice: null,
    annualPrice: null,
    period: 'Sur devis',
    description: 'Solution complète pour vos équipes.',
    gradient: 'from-violet-500 to-purple-500',
    border: 'border-white/[0.08]',
    glow: '',
    features: [
      'Tout du plan Pro',
      'Tableau de bord RH dédié',
      'API & webhooks',
      'SSO & LDAP',
      'Formation sur mesure',
      'Account manager dédié',
      'SLA garanti 99.9%',
      'On-premise disponible',
    ],
    cta: "Contacter l'équipe",
    href: '#contact',
    popular: false,
    ctaStyle: 'border border-white/[0.1] text-slate-300 hover:bg-white/5 hover:border-white/20 hover:text-white',
  },
];

export default function Pricing() {
  const [annual, setAnnual] = useState(false);

  return (
    <section id="pricing" className="relative py-28 sm:py-36 overflow-hidden">
      {/* Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-indigo-600/[0.05] blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.23,1,0.32,1] }}
          className="text-center mb-14"
        >
          <div className="section-badge mb-6 mx-auto w-fit">
            <Sparkles size={13} />
            Tarification transparente
          </div>
          <h2 className="text-4xl sm:text-5xl font-black text-white tracking-tight mb-5">
            Commencez gratuitement,
            <br />
            <span className="gradient-text">évoluez à votre rythme</span>
          </h2>
          <p className="text-slate-400 text-lg max-w-xl mx-auto mb-8">
            Sans engagement. Annulez à tout moment.
            Aucune carte bancaire requise pour démarrer.
          </p>

          {/* Annual / monthly toggle */}
          <div className="inline-flex items-center gap-3 p-1 rounded-xl bg-white/[0.04] border border-white/[0.07]">
            <button
              onClick={() => setAnnual(false)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                !annual ? 'bg-white/8 text-white' : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              Mensuel
            </button>
            <button
              onClick={() => setAnnual(true)}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                annual ? 'bg-white/8 text-white' : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              Annuel
              <span className="px-1.5 py-0.5 rounded-md bg-emerald-500/15 text-emerald-400 text-[11px] font-bold">−20%</span>
            </button>
          </div>
        </motion.div>

        {/* Plans grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch">
          {plans.map((plan, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55, delay: i * 0.1, ease: [0.23,1,0.32,1] }}
              className={`relative flex flex-col rounded-2xl border ${plan.border} p-7 ${
                plan.popular
                  ? `bg-gradient-to-b from-indigo-600/10 to-violet-600/[0.05] ${plan.glow} scale-[1.03]`
                  : 'bg-white/[0.02]'
              } transition-all duration-300`}
            >
              {/* Popular badge */}
              {plan.popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-[11px] font-bold text-white bg-gradient-to-r from-indigo-600 to-violet-600 shadow-lg shadow-indigo-600/30 whitespace-nowrap">
                  LE PLUS POPULAIRE ✦
                </div>
              )}

              {/* Plan header */}
              <div className="flex items-center gap-3 mb-6">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${plan.gradient} flex items-center justify-center text-white shadow-lg`}>
                  {plan.icon}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">{plan.name}</h3>
                  <p className="text-[12px] text-slate-500">{plan.description}</p>
                </div>
              </div>

              {/* Price */}
              <div className="mb-6">
                <AnimatePresence mode="wait">
                  {plan.monthlyPrice !== null ? (
                    <motion.div
                      key={annual ? 'annual' : 'monthly'}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="flex items-baseline gap-1.5"
                    >
                      <span className="text-4xl sm:text-5xl font-black text-white">
                        {plan.monthlyPrice === 0 ? 'Gratuit' : `${annual ? plan.annualPrice : plan.monthlyPrice}`}
                      </span>
                      {plan.monthlyPrice > 0 && (
                        <span className="text-slate-400 text-sm">TND{plan.period}</span>
                      )}
                    </motion.div>
                  ) : (
                    <div className="text-3xl font-black text-white">Sur devis</div>
                  )}
                </AnimatePresence>
                {plan.popular && annual && (
                  <p className="text-[12px] text-emerald-400 mt-1 font-medium">
                    Économisez {((79 - 63) * 12).toLocaleString('fr-FR')} TND/an
                  </p>
                )}
              </div>

              {/* Features */}
              <ul className="space-y-2.5 flex-1 mb-7">
                {plan.features.map((feature, j) => (
                  <li key={j} className="flex items-center gap-3 text-[13px] text-slate-300">
                    <div className={`w-4.5 h-4.5 rounded-full bg-gradient-to-br ${plan.gradient} flex items-center justify-center shrink-0`} style={{ width: 18, height: 18 }}>
                      <Check size={10} className="text-white" strokeWidth={3} />
                    </div>
                    {feature}
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Link href={plan.href}>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${plan.ctaStyle}`}
                >
                  {plan.cta}
                  {plan.popular && <ArrowRight size={14} />}
                </motion.button>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Bottom trust note */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="mt-12 text-center"
        >
          <p className="text-[13px] text-slate-500">
            Paiement sécurisé · Annulation sans frais · Support 7j/7
          </p>
          <div className="flex items-center justify-center gap-6 mt-4">
            {['Visa', 'Mastercard', 'PayPal', 'Virement'].map(method => (
              <span key={method} className="text-[11px] text-slate-600 font-medium">{method}</span>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
