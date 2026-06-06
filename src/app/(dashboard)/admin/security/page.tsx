'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Shield, Lock, AlertTriangle, CheckCircle, Eye, Globe,
  Activity, RefreshCcw, UserX, Key, Server,
} from 'lucide-react';
import Sidebar from '@/components/dashboard/Sidebar';
import { useAuthStore } from '@/store/auth.store';
import Header from '@/components/dashboard/Header';
import StatsCard from '@/components/dashboard/StatsCard';
import Button from '@/components/ui/Button';
import toast from 'react-hot-toast';


const securityEvents = [
  { id: 1, type: 'warning', message: 'Tentative de connexion échouée (5x)', user: 'unknown@mail.com', ip: '185.220.101.5', time: 'Il y a 12min', country: '🇷🇺 Russie' },
  { id: 2, type: 'info', message: 'Nouvelle connexion admin', user: 'admin@eduai.tn', ip: '196.203.12.8', time: 'Il y a 1h', country: '🇹🇳 Tunisie' },
  { id: 3, type: 'success', message: 'Scan de sécurité automatique réussi', user: 'Système', ip: 'localhost', time: 'Il y a 3h', country: '—' },
  { id: 4, type: 'warning', message: 'Export de données massif détecté', user: 'trainer@eduai.tn', ip: '197.14.5.22', time: 'Il y a 6h', country: '🇹🇳 Tunisie' },
  { id: 5, type: 'error', message: 'Tentative d\'injection SQL bloquée', user: 'bot', ip: '94.102.49.11', time: 'Il y a 12h', country: '🇳🇱 Pays-Bas' },
];

const eventColors = {
  warning: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  info: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  success: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  error: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
};

const eventIcons = {
  warning: <AlertTriangle size={14} />,
  info: <Eye size={14} />,
  success: <CheckCircle size={14} />,
  error: <Shield size={14} />,
};

