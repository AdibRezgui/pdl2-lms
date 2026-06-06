'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Bell, Send, Users, BookOpen, AlertTriangle, CheckCircle,
  Info, X, Megaphone, Mail, Smartphone, Globe,
} from 'lucide-react';
import Sidebar from '@/components/dashboard/Sidebar';
import { useAuthStore } from '@/store/auth.store';
import Header from '@/components/dashboard/Header';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import toast from 'react-hot-toast';


const sentNotifications = [
  {
    id: 1,
    title: 'Maintenance programmée',
    message: 'La plateforme sera en maintenance le 10 janvier de 02h à 04h.',
    audience: 'Tous les utilisateurs',
    sent: '5 Jan 2025',
    reach: 12483,
    read: 8940,
    type: 'warning' as const,
  },
  {
    id: 2,
    title: 'Nouveau cours disponible : NLP Avancé',
    message: 'Le cours sur le NLP avec Transformers est maintenant disponible !',
    audience: 'Stagiaires IA',
    sent: '3 Jan 2025',
    reach: 3240,
    read: 2810,
    type: 'info' as const,
  },
  {
    id: 3,
    title: 'Mise à jour de la politique de confidentialité',
    message: 'Notre politique de confidentialité a été mise à jour. Veuillez en prendre connaissance.',
    audience: 'Tous les utilisateurs',
    sent: '28 Déc 2024',
    reach: 11900,
    read: 6700,
    type: 'info' as const,
  },
];

