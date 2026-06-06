'use client';

import { motion } from 'framer-motion';
import {
  Brain, MessageSquare, TrendingUp, BarChart3, FileText,
  Shield, Award, Globe, Zap, Check, Sparkles, Users, BookOpen,
} from 'lucide-react';

/* ── Large feature blocks (alternating) ───────────── */
const mainFeatures = [
  {
    badge: 'IA Adaptive',
    title: 'Un moteur IA qui apprend à vous connaître',
    description:
      'Notre algorithme d\'apprentissage adaptatif analyse chaque interaction pour modéliser votre niveau, vos lacunes et vos forces. Le résultat : un parcours de formation qui évolue avec vous, heure après heure.',
    points: [
      'Analyse comportementale en temps réel',
      'Recommandations basées sur vos objectifs',
      'Adaptation dynamique du niveau de difficulté',
      'Détection proactive des lacunes',
    ],
    icon: <Brain size={28} />,
    color: 'text-indigo-400',
    bg: 'bg-indigo-500/10',
    border: 'border-indigo-500/20',
    gradient: 'from-indigo-600/20 to-violet-600/15',
    visual: 'ai',
    dir: 'left',
  },
  {
    badge: 'Chatbot 24/7',
    title: 'Un assistant expert disponible à toute heure',
    description:
      'Posez n\'importe quelle question sur vos cours, demandez une explication, ou faites réviser un concept difficile. Notre chatbot pédagogique connaît l\'intégralité de votre contenu de formation.',
    points: [
      'Réponses contextualisées à votre cours',
      'Explications pas-à-pas des concepts',
      'Aide à la préparation des évaluations',
      'Disponible en français, arabe et anglais',
    ],
    icon: <MessageSquare size={28} />,
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/20',
    gradient: 'from-cyan-600/20 to-blue-600/15',
    visual: 'chat',
    dir: 'right',
  },
  {
    badge: 'Analytics',
    title: 'Des données qui guident chaque décision',
    description:
      'Formateurs et apprenants disposent de tableaux de bord détaillés. Suivez en temps réel la progression, identifiez les points de friction et célébrez les victoires.',
    points: [
      'Tableaux de bord en temps réel',
      'Rapports de progression exportables',
      'Analytics par cours, module et quiz',
      'Alertes automatiques pour les formateurs',
    ],
    icon: <BarChart3 size={28} />,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
    gradient: 'from-amber-600/20 to-orange-600/15',
    visual: 'analytics',
    dir: 'left',
  },
];

