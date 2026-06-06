'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Award, Clock, Target, BookOpen, CheckCircle, AlertCircle } from 'lucide-react';
import Sidebar from '@/components/dashboard/Sidebar';
import { useAuthStore } from '@/store/auth.store';
import Header from '@/components/dashboard/Header';
import StatsCard from '@/components/dashboard/StatsCard';
import ProgressBar from '@/components/ui/ProgressBar';
import { api } from '@/lib/api';
import {
  RadarChart, PolarGrid, PolarAngleAxis, Radar,
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts';

interface Enrollment {
  id: string;
  course: { id: string; title: string; thumbnail: string; category: string; durationHours: number };
  progress: number;
  completed: boolean;
  lastAccessedAt: string | null;
}

interface QuizAttempt {
  id: string;
  score: number;
  passed: boolean;
  quiz: { title: string; course: { category: string } };
}

export default function ProgressPage() {
  const authUser = useAuthStore(s => s.user);
  const userName = authUser?.name ?? 'Stagiaire';

  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get<Enrollment[]>('/enrollments/me'),
      api.get<QuizAttempt[]>('/quizzes/attempts/me'),
    ]).then(([enrs, atts]) => {
      setEnrollments(enrs);
      setAttempts(atts);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const completed = enrollments.filter(e => e.completed).length;
  const inProgress = enrollments.filter(e => !e.completed && e.progress > 0).length;
  const avgScore = attempts.length
    ? Math.round(attempts.reduce((a, t) => a + t.score, 0) / attempts.length)
    : 0;

  // Radar: category scores
  const catScores: Record<string, number[]> = {};
  attempts.forEach(a => {
    const cat = a.quiz?.course?.category || 'Général';
    if (!catScores[cat]) catScores[cat] = [];
    catScores[cat].push(a.score);
  });
  const radarData = Object.entries(catScores).map(([subject, scores]) => ({
    subject: subject.length > 12 ? subject.slice(0, 12) + '…' : subject,
    A: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
  }));
  if (radarData.length === 0) radarData.push({ subject: 'Aucune donnée', A: 0 });

  // Bar: progress per course
  const barData = enrollments.map(e => ({
    name: e.course.title.split(' ').slice(0, 3).join(' '),
    progression: e.progress,
  }));

  const badges = [
    { icon: '🚀', label: 'Premier cours', desc: 'Vous avez commencé !', earned: enrollments.length > 0 },
    { icon: '🎓', label: 'Premier diplôme', desc: 'Cours complété', earned: completed > 0 },
    { icon: '📝', label: 'Évaluateur', desc: 'Quiz passé', earned: attempts.length > 0 },
    { icon: '⭐', label: 'Apprenant actif', desc: '3+ cours inscrits', earned: enrollments.length >= 3 },
  ];

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar role="student" userName={userName} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Ma progression" subtitle="Suivez votre évolution et vos compétences" />
        <main className="flex-1 overflow-y-auto p-6 space-y-6">

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard title="Cours complétés" value={completed} icon={<CheckCircle size={20} />} color="emerald" delay={0} />
            <StatsCard title="En cours" value={inProgress} icon={<BookOpen size={20} />} color="indigo" delay={0.1} />
            <StatsCard title="Quiz passés" value={attempts.length} icon={<Clock size={20} />} color="cyan" delay={0.2} />
            <StatsCard title="Score moyen" value={attempts.length ? `${avgScore}%` : '—'} icon={<Target size={20} />} color="amber" delay={0.3} />
          </div>

          {loading ? (
            <div className="h-64 rounded-2xl bg-white/[0.03] animate-pulse" />
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {/* Radar — scores par catégorie */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.08]">
                <h3 className="font-semibold text-white mb-2">Scores par catégorie</h3>
                <p className="text-xs text-slate-500 mb-5">Basé sur vos résultats aux quiz</p>
                <ResponsiveContainer width="100%" height={260}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="rgba(255,255,255,0.06)" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 11 }} />
                    <Radar name="Score" dataKey="A" stroke="#6366f1" fill="#6366f1" fillOpacity={0.2} strokeWidth={2} />
                  </RadarChart>
                </ResponsiveContainer>
              </motion.div>

              {/* Bar — progression par cours */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.08]">
                <h3 className="font-semibold text-white mb-2">Progression par cours</h3>
                <p className="text-xs text-slate-500 mb-5">Pourcentage d&apos;avancement</p>
                {barData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={barData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                      <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ background: '#0d0d1a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', color: '#fff' }}
                        formatter={(v: number) => [`${v}%`, 'Progression']} />
                      <Bar dataKey="progression" fill="#6366f1" radius={[6, 6, 0, 0]} opacity={0.8} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-64 text-slate-500 text-sm">
                    <AlertCircle size={20} className="mr-2 opacity-50" /> Aucun cours inscrit
                  </div>
                )}
              </motion.div>
            </div>
          )}

          {/* Detail per course */}
          {enrollments.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
              className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.08]">
              <h3 className="font-semibold text-white mb-5">Détail par cours</h3>
              <div className="space-y-5">
                {enrollments.map(e => (
                  <div key={e.id} className="flex gap-4 items-start">
                    <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-white/5 flex items-center justify-center">
                      {e.course.thumbnail ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={e.course.thumbnail} alt={e.course.title} className="w-full h-full object-cover" />
                      ) : (
                        <BookOpen size={20} className="text-slate-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1.5">
                        <p className="font-semibold text-white text-sm">{e.course.title}</p>
                        <div className="flex items-center gap-2">
                          {e.completed && <span className="flex items-center gap-1 text-xs text-emerald-400"><Award size={11} /> Certifié</span>}
                          <span className="text-sm font-bold text-white">{e.progress}%</span>
                        </div>
                      </div>
                      <ProgressBar value={e.progress} size="md" color={e.completed ? 'emerald' : 'gradient'} />
                      <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                        {e.lastAccessedAt && (
                          <span className="flex items-center gap-1">
                            <Clock size={10} />
                            Dernière session: {new Date(e.lastAccessedAt).toLocaleDateString('fr-FR')}
                          </span>
                        )}
                        <span className="capitalize">{e.course.category}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Badges */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
            className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.08]">
            <h3 className="font-semibold text-white mb-5">Récompenses & badges</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {badges.map((badge, i) => (
                <div key={i} className={`p-4 rounded-xl border text-center transition-all ${badge.earned ? 'bg-indigo-500/10 border-indigo-500/20' : 'bg-white/[0.02] border-white/[0.06] opacity-40'}`}>
                  <div className="text-3xl mb-2">{badge.icon}</div>
                  <p className="text-sm font-semibold text-white">{badge.label}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{badge.desc}</p>
                  {!badge.earned && <p className="text-xs text-slate-600 mt-1">Non obtenu</p>}
                </div>
              ))}
            </div>
          </motion.div>

        </main>
      </div>
    </div>
  );
}
