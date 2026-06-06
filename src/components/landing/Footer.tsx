'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Brain, Github, Linkedin, Twitter, Mail, Phone, MapPin, ArrowRight, Check } from 'lucide-react';

const footerLinks = {
  Plateforme: [
    { label: 'Fonctionnalités', href: '#features' },
    { label: 'Cours', href: '#courses' },
    { label: 'Tarifs', href: '#pricing' },
    { label: 'FAQ', href: '#faq' },
  ],
  Espaces: [
    { label: 'Espace Stagiaire', href: '/login' },
    { label: 'Espace Formateur', href: '/login' },
    { label: 'Espace Admin', href: '/login' },
    { label: "S'inscrire", href: '/register' },
  ],
  Entreprise: [
    { label: 'À propos', href: '#' },
    { label: 'Blog', href: '#' },
    { label: 'Carrières', href: '#' },
    { label: 'Partenariats', href: '#' },
  ],
  Support: [
    { label: 'Documentation', href: '#' },
    { label: 'Centre d\'aide', href: '#' },
    { label: 'Contact', href: '#' },
    { label: 'Statut', href: '#' },
  ],
};

export default function Footer() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setEmail('');
    }
  };

  return (
    <footer className="relative border-t border-white/[0.06] bg-[#02020a]">
      {/* Top gradient line */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-500/25 to-transparent" />

      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        {/* Newsletter banner */}
        <div className="py-12 border-b border-white/[0.06]">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
            <div className="max-w-md">
              <h3 className="text-xl font-bold text-white mb-2">
                Restez à jour avec l&apos;IA
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Nouvelles formations, conseils d&apos;apprentissage et actualités IA chaque semaine. Pas de spam.
              </p>
            </div>

            <form onSubmit={handleSubscribe} className="flex w-full max-w-sm">
              {subscribed ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium"
                >
                  <Check size={16} />
                  Parfait ! Vous êtes abonné.
                </motion.div>
              ) : (
                <div className="flex w-full gap-2">
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="votre@email.com"
                    className="flex-1 px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.1] text-white text-sm placeholder-slate-500 outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/10 transition-all"
                    required
                  />
                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-sm font-semibold hover:from-indigo-500 hover:to-violet-500 transition-all whitespace-nowrap"
                  >
                    S&apos;abonner
                    <ArrowRight size={13} />
                  </motion.button>
                </div>
              )}
            </form>
          </div>
        </div>

        {/* Main footer content */}
        <div className="py-14 grid grid-cols-1 lg:grid-cols-5 gap-10">
          {/* Brand column */}
          <div className="lg:col-span-2">
            <Link href="/" className="inline-flex items-center gap-2.5 mb-6">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-600/20">
                <Brain size={20} className="text-white" />
              </div>
              <span className="text-xl font-bold text-white">
                Edu<span className="gradient-text">AI</span> Pro
              </span>
            </Link>
            <p className="text-slate-500 text-[13px] leading-relaxed mb-6 max-w-[260px]">
              La plateforme de formation intelligente qui révolutionne l&apos;apprentissage grâce à l&apos;intelligence artificielle adaptative.
            </p>

            {/* Contact info */}
            <div className="space-y-2.5 mb-8">
              {[
                { icon: <Mail size={13} />, label: 'contact@eduaipro.tn' },
                { icon: <Phone size={13} />, label: '+216 71 123 456' },
                { icon: <MapPin size={13} />, label: 'Tunis, Tunisie' },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-2.5 text-[13px] text-slate-500">
                  <span className="text-indigo-400 shrink-0">{item.icon}</span>
                  {item.label}
                </div>
              ))}
            </div>

            {/* Social */}
            <div className="flex gap-2">
              {[
                { icon: <Github size={16} />, label: 'GitHub', href: '#' },
                { icon: <Linkedin size={16} />, label: 'LinkedIn', href: '#' },
                { icon: <Twitter size={16} />, label: 'Twitter', href: '#' },
              ].map(social => (
                <a
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/[0.08] hover:border-white/[0.15] transition-all duration-200"
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="text-[12px] font-semibold text-white uppercase tracking-wider mb-5">
                {category}
              </h4>
              <ul className="space-y-3">
                {links.map(link => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-[13px] text-slate-500 hover:text-slate-300 transition-colors duration-200"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="py-6 border-t border-white/[0.05] flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[12px] text-slate-600">
            © 2025 EduAI Pro — Tous droits réservés. Fait avec ♥ en Tunisie.
          </p>
          <div className="flex items-center gap-5">
            {['Confidentialité', 'CGU', 'Cookies'].map(label => (
              <a
                key={label}
                href="#"
                className="text-[11px] text-slate-600 hover:text-slate-400 transition-colors"
              >
                {label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
