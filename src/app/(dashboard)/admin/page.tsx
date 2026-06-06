'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  BookOpen,
  TrendingUp,
  Award,
  Activity,
  ChevronRight,
  Shield,
  Globe,
  Zap,
} from 'lucide-react';
import Sidebar from '@/components/dashboard/Sidebar';
import Header from '@/components/dashboard/Header';
import StatsCard from '@/components/dashboard/StatsCard';
import { chartData } from '@/lib/mock-data';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from 'recharts';

interface AdminStats {
  totalUsers: number;
  totalCourses: number;
  totalRevenue: number;
  completionRate: number;
  recentUsers: { id: string; name: string; email: string; role: string }[];
}

export default function AdminDashboard() {
  const user = useAuthStore(s => s.user);
  const [stats, setStats] = useState<AdminStats | null>(null);

  useEffect(() => {
    api.get<AdminStats>('/admin/stats').then(setStats).catch(() => null);
  }, []);

  const userName = user?.name ?? 'Administrateur';

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar role="admin" userName={userName} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          title="Vue d'ensemble"
          subtitle="Tableau de bord administrateur — EduAI Pro"
        />

        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard title="Utilisateurs totaux" value={stats?.totalUsers ?? '—'} icon={<Users size={20} />} color="indigo" change={8.2} changeLabel=" ce mois" delay={0} />
            <StatsCard title="Cours actifs" value={stats?.totalCourses ?? '—'} icon={<BookOpen size={20} />} color="cyan" change={33} changeLabel=" ce mois" delay={0.1} />
            <StatsCard title="Revenus (TND)" value={stats ? stats.totalRevenue.toLocaleString() : '—'} icon={<TrendingUp size={20} />} color="emerald" change={12.5} changeLabel=" vs mois préc." delay={0.2} />
            <StatsCard title="Taux de complétion" value={stats ? `${stats.completionRate}%` : '—'} icon={<Award size={20} />} color="amber" change={3.1} changeLabel=" vs mois préc." delay={0.3} />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Enrollment trend */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="xl:col-span-2 p-5 rounded-2xl bg-white/[0.03] border border-white/[0.08]"
            >
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="font-semibold text-white">Croissance de la plateforme</h3>
                  <p className="text-xs text-slate-500">Inscriptions & cours sur 12 mois</p>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={chartData.monthlyEnrollments}>
                  <defs>
                    <linearGradient id="grad1" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="grad2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: '#0d0d1a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', color: '#fff' }} />
                  <Area type="monotone" dataKey="étudiants" stroke="#6366f1" strokeWidth={2} fill="url(#grad1)" dot={false} />
                  <Area type="monotone" dataKey="cours" stroke="#06b6d4" strokeWidth={2} fill="url(#grad2)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
              <div className="flex gap-4 mt-3">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <div className="w-3 h-1.5 rounded-full bg-indigo-500" />
                  Étudiants
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <div className="w-3 h-1.5 rounded-full bg-cyan-500" />
                  Cours
                </div>
              </div>
            </motion.div>

            {/* Distribution pie */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.08]"
            >
              <h3 className="font-semibold text-white mb-1">Contenu par catégorie</h3>
              <p className="text-xs text-slate-500 mb-4">Distribution des cours</p>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={chartData.categoryDistribution} cx="50%" cy="50%" innerRadius={50} outerRadius={72} paddingAngle={3} dataKey="value">
                    {chartData.categoryDistribution.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-3">
                {chartData.categoryDistribution.map((item, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ background: item.color }} />
                      <span className="text-xs text-slate-400 truncate">{item.name.split(' ')[0]}</span>
                    </div>
                    <span className="text-xs font-semibold text-white">{item.value}%</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Bottom grid */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Recent users */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.08]"
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-semibold text-white">Utilisateurs récents</h3>
                <button className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
                  Voir tout <ChevronRight size={12} />
                </button>
              </div>
              <div className="space-y-3">
                {(stats?.recentUsers ?? []).map(u => (
                  <div key={u.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/[0.03] transition-colors">
                    <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-xs font-bold text-indigo-300">
                      {u.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-white">{u.name}</p>
                      <p className="text-xs text-slate-500">{u.email}</p>
                    </div>
                    <div className="text-right">
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${
                        u.role === 'TRAINER' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                        u.role === 'ADMIN' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                        'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
                      }`}>
                        {u.role === 'TRAINER' ? 'Formateur' : u.role === 'ADMIN' ? 'Admin' : 'Stagiaire'}
                      </span>
                    </div>
                  </div>
                ))}
                {!stats && <p className="text-xs text-slate-500 text-center py-4">Chargement...</p>}
              </div>
            </motion.div>

            {/* System status */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.08]"
            >
              <h3 className="font-semibold text-white mb-5">Statut du système</h3>
              <div className="space-y-4">
                {[
                  { label: 'API Backend', status: 'Opérationnel', latency: '12ms', icon: <Zap size={14} />, ok: true },
                  { label: 'Base de données', status: 'Opérationnel', latency: '3ms', icon: <Activity size={14} />, ok: true },
                  { label: 'Service IA (EduBot)', status: 'Opérationnel', latency: '340ms', icon: <Shield size={14} />, ok: true },
                  { label: 'CDN & Médias', status: 'Opérationnel', latency: '28ms', icon: <Globe size={14} />, ok: true },
                ].map((s, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${s.ok ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                      {s.icon}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white">{s.label}</p>
                      <p className="text-xs text-slate-500">Latence: {s.latency}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className={`w-2 h-2 rounded-full ${s.ok ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                      <span className={`text-xs font-medium ${s.ok ? 'text-emerald-400' : 'text-rose-400'}`}>{s.status}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 p-3 rounded-xl bg-indigo-500/5 border border-indigo-500/20 text-center">
                <p className="text-xs text-slate-400">
                  Uptime: <span className="text-emerald-400 font-semibold">99.98%</span> sur les 30 derniers jours
                </p>
              </div>
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  );
}
