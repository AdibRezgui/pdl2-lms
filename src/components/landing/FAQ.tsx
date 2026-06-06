'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus, HelpCircle } from 'lucide-react';

const faqs = [
  {
    q: 'Est-ce que la plateforme est vraiment gratuite pour commencer ?',
    a: 'Oui, totalement. Le plan Découverte vous donne accès à 5 cours complets et au chatbot IA (20 messages/jour) sans aucune carte bancaire requise. Vous pouvez l\'utiliser indéfiniment sans frais.',
  },
  {
    q: 'Comment fonctionne l\'IA de personnalisation ?',
    a: 'Notre moteur d\'IA analyse en continu vos performances, votre rythme, vos lacunes et vos préférences d\'apprentissage. Il ajuste dynamiquement le contenu, les exercices et les évaluations pour correspondre exactement à votre niveau et maximiser votre rétention.',
  },
  {
    q: 'Les certifications sont-elles reconnues par les employeurs ?',
    a: 'Nos certificats sont reconnus par plus de 200 entreprises partenaires en Tunisie et en Europe. Chaque certificat contient un QR code de vérification unique et peut être partagé directement sur LinkedIn.',
  },
  {
    q: 'Puis-je annuler mon abonnement à tout moment ?',
    a: 'Oui, sans aucune contrainte. Vous pouvez annuler depuis votre espace compte en 2 clics. Vous conservez l\'accès jusqu\'à la fin de votre période de facturation, sans frais supplémentaires.',
  },
  {
    q: 'Y a-t-il un accès hors ligne ?',
    a: 'Oui, le plan Pro inclut le téléchargement de cours pour une utilisation hors ligne sur notre application mobile (iOS & Android). Le contenu se synchronise automatiquement lors de votre prochaine connexion.',
  },
  {
    q: 'Comment fonctionne la solution Entreprise ?',
    a: 'La solution Entreprise inclut un tableau de bord RH dédié, des analytics par collaborateur, l\'intégration SSO, des parcours de formation sur mesure, et un account manager dédié. Contactez-nous pour un devis personnalisé selon la taille de votre équipe.',
  },
  {
    q: 'Les formateurs peuvent-ils proposer leurs propres cours ?',
    a: 'Absolument. Notre espace Formateur vous permet de créer, gérer et monétiser vos cours. L\'IA vous aide même à générer des quiz et des évaluations automatiquement depuis votre contenu.',
  },
];

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="relative py-28 sm:py-36 overflow-hidden">
      <div className="absolute top-1/2 right-0 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-violet-600/[0.04] blur-3xl pointer-events-none" />

      <div className="max-w-3xl mx-auto px-5 sm:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.23,1,0.32,1] }}
          className="text-center mb-14"
        >
          <div className="section-badge mb-6 mx-auto w-fit">
            <HelpCircle size={13} />
            Questions fréquentes
          </div>
          <h2 className="text-4xl sm:text-5xl font-black text-white tracking-tight mb-5">
            Tout ce que vous
            <br />
            <span className="gradient-text">voulez savoir</span>
          </h2>
          <p className="text-slate-400 text-lg">
            Une question non listée ? Notre support répond en moins de 2h.
          </p>
        </motion.div>

        {/* Accordion */}
        <div className="space-y-2">
          {faqs.map((faq, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: i * 0.05 }}
              className={`rounded-xl border transition-all duration-200 overflow-hidden ${
                open === i
                  ? 'border-indigo-500/30 bg-indigo-600/[0.06]'
                  : 'border-white/[0.07] bg-white/[0.02] hover:border-white/[0.12] hover:bg-white/[0.03]'
              }`}
            >
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between gap-4 px-6 py-4 text-left group"
              >
                <span className={`text-[14px] font-semibold leading-snug transition-colors duration-200 ${
                  open === i ? 'text-white' : 'text-slate-300 group-hover:text-white'
                }`}>
                  {faq.q}
                </span>
                <div className={`w-6 h-6 rounded-full border flex items-center justify-center shrink-0 transition-all duration-200 ${
                  open === i
                    ? 'border-indigo-400 bg-indigo-500/20 text-indigo-300'
                    : 'border-white/10 text-slate-500'
                }`}>
                  {open === i ? <Minus size={12} /> : <Plus size={12} />}
                </div>
              </button>

              <AnimatePresence initial={false}>
                {open === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: [0.23,1,0.32,1] }}
                  >
                    <div className="px-6 pb-5 text-[13px] text-slate-400 leading-relaxed border-t border-white/[0.05] pt-4">
                      {faq.a}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>

        {/* Support hint */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="mt-10 text-center"
        >
          <p className="text-[13px] text-slate-500">
            Vous n&apos;avez pas trouvé votre réponse ?{' '}
            <a href="mailto:support@eduaipro.com" className="text-indigo-400 hover:text-indigo-300 transition-colors">
              Écrivez-nous
            </a>
          </p>
        </motion.div>
      </div>
    </section>
  );
}