export default function AdminSecurityPage() {
  const authUser = useAuthStore(s => s.user);
  const userName = authUser?.name ?? 'Administrateur';
  const [scanning, setScanning] = useState(false);

  const runScan = async () => {
    setScanning(true);
    await new Promise(r => setTimeout(r, 2500));
    setScanning(false);
    toast.success('Scan de sécurité terminé — Aucune vulnérabilité critique détectée');
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar role="admin" userName={userName} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Sécurité" subtitle="Surveillance et gestion de la sécurité de la plateforme" />

        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Security score */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="p-6 rounded-2xl bg-gradient-to-br from-emerald-600/10 to-cyan-600/10 border border-emerald-500/20"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-2xl bg-emerald-500/15 border border-emerald-500/25 flex flex-col items-center justify-center">
                  <span className="text-3xl font-black text-emerald-400">94</span>
                  <span className="text-xs text-emerald-400/70">/100</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Score de sécurité : Excellent</h3>
                  <p className="text-sm text-slate-400 mt-1">Votre plateforme est bien protégée. 2 recommandations mineures disponibles.</p>
                  <div className="flex gap-4 mt-2">
                    <span className="text-xs text-emerald-400 flex items-center gap-1"><CheckCircle size={11} /> SSL/TLS actif</span>
                    <span className="text-xs text-emerald-400 flex items-center gap-1"><CheckCircle size={11} /> WAF configuré</span>
                    <span className="text-xs text-amber-400 flex items-center gap-1"><AlertTriangle size={11} /> MFA optionnel</span>
                  </div>
                </div>
              </div>
              <Button
                variant="secondary"
                icon={<RefreshCcw size={14} className={scanning ? 'animate-spin' : ''} />}
                loading={scanning}
                onClick={runScan}
              >
                Lancer un scan
              </Button>
            </div>
          </motion.div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard title="Connexions bloquées" value={47} icon={<Lock size={20} />} color="rose" delay={0} subtitle="Ces 24 dernières heures" />
            <StatsCard title="Attaques bloquées" value={12} icon={<Shield size={20} />} color="amber" delay={0.1} subtitle="Cette semaine" />
            <StatsCard title="Utilisateurs bannis" value={3} icon={<UserX size={20} />} color="purple" delay={0.2} subtitle="Ce mois" />
            <StatsCard title="Uptime" value="99.98%" icon={<Server size={20} />} color="emerald" delay={0.3} subtitle="30 derniers jours" />
          </div>

          {/* Security config */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.08]"
            >
              <h3 className="font-semibold text-white mb-5">Configuration de sécurité</h3>
              <div className="space-y-4">
                {[
                  { label: 'Authentification 2FA obligatoire (admins)', enabled: true },
                  { label: 'Blocage automatique après 5 tentatives', enabled: true },
                  { label: 'Chiffrement des données au repos (AES-256)', enabled: true },
                  { label: 'HTTPS forcé (HSTS)', enabled: true },
                  { label: 'Détection d\'injection SQL/XSS', enabled: true },
                  { label: 'Rate limiting API (100 req/min)', enabled: true },
                  { label: 'Logs d\'audit complets', enabled: false },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-white/[0.05] last:border-0">
                    <div className="flex items-center gap-2">
                      {item.enabled
                        ? <CheckCircle size={14} className="text-emerald-400" />
                        : <AlertTriangle size={14} className="text-amber-400" />}
                      <span className="text-sm text-slate-300">{item.label}</span>
                    </div>
                    <button
                      onClick={() => toast.success(`Paramètre ${item.enabled ? 'désactivé' : 'activé'}`)}
                      className={`relative w-10 h-5 rounded-full transition-colors ${item.enabled ? 'bg-emerald-600' : 'bg-white/10'}`}
                    >
                      <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${item.enabled ? 'translate-x-5' : ''}`} />
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* IP Blocklist */}
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.08]"
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-semibold text-white">IPs bloquées</h3>
                <Button size="sm" variant="secondary" icon={<Key size={12} />} onClick={() => toast.success('IP ajoutée')}>
                  Ajouter IP
                </Button>
              </div>
              <div className="space-y-2">
                {[
                  { ip: '185.220.101.5', reason: 'Brute force', country: '🇷🇺', date: 'Aujourd\'hui' },
                  { ip: '94.102.49.11', reason: 'Injection SQL', country: '🇳🇱', date: 'Hier' },
                  { ip: '45.83.65.208', reason: 'Bot malveillant', country: '🇩🇪', date: 'Il y a 3j' },
                  { ip: '178.218.145.9', reason: 'Scraping agressif', country: '🇺🇦', date: 'Il y a 5j' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-rose-500/5 border border-rose-500/15">
                    <span className="text-sm">{item.country}</span>
                    <div className="flex-1">
                      <p className="text-sm font-mono text-white">{item.ip}</p>
                      <p className="text-xs text-slate-500">{item.reason} · {item.date}</p>
                    </div>
                    <button
                      onClick={() => toast.success('IP débloquée')}
                      className="text-xs text-rose-400 hover:text-rose-300 transition-colors"
                    >
                      Débloquer
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Security event log */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
            className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.08]"
          >
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Activity size={16} className="text-indigo-400" />
                <h3 className="font-semibold text-white">Journal des événements de sécurité</h3>
              </div>
              <button className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
                Exporter les logs
              </button>
            </div>

            <div className="space-y-2">
              {securityEvents.map(event => (
                <div key={event.id} className="flex items-start gap-3 p-3 rounded-xl hover:bg-white/[0.02] transition-colors">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${eventColors[event.type as keyof typeof eventColors]}`}>
                    {eventIcons[event.type as keyof typeof eventIcons]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white">{event.message}</p>
                    <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-500 flex-wrap">
                      <span>{event.user}</span>
                      <span>·</span>
                      <span className="font-mono">{event.ip}</span>
                      <span>·</span>
                      <span>{event.country}</span>
                    </div>
                  </div>
                  <span className="text-xs text-slate-500 flex-shrink-0">{event.time}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </main>
      </div>
    </div>
  );
}
