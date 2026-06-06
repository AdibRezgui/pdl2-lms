'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, Users, Star, BookOpen, AlertCircle } from 'lucide-react';
import Sidebar from '@/components/dashboard/Sidebar';
import { useAuthStore } from '@/store/auth.store';
import Header from '@/components/dashboard/Header';
import StatsCard from '@/components/dashboard/StatsCard';
import { api } from '@/lib/api';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
} from 'recharts';

interface CourseStats {
  id: string;
  title: string;
  studentsCount: number;
  rating: number;
  published: boolean;
  avgProgress: number;
  completedCount: number;
}

interface Analytics {
  totalStudents: number;
  avgRating: number;
  totalCourses: number;
  publishedCourses: number;
  totalHours: number;
  totalQuizAttempts: number;
  courseStats: CourseStats[];
}

export default function TrainerAnalyticsPage() {
  const authUser = useAuthStore(s => s.user);
  const userName = authUser?.name ?? 'Formateur';
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<Analytics>('/trainer/analytics')
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const barData = (data?.courseStats ?? []).map(c => ({
    name: c.title.split(' ').slice(0, 3).join(' '),
    étudiants: c.studentsCount,
    progression: c.avgProgress,
    complétés: c.completedCount,
  }));

  const radarData = (data?.courseStats ?? []).map(c => ({
    subject: c.title.split(' ').slice(0, 2).join(' '),
    A: Math.round(c.rating * 20),
  }));

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar role="trainer" userName={userName} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Analytics" subtitle="Analyse détaillée de vos formations" />
        <main className="flex-1 overflow-y-auto p-6 space-y-6">

          {loading ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => <div key={i} className="h-28 rounded-2xl bg-white/[0.03] animate-pulse" />)}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatsCard title="Total stagiaires" value={data?.totalStudents ?? 0} icon={<Users size={20} />} color="indigo" delay={0} />
                <StatsCard title="Note moyenne" value={data?.avgRating ? `${data.avgRating}/5` : '—'} icon={<Star size={20} />} color="amber" delay={0.1} />
                <StatsCard title="Cours publiés" value={`${data?.publishedCourses ?? 0}/${data?.totalCourses ?? 0}`} icon={<BookOpen size={20} />} color="cyan" delay={0.2} />
                <StatsCard title="Tentatives quiz" value={data?.totalQuizAttempts ?? 0} icon={<TrendingUp size={20} />} color="emerald" delay={0.3} />
              </div>

              {barData.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-slate-500">
                  <AlertCircle size={32} className="mb-3 opacity-20" />
                  <p className="text-sm">Aucun cours créé pour le moment</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                    className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.08]">
                    <h3 className="font-semibold text-white mb-2">Stagiaires par cours</h3>
                    <p className="text-xs text-slate-500 mb-5">Nombre d&apos;inscrits actifs</p>
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={barData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                        <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{ background: '#0d0d1a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', color: '#fff' }} />
                        <Bar dataKey="étudiants" fill="#6366f1" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </motion.div>

                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                    className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.08]">
                    <h3 className="font-semibold text-white mb-2">Progression moyenne par cours (%)</h3>
                    <p className="text-xs text-slate-500 mb-5">Avancement moyen des stagiaires</p>
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={barData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                        <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                        <YAxis domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{ background: '#0d0d1a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', color: '#fff' }}
                          formatter={(v: number) => [`${v}%`, 'Progression']} />
                        <Bar dataKey="progression" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </motion.div>
                </div>
              )}

              {/* Course details table */}
              {(data?.courseStats ?? []).length > 0 && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                  className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.08]">
                  <h3 className="font-semibold text-white mb-5">Détail par cours</h3>
                  <div className="space-y-4">
                    {data!.courseStats.map(c => (
                      <div key={c.id} className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-sm font-semibold text-white truncate">{c.title}</p>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${c.published ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-500/10 text-slate-400'}`}>
                              {c.published ? 'Publié' : 'Brouillon'}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-slate-500">
                            <span><Users size={10} className="inline mr-1" />{c.studentsCount} inscrits</span>
                            <span><Star size={10} className="inline mr-1 text-amber-400" />{c.rating.toFixed(1)}/5</span>
                            <span>{c.completedCount} terminés</span>
                          </div>
                        </div>
                        <div className="w-32 text-right">
                          <p className="text-sm font-bold text-white mb-1">{c.avgProgress}%</p>
                          <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${c.avgProgress}%` }} />
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">progression moy.</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