/* ── Mini feature grid ─────────────────────────────── */
const miniFeatures = [
  { icon: <FileText size={20} />, title: 'Évaluations IA', desc: 'Quiz générés automatiquement, adaptés au niveau de chaque apprenant.', color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
  { icon: <Users size={20} />, title: 'Multi-rôles', desc: 'Espaces dédiés Stagiaire, Formateur et Administrateur avec permissions granulaires.', color: 'text-pink-400', bg: 'bg-pink-500/10', border: 'border-pink-500/20' },
  { icon: <Shield size={20} />, title: 'Sécurité RGPD', desc: 'Chiffrement bout en bout, MFA et conformité réglementaire garantis.', color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/20' },
  { icon: <Award size={20} />, title: 'Certifications', desc: 'Certificats numériques vérifiables, valorisables sur LinkedIn et CV.', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
  { icon: <Globe size={20} />, title: 'Multilingue', desc: 'Interface disponible en français, arabe et anglais avec contenus localisés.', color: 'text-sky-400', bg: 'bg-sky-500/10', border: 'border-sky-500/20' },
  { icon: <Zap size={20} />, title: 'Ultra-rapide', desc: 'Temps de chargement < 1s, 99.9% de disponibilité et CDN mondial.', color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' },
];

/* ── Visual mockups ────────────────────────────────── */
function AIVisual() {
  return (
    <div className="p-5 h-full flex flex-col gap-3">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-5 h-5 rounded-lg bg-indigo-500/20 flex items-center justify-center">
          <Brain size={10} className="text-indigo-400" />
        </div>
        <span className="text-[11px] font-semibold text-indigo-300">Profil d&apos;apprentissage</span>
        <div className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-400" />
      </div>
      {/* Radar-like skill display */}
      <div className="flex-1 grid grid-cols-2 gap-2">
        {[
          { label: 'JavaScript', value: 78, color: 'from-indigo-500 to-violet-500' },
          { label: 'Python', value: 52, color: 'from-cyan-500 to-blue-500' },
          { label: 'React', value: 65, color: 'from-emerald-500 to-teal-500' },
          { label: 'Machine Learning', value: 34, color: 'from-amber-500 to-orange-500' },
        ].map((skill, i) => (
          <div key={i} className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
            <div className="flex justify-between mb-1.5">
              <span className="text-[10px] text-slate-400 font-medium">{skill.label}</span>
              <span className={`text-[10px] font-bold bg-gradient-to-r ${skill.color} bg-clip-text text-transparent`}>{skill.value}%</span>
            </div>
            <div className="h-1 bg-white/[0.05] rounded-full overflow-hidden">
              <motion.div
                className={`h-full bg-gradient-to-r ${skill.color} rounded-full`}
                initial={{ width: 0 }}
                whileInView={{ width: `${skill.value}%` }}
                viewport={{ once: true }}
                transition={{ duration: 1.2, delay: i * 0.15, ease: 'easeOut' }}
              />
            </div>
          </div>
        ))}
      </div>
      {/* AI recommendation */}
      <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/15">
        <div className="flex items-center gap-1.5 mb-1.5">
          <Sparkles size={10} className="text-indigo-400" />
          <span className="text-[10px] font-semibold text-indigo-300">Recommandation IA</span>
        </div>
        <div className="space-y-1">
          <div className="h-1.5 bg-indigo-400/20 rounded w-full" />
          <div className="h-1.5 bg-indigo-400/15 rounded w-4/5" />
          <div className="h-1.5 bg-indigo-400/10 rounded w-3/5" />
        </div>
      </div>
    </div>
  );
}

function ChatVisual() {
  const messages = [
    { role: 'ai', text: "Bonjour ! Je suis votre assistant IA. Comment puis-je vous aider aujourd'hui ?" },
    { role: 'user', text: "J'ai du mal à comprendre les closures en JavaScript." },
    { role: 'ai', text: "Bien sûr ! Une closure, c'est une fonction qui 'se souvient' de son contexte lexical. Par exemple..." },
  ];
  return (
    <div className="p-4 h-full flex flex-col gap-3">
      <div className="flex items-center gap-2 mb-1 pb-3 border-b border-white/[0.05]">
        <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center">
          <Brain size={12} className="text-white" />
        </div>
        <div>
          <p className="text-[11px] font-bold text-white">Assistant EduAI</p>
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="text-[10px] text-emerald-400">En ligne</span>
          </div>
        </div>
      </div>
      <div className="flex-1 space-y-2 overflow-hidden">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[82%] px-3 py-2 rounded-2xl text-[10px] leading-relaxed ${
              m.role === 'ai'
                ? 'bg-indigo-500/15 text-slate-300 rounded-tl-none border border-indigo-500/15'
                : 'bg-white/8 text-slate-200 rounded-tr-none border border-white/[0.08]'
            }`}>
              {m.text}
            </div>
          </div>
        ))}
        <div className="flex justify-start">
          <div className="flex items-center gap-1 px-3 py-2 bg-indigo-500/10 rounded-2xl rounded-tl-none border border-indigo-500/15">
            {[0,1,2].map(i => <div key={i} className="typing-dot w-1.5 h-1.5 rounded-full bg-indigo-400" />)}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 p-2 rounded-xl bg-white/[0.04] border border-white/[0.07]">
        <div className="flex-1 h-1.5 bg-white/10 rounded" />
        <div className="w-6 h-6 rounded-lg bg-indigo-600 flex items-center justify-center">
          <span className="text-[9px] text-white">→</span>
        </div>
      </div>
    </div>
  );
}

function AnalyticsVisual() {
  const bars = [45, 62, 38, 78, 55, 85, 70, 91, 64, 82];
  return (
    <div className="p-5 h-full flex flex-col gap-3">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[11px] font-semibold text-white">Progression des apprenants</span>
        <span className="text-[10px] text-emerald-400 font-medium">+12% ce mois</span>
      </div>
      {/* Bar chart */}
      <div className="flex items-end gap-1.5 h-24">
        {bars.map((v, i) => (
          <motion.div
            key={i}
            className="flex-1 rounded-t-md bg-gradient-to-t from-indigo-600 to-violet-500 opacity-70"
            initial={{ height: 0 }}
            whileInView={{ height: `${v}%` }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: i * 0.06, ease: 'easeOut' }}
          />
        ))}
      </div>
      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2 mt-1">
        {[
          { label: 'Taux complétion', value: '84%', color: 'text-emerald-400' },
          { label: 'Score moyen', value: '76/100', color: 'text-indigo-400' },
          { label: 'Temps moy.', value: '2.4h/j', color: 'text-amber-400' },
        ].map((s, i) => (
          <div key={i} className="p-2 rounded-lg bg-white/[0.03] border border-white/[0.06] text-center">
            <p className={`text-[13px] font-black ${s.color}`}>{s.value}</p>
            <p className="text-[9px] text-slate-500">{s.label}</p>
          </div>
        ))}
      </div>
      {/* Learner progress items */}
      <div className="space-y-2">
        {[{ name: 'Amira B.', progress: 92 }, { name: 'Karim M.', progress: 67 }].map((l, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-indigo-500/20 flex items-center justify-center text-[9px] font-bold text-indigo-300 shrink-0">
              {l.name[0]}
            </div>
            <div className="flex-1">
              <div className="flex justify-between mb-0.5">
                <span className="text-[10px] text-slate-400">{l.name}</span>
                <span className="text-[10px] font-bold text-white">{l.progress}%</span>
              </div>
              <div className="h-1 bg-white/5 rounded-full">
                <div className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full" style={{ width: `${l.progress}%` }} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const visuals: Record<string, JSX.Element> = {
  ai: <AIVisual />,
  chat: <ChatVisual />,
  analytics: <AnalyticsVisual />,
};

export default function Features() {
  return (
    <section id="features" className="relative py-28 sm:py-36 overflow-hidden">
      {/* Background orbs */}
      <div className="absolute top-1/3 -left-32 w-72 h-72 rounded-full bg-indigo-600/[0.04] blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/3 -right-32 w-72 h-72 rounded-full bg-violet-600/[0.04] blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-5 sm:px-8">

        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.23,1,0.32,1] }}
          className="text-center max-w-3xl mx-auto mb-24"
        >
          <div className="section-badge mb-6">
            <Sparkles size={13} />
            Fonctionnalités IA
          </div>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.05] mb-6">
            Tout ce qu&apos;il faut pour
            <br />
            <span className="gradient-text">apprendre différemment</span>
          </h2>
          <p className="text-lg text-slate-400 leading-relaxed">
            EduAI Pro réunit les meilleures pratiques pédagogiques et la puissance de l&apos;IA
            pour créer une expérience d&apos;apprentissage sans précédent.
          </p>
        </motion.div>

        {/* ── Alternating feature blocks ─── */}
        <div className="space-y-20 mb-28">
          {mainFeatures.map((feature, i) => {
            const isRight = feature.dir === 'right';
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{ duration: 0.7, ease: [0.23,1,0.32,1] }}
                className={`flex flex-col ${isRight ? 'lg:flex-row-reverse' : 'lg:flex-row'} items-center gap-12 lg:gap-16`}
              >
                {/* Text side */}
                <div className="flex-1 max-w-xl">
                  <div className={`section-badge mb-5 w-fit`} style={{ background: 'rgba(99,102,241,0.08)', borderColor: 'rgba(99,102,241,0.2)' }}>
                    <span className={feature.color}>{feature.badge}</span>
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-black text-white leading-tight mb-5">
                    {feature.title}
                  </h3>
                  <p className="text-slate-400 leading-relaxed mb-8">
                    {feature.description}
                  </p>
                  <ul className="space-y-3">
                    {feature.points.map((point, j) => (
                      <motion.li
                        key={j}
                        initial={{ opacity: 0, x: -10 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: j * 0.08 }}
                        className="flex items-center gap-3 text-sm text-slate-300"
                      >
                        <div className={`w-5 h-5 rounded-full ${feature.bg} border ${feature.border} flex items-center justify-center shrink-0`}>
                          <Check size={10} className={feature.color} strokeWidth={3} />
                        </div>
                        {point}
                      </motion.li>
                    ))}
                  </ul>
                </div>

                {/* Visual side */}
                <div className="flex-1 w-full max-w-lg">
                  <div className={`relative rounded-2xl bg-gradient-to-br ${feature.gradient} border ${feature.border} overflow-hidden h-72 sm:h-80 shadow-2xl shadow-black/40`}>
                    {/* Pattern overlay */}
                    <div
                      className="absolute inset-0 opacity-[0.04]"
                      style={{
                        backgroundImage: `linear-gradient(rgba(255,255,255,1) 1px, transparent 1px),linear-gradient(90deg,rgba(255,255,255,1) 1px,transparent 1px)`,
                        backgroundSize: '24px 24px',
                      }}
                    />
                    <div className="relative h-full">
                      {visuals[feature.visual]}
                    </div>
                    {/* Gradient fade bottom */}
                    <div className="absolute bottom-0 inset-x-0 h-12 bg-gradient-to-t from-[#020209]/40 to-transparent" />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* ── Mini feature grid ─── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h3 className="text-2xl font-black text-white mb-3">Et bien plus encore</h3>
          <p className="text-slate-400 text-sm">Des fonctionnalités pensées pour chaque type d&apos;utilisateur</p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {miniFeatures.map((feat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.06 }}
              whileHover={{ y: -3 }}
              className={`group p-5 rounded-2xl bg-white/[0.02] border border-white/[0.07] hover:border-white/[0.13] hover:bg-white/[0.04] transition-all duration-300 cursor-default`}
            >
              <div className={`w-10 h-10 rounded-xl ${feat.bg} border ${feat.border} flex items-center justify-center ${feat.color} mb-4 group-hover:scale-110 transition-transform duration-300`}>
                {feat.icon}
              </div>
              <h4 className="text-base font-bold text-white mb-2">{feat.title}</h4>
              <p className="text-[13px] text-slate-500 leading-relaxed">{feat.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
