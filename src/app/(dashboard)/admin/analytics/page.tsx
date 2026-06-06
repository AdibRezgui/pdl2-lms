'use client';

import { motion } from 'framer-motion';
import { TrendingUp, Users, BookOpen, Award, BarChart3, Globe, DollarSign, Clock } from 'lucide-react';
import Sidebar from '@/components/dashboard/Sidebar';
import { useAuthStore } from '@/store/auth.store';
import Header from '@/components/dashboard/Header';
import StatsCard from '@/components/dashboard/StatsCard';
import { chartData, mockCourses } from '@/lib/mock-data';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';


const topCourses = mockCourses
  .sort((a, b) => b.studentsCount - a.studentsCount)
  .slice(0, 5);

const countryData = [
  { country: 'Tunisie', users: 5840, pct: 47 },
  { country: 'Algérie', users: 2910, pct: 23 },
  { country: 'Maroc', users: 1980, pct: 16 },
  { country: 'France', users: 1240, pct: 10 },
  { country: 'Autres', users: 513, pct: 4 },
];

const revenueData = [
  { month: 'Sep', revenus: 28400, abonnements: 18200 },
  { month: 'Oct', revenus: 33100, abonnements: 21400 },
  { month: 'Nov', revenus: 39800, abonnements: 25600 },
  { month: 'Déc', revenus: 48290, abonnements: 31200 },
];

export default function AdminAnalyticsPage() {
  const authUser = useAuthStore(s => s.user);
  const userName = authUser?.name ?? 'Administrateur';
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar role="admin" userName={userName} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Analytics plateforme" subtitle="Métriques et performances globales" />

        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard title="Utilisateurs actifs" value="8,340" icon={<Users size={20} />} color="indigo" change={12.4} changeLabel=" vs mois préc." delay={0} />
            <StatsCard title="Revenus mensuels" value="48,290 TND" icon={<DollarSign size={20} />} color="emerald" change={22.8} changeLabel=" vs mois préc." delay={0.1} />
            <StatsCard title="Taux de rétention" value="78%" icon={<TrendingUp size={20} />} color="cyan" change={3.2} changeLabel=" vs mois préc." delay={0.2} />
            <StatsCard title="Heures consommées" value="45,200h" icon={<Clock size={20} />} color="amber" change={18.6} changeLabel=" vs mois préc." delay={0.3} />
          </div>

          {/* Main charts row */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Enrollment trend */}
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="xl:col-span-2 p-5 rounded-2xl bg-white/[0.03] border border-white/[0.08]"
            >
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="font-semibold text-white">Croissance des inscriptions</h3>
                  <p className="text-xs text-slate-500">12 derniers mois</p>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                  +775% sur l&apos;année
                </span>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={chartData.monthlyEnrollments}>
                  <defs>
                    <linearGradient id="ga" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: '#0d0d1a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', color: '#fff' }} />
                  <Area type="monotone" dataKey="étudiants" stroke="#6366f1" strokeWidth={2.5} fill="url(#ga)" dot={false} activeDot={{ r: 5, fill: '#818cf8' }} />
                </AreaChart>
              </ResponsiveContainer>
            </motion.div>

            {/* Category distribution */}
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.08]"
            >
              <h3 className="font-semibold text-white mb-1">Répartition des cours</h3>
              <p className="text-xs text-slate-500 mb-4">Par catégorie</p>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={chartData.categoryDistribution} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={4} dataKey="value">
                    {chartData.categoryDistribution.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2">
                {chartData.categoryDistribution.map((item, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ background: item.color }} />
                      <span className="text-slate-400 truncate">{item.name.split(' ').slice(-1)[0]}</span>
                    </div>
                    <span className="font-semibold text-white">{item.value}%</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Revenue + Top courses */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Revenue chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
              className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.08]"
            >
              <h3 className="font-semibold text-white mb-1">Revenus & Abonnements</h3>
              <p className="text-xs text-slate-500 mb-5">4 derniers mois (TND)</p>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: '#0d0d1a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', color: '#fff' }} />
                  <Bar dataKey="revenus" fill="#6366f1" radius={[6, 6, 0, 0]} opacity={0.9} name="Revenus totaux" />
                  <Bar dataKey="abonnements" fill="#06b6d4" radius={[6, 6, 0, 0]} opacity={0.7} name="Abonnements" />
                </BarChart>
              </ResponsiveContainer>
              <div className="flex gap-4 mt-2">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <div className="w-3 h-1.5 rounded-full bg-indigo-500" /> Revenus totaux
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <div className="w-3 h-1.5 rounded-full bg-cyan-500" /> Abonnements
                </div>
              </div>
            </motion.div>

            {/* Top courses */}
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
              className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.08]"
            >
              <h3 className="font-semibold text-white mb-5">Top cours par étudiants</h3>
              <div className="space-y-4">
                {topCourses.map((course, i) => (
                  <div key={course.id} className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-xs font-bold text-indigo-400">
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{course.title}</p>
                      <div className="mt-1 flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                            style={{ width: `${(course.studentsCount / 1300) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-slate-400 font-medium w-12 text-right">
                          {course.studentsCount.toLocaleString('fr-FR')}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Geographic distribution */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
            className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.08]"
          >
            <div className="flex items-center gap-2 mb-5">
              <Globe size={16} className="text-indigo-400" />
              <h3 className="font-semibold text-white">Répartition géographique</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
              {countryData.map((item, i) => (
                <div key={i} className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] text-center">
                  <p className="text-lg font-black text-white">{item.pct}%</p>
                  <p className="text-sm font-medium text-slate-300 mt-0.5">{item.country}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{item.users.toLocaleString('fr-FR')} utilisateurs</p>
                  <div className="mt-2 h-1 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${item.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </main>
      </div>
    </div>
  );
}
