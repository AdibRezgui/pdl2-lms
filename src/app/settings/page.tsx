'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  User,
  Lock,
  Bell,
  Globe,
  Shield,
  Palette,
  ChevronRight,
  Brain,
  ArrowLeft,
  Save,
  Camera,
} from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

const tabs = [
  { id: 'profile', label: 'Profil', icon: <User size={16} /> },
  { id: 'security', label: 'Sécurité', icon: <Lock size={16} /> },
  { id: 'notifications', label: 'Notifications', icon: <Bell size={16} /> },
  { id: 'appearance', label: 'Apparence', icon: <Palette size={16} /> },
  { id: 'privacy', label: 'Confidentialité', icon: <Shield size={16} /> },
  { id: 'language', label: 'Langue', icon: <Globe size={16} /> },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile');
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: 'Youssef Mansouri',
    email: 'youssef@student.tn',
    bio: 'Passionné par l\'Intelligence Artificielle et le développement web.',
    phone: '+216 22 345 678',
    location: 'Tunis, Tunisie',
  });

  const [notifs, setNotifs] = useState({
    newCourse: true,
    progress: true,
    quiz: true,
    aiRecommendation: true,
    newsletter: false,
    marketing: false,
  });

  const save = async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 1000));
    setSaving(false);
    toast.success('Paramètres sauvegardés !');
  };

  return (
    <div className="min-h-screen bg-[#04040a]">
      {/* Header */}
      <div className="border-b border-white/[0.06] bg-[#04040a]/80 backdrop-blur-xl sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center gap-4">
          <Link href="/student" className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all">
            <ArrowLeft size={18} />
          </Link>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
              <Brain size={16} className="text-white" />
            </div>
            <span className="font-bold text-lg">EduAI Pro — Paramètres</span>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex gap-6">
          {/* Sidebar tabs */}
          <div className="w-52 flex-shrink-0">
            <nav className="space-y-1">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    activeTab === tab.id
                      ? 'bg-indigo-500/15 border border-indigo-500/30 text-indigo-300'
                      : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <span className={activeTab === tab.id ? 'text-indigo-400' : ''}>{tab.icon}</span>
                  {tab.label}
                  {activeTab === tab.id && <ChevronRight size={14} className="ml-auto" />}
                </button>
              ))}
            </nav>

            {/* Danger zone */}
            <div className="mt-8 p-4 rounded-xl bg-rose-500/5 border border-rose-500/20">
              <p className="text-xs font-semibold text-rose-400 mb-2">Zone dangereuse</p>
              <button className="text-xs text-rose-400 hover:text-rose-300 transition-colors" onClick={() => toast.error('Fonctionnalité désactivée en démo')}>
                Supprimer mon compte
              </button>
            </div>
          </div>

          {/* Content area */}
          <div className="flex-1 space-y-6">
            {activeTab === 'profile' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-white">Informations personnelles</h2>
                  <p className="text-sm text-slate-400 mt-1">Gérez votre profil public et vos informations de contact.</p>
                </div>

                {/* Avatar */}
                <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/[0.08] space-y-5">
                  <div className="flex items-center gap-5">
                    <div className="relative">
                      <div className="w-20 h-20 rounded-2xl bg-indigo-500/20 border-2 border-indigo-500/30 flex items-center justify-center text-2xl font-black text-indigo-300">
                        YM
                      </div>
                      <button className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-indigo-600 border-2 border-[#04040a] flex items-center justify-center hover:bg-indigo-500 transition-colors">
                        <Camera size={12} className="text-white" />
                      </button>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">Photo de profil</p>
                      <p className="text-xs text-slate-400 mt-0.5">PNG, JPG — Max 2MB</p>
                      <button className="text-xs text-indigo-400 hover:text-indigo-300 mt-1 transition-colors">
                        Changer la photo
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <Input label="Nom complet" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} icon={<User size={14} />} />
                    <Input label="Email" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                    <Input label="Téléphone" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
                    <Input label="Localisation" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-slate-300 mb-1.5 block">Bio</label>
                    <textarea
                      rows={3}
                      value={form.bio}
                      onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/40 resize-none"
                    />
                  </div>

                  <div className="flex justify-end">
                    <Button gradient icon={<Save size={14} />} loading={saving} onClick={save}>
                      Sauvegarder les modifications
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'security' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-white">Sécurité du compte</h2>
                  <p className="text-sm text-slate-400 mt-1">Protégez votre compte avec un mot de passe fort et la double authentification.</p>
                </div>

                <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/[0.08] space-y-5">
                  <h3 className="font-semibold text-white">Changer le mot de passe</h3>
                  <Input label="Mot de passe actuel" type="password" placeholder="••••••••" icon={<Lock size={14} />} />
                  <Input label="Nouveau mot de passe" type="password" placeholder="Min. 8 caractères" icon={<Lock size={14} />} hint="Au moins 8 caractères avec majuscules et chiffres" />
                  <Input label="Confirmer le nouveau mot de passe" type="password" placeholder="••••••••" icon={<Lock size={14} />} />
                  <Button gradient icon={<Save size={14} />} loading={saving} onClick={save}>
                    Mettre à jour le mot de passe
                  </Button>
                </div>

                <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/[0.08]">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-white">Authentification à deux facteurs</h3>
                      <p className="text-sm text-slate-400 mt-1">Ajoutez une couche de sécurité supplémentaire à votre compte.</p>
                    </div>
                    <button
                      onClick={() => toast.success('2FA activé !')}
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors"
                    >
                      Activer 2FA
                    </button>
                  </div>
                </div>

                <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/[0.08]">
                  <h3 className="font-semibold text-white mb-4">Sessions actives</h3>
                  {[
                    { device: 'Chrome — Windows 11', location: 'Tunis, Tunisie', current: true, time: 'Actuel' },
                    { device: 'Safari — iPhone 15', location: 'Tunis, Tunisie', current: false, time: 'Il y a 2 jours' },
                  ].map((session, i) => (
                    <div key={i} className="flex items-center justify-between py-3 border-b border-white/[0.05] last:border-0">
                      <div>
                        <p className="text-sm font-medium text-white">{session.device}</p>
                        <p className="text-xs text-slate-500">{session.location} · {session.time}</p>
                      </div>
                      {session.current ? (
                        <span className="text-xs px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Session actuelle</span>
                      ) : (
                        <button className="text-xs text-rose-400 hover:text-rose-300 transition-colors" onClick={() => toast.success('Session révoquée')}>
                          Révoquer
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'notifications' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-white">Préférences de notifications</h2>
                  <p className="text-sm text-slate-400 mt-1">Choisissez les notifications que vous souhaitez recevoir.</p>
                </div>

                <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/[0.08] space-y-4">
                  {[
                    { key: 'newCourse', label: 'Nouveaux cours disponibles', desc: 'Soyez alerté quand un nouveau cours est publié dans vos catégories' },
                    { key: 'progress', label: 'Rappels de progression', desc: 'Rappels pour continuer vos cours en cours' },
                    { key: 'quiz', label: 'Résultats d\'évaluations', desc: 'Notifications après chaque quiz ou évaluation' },
                    { key: 'aiRecommendation', label: 'Recommandations IA', desc: 'Suggestions personnalisées basées sur votre profil' },
                    { key: 'newsletter', label: 'Newsletter mensuelle', desc: 'Actualités et conseils sur l\'apprentissage en ligne' },
                    { key: 'marketing', label: 'Offres promotionnelles', desc: 'Promotions et réductions sur les cours premium' },
                  ].map(item => (
                    <div key={item.key} className="flex items-start justify-between gap-4 py-3 border-b border-white/[0.05] last:border-0">
                      <div>
                        <p className="text-sm font-medium text-white">{item.label}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{item.desc}</p>
                      </div>
                      <button
                        onClick={() => setNotifs(prev => ({ ...prev, [item.key]: !prev[item.key as keyof typeof prev] }))}
                        className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${
                          notifs[item.key as keyof typeof notifs] ? 'bg-indigo-600' : 'bg-white/10'
                        }`}
                      >
                        <span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
                          notifs[item.key as keyof typeof notifs] ? 'translate-x-5' : 'translate-x-0'
                        }`} />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex justify-end">
                  <Button gradient icon={<Save size={14} />} loading={saving} onClick={save}>Sauvegarder</Button>
                </div>
              </motion.div>
            )}

            {activeTab === 'appearance' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-white">Apparence</h2>
                  <p className="text-sm text-slate-400 mt-1">Personnalisez l&apos;interface selon vos préférences.</p>
                </div>
                <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/[0.08] space-y-5">
                  <div>
                    <p className="text-sm font-medium text-slate-300 mb-3">Thème</p>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { id: 'dark', label: 'Sombre', preview: 'bg-[#04040a]' },
                        { id: 'darker', label: 'Très sombre', preview: 'bg-black' },
                        { id: 'midnight', label: 'Minuit', preview: 'bg-indigo-950' },
                      ].map(theme => (
                        <button key={theme.id} className="p-3 rounded-xl border border-indigo-500/30 bg-indigo-500/10 text-center">
                          <div className={`w-full h-10 rounded-lg ${theme.preview} border border-white/10 mb-2`} />
                          <p className="text-xs font-medium text-white">{theme.label}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-300 mb-3">Couleur d&apos;accent</p>
                    <div className="flex gap-3">
                      {['bg-indigo-600', 'bg-purple-600', 'bg-cyan-600', 'bg-emerald-600', 'bg-rose-600'].map((c, i) => (
                        <button key={i} className={`w-8 h-8 rounded-full ${c} ${i === 0 ? 'ring-2 ring-white ring-offset-2 ring-offset-[#04040a]' : ''}`} />
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {(activeTab === 'privacy' || activeTab === 'language') && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-6 rounded-2xl bg-white/[0.03] border border-white/[0.08]">
                <h2 className="text-xl font-bold text-white mb-4">{activeTab === 'privacy' ? 'Confidentialité' : 'Langue & Région'}</h2>
                <p className="text-sm text-slate-400">Cette section est en cours de développement.</p>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