const typeConfig = {
  info: { color: 'text-blue-400 bg-blue-500/10 border-blue-500/20', icon: <Info size={14} /> },
  warning: { color: 'text-amber-400 bg-amber-500/10 border-amber-500/20', icon: <AlertTriangle size={14} /> },
  success: { color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', icon: <CheckCircle size={14} /> },
  error: { color: 'text-rose-400 bg-rose-500/10 border-rose-500/20', icon: <X size={14} /> },
};

export default function AdminNotificationsPage() {
  const authUser = useAuthStore(s => s.user);
  const userName = authUser?.name ?? 'Administrateur';
  const [sending, setSending] = useState(false);
  const [form, setForm] = useState({
    title: '',
    message: '',
    audience: 'all',
    type: 'info',
    channels: { inApp: true, email: false, push: false },
  });

  const sendNotification = async () => {
    if (!form.title || !form.message) {
      toast.error('Remplissez le titre et le message');
      return;
    }
    setSending(true);
    await new Promise(r => setTimeout(r, 1500));
    setSending(false);
    toast.success('Notification envoyée à 12 483 utilisateurs !');
    setForm({ title: '', message: '', audience: 'all', type: 'info', channels: { inApp: true, email: false, push: false } });
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar role="admin" userName={userName} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Notifications" subtitle="Envoyez des communications à vos utilisateurs" />

        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { icon: <Bell size={18} />, label: 'Envoyées ce mois', value: '24', color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20' },
              { icon: <Users size={18} />, label: 'Utilisateurs atteints', value: '48,200', color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20' },
              { icon: <CheckCircle size={18} />, label: 'Taux de lecture moyen', value: '72%', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
            ].map((stat, i) => (
              <div key={i} className={`p-4 rounded-2xl border flex items-center gap-4 ${stat.color}`}>
                <div className="w-10 h-10 rounded-xl bg-current/10 flex items-center justify-center">
                  {stat.icon}
                </div>
                <div>
                  <p className="text-2xl font-black text-white">{stat.value}</p>
                  <p className="text-xs opacity-80">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Compose notification */}
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.08] space-y-5"
            >
              <div className="flex items-center gap-2">
                <Megaphone size={18} className="text-indigo-400" />
                <h3 className="font-semibold text-white">Composer une notification</h3>
              </div>

              <Input
                label="Titre de la notification"
                placeholder="Ex: Maintenance programmée, Nouveau cours..."
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              />

              <div>
                <label className="text-sm font-medium text-slate-300 mb-1.5 block">Message</label>
                <textarea
                  rows={4}
                  value={form.message}
                  onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                  placeholder="Contenu de votre notification..."
                  className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/40 resize-none"
                />
              </div>

              {/* Audience */}
              <div>
                <label className="text-sm font-medium text-slate-300 mb-2 block">Audience cible</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'all', label: 'Tous les utilisateurs', icon: <Globe size={14} />, count: '12,483' },
                    { value: 'students', label: 'Stagiaires uniquement', icon: <Users size={14} />, count: '10,240' },
                    { value: 'trainers', label: 'Formateurs uniquement', icon: <BookOpen size={14} />, count: '243' },
                    { value: 'inactive', label: 'Utilisateurs inactifs', icon: <Bell size={14} />, count: '2,100' },
                  ].map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setForm(f => ({ ...f, audience: opt.value }))}
                      className={`flex items-center gap-2 p-3 rounded-xl border text-left transition-all ${
                        form.audience === opt.value
                          ? 'bg-indigo-500/15 border-indigo-500/30 text-indigo-300'
                          : 'bg-white/[0.02] border-white/[0.08] text-slate-400 hover:border-white/20'
                      }`}
                    >
                      {opt.icon}
                      <div>
                        <p className="text-xs font-medium">{opt.label}</p>
                        <p className="text-xs opacity-60">{opt.count}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Type */}
              <div>
                <label className="text-sm font-medium text-slate-300 mb-2 block">Type</label>
                <div className="flex gap-2">
                  {(['info', 'warning', 'success', 'error'] as const).map(t => (
                    <button
                      key={t}
                      onClick={() => setForm(f => ({ ...f, type: t }))}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                        form.type === t ? typeConfig[t].color : 'bg-white/[0.02] border-white/[0.08] text-slate-400'
                      }`}
                    >
                      {t === 'info' ? 'Info' : t === 'warning' ? 'Avertissement' : t === 'success' ? 'Succès' : 'Erreur'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Channels */}
              <div>
                <label className="text-sm font-medium text-slate-300 mb-2 block">Canaux d&apos;envoi</label>
                <div className="flex gap-3">
                  {[
                    { key: 'inApp', label: 'In-App', icon: <Bell size={13} /> },
                    { key: 'email', label: 'Email', icon: <Mail size={13} /> },
                    { key: 'push', label: 'Push', icon: <Smartphone size={13} /> },
                  ].map(ch => (
                    <button
                      key={ch.key}
                      onClick={() => setForm(f => ({ ...f, channels: { ...f.channels, [ch.key]: !f.channels[ch.key as keyof typeof f.channels] } }))}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition-all ${
                        form.channels[ch.key as keyof typeof form.channels]
                          ? 'bg-indigo-500/15 border-indigo-500/30 text-indigo-300'
                          : 'bg-white/[0.02] border-white/[0.08] text-slate-400'
                      }`}
                    >
                      {ch.icon} {ch.label}
                    </button>
                  ))}
                </div>
              </div>

              <Button gradient icon={<Send size={14} />} loading={sending} onClick={sendNotification} className="w-full">
                Envoyer la notification
              </Button>
            </motion.div>

            {/* Sent history */}
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.08]"
            >
              <h3 className="font-semibold text-white mb-5">Historique des envois</h3>
              <div className="space-y-4">
                {sentNotifications.map(notif => (
                  <div key={notif.id} className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-3">
                    <div className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${typeConfig[notif.type].color}`}>
                        {typeConfig[notif.type].icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white">{notif.title}</p>
                        <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{notif.message}</p>
                      </div>
                      <span className="text-xs text-slate-500 flex-shrink-0">{notif.sent}</span>
                    </div>

                    <div className="grid grid-cols-3 gap-3 text-xs">
                      <div className="text-center p-2 rounded-lg bg-white/[0.03]">
                        <p className="font-bold text-white">{notif.reach.toLocaleString('fr-FR')}</p>
                        <p className="text-slate-500">Atteints</p>
                      </div>
                      <div className="text-center p-2 rounded-lg bg-white/[0.03]">
                        <p className="font-bold text-white">{notif.read.toLocaleString('fr-FR')}</p>
                        <p className="text-slate-500">Lus</p>
                      </div>
                      <div className="text-center p-2 rounded-lg bg-white/[0.03]">
                        <p className="font-bold text-emerald-400">{Math.round((notif.read / notif.reach) * 100)}%</p>
                        <p className="text-slate-500">Taux lecture</p>
                      </div>
                    </div>

                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-full"
                        style={{ width: `${Math.round((notif.read / notif.reach) * 100)}%` }}
                      />
                    </div>

                    <p className="text-xs text-slate-500">Audience: {notif.audience}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  );
}
