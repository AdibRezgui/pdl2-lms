'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  BookOpen, Clock, Award, TrendingUp, MessageSquare,
  Play, ChevronRight, Star, Zap, Brain, AlertCircle,
} from 'lucide-react';
import Sidebar from '@/components/dashboard/Sidebar';
import { useAuthStore } from '@/store/auth.store';
import Header from '@/components/dashboard/Header';
import StatsCard from '@/components/dashboard/StatsCard';
import ProgressBar from '@/components/ui/ProgressBar';
import { api } from '@/lib/api';

interface Enrollment {
  id: string;
  course: { id: string; title: string; thumbnail: string; trainer: { name: string } };
  progress: number;
  completed: boolean;
  lastAccessedAt: string | null;
}

interface RecoItem {
  courseId: string;
  title: string;
  category: string;
  trainerName: string;
  rating: number;
}

export default function StudentDashboard() {
  const authUser = useAuthStore(s => s.user);
  const userName = authUser?.name ?? 'Stagiaire';

  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [recommendations, setRecommendations] = useState<RecoItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get<Enrollment[]>('/enrollments/me'),
      api.get<{ recommendations?: RecoItem[] }>('/ai/recommend').catch(() => ({ recommendations: [] })),
    ]).then(([enrs, recoData]) => {
      setEnrollments(enrs);
      setRecommendations((recoData as any).recommendations ?? []);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const inProgress = enrollments.filter(e => !e.completed && e.progress > 0);
  const completed = enrollments.filter(e => e.completed);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar role="student" userName={userName} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          title="Tableau de bord"
          subtitle={`Bonjour, ${userName.split(' ')[0]} ! Continuez sur votre lancée 🚀`}
        />
        <main className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard title="Cours inscrits" value={enrollments.length} icon={<BookOpen size={20} />} color="indigo" delay={0} />
            <StatsCard title="En cours" value={inProgress.length} icon={<TrendingUp size={20} />} color="cyan" delay={0.1} />
            <StatsCard title="Terminés" value={completed.length} icon={<Award size={20} />} color="emerald" delay={0.2} />
            <StatsCard title="Certificats" value={completed.length} icon={<Star size={20} />} color="amber" delay={0.3} />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* EduBot quick access */}
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="xl:col-span-2 relative overflow-hidden p-5 rounded-2xl bg-gradient-to-br from-indigo-600/20 via-purple-600/10 to-transparent border border-indigo-500/20"
            >
              <div className="absolute inset-0 opacity-5">
                <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-indigo-400 blur-3xl" />
              </div>
              <div className="relative flex items-center gap-5">
                <div className="w-14 h-14 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center flex-shrink-0">
                  <Brain size={28} className="text-indigo-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-white text-lg mb-1">Assistant EduBot IA</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    Posez des questions sur vos cours, obtenez des recommandations personnalisées et suivez votre progression avec l&apos;IA.
                  </p>
                </div>
                <Link href="/student/chat">
                  <button className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium flex items-center gap-2 transition-colors whitespace-nowrap">
                    <MessageSquare size={16} /> Ouvrir
                    <Zap size={12} className="text-indigo-200" />
                  </button>
                </Link>
              </div>
            </motion.div>

            {/* Quick stats box */}
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
              className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex flex-col justify-between"
            >
              <h3 className="font-semibold text-white mb-4">Progression globale</h3>
              {enrollments.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-500 text-sm">
                  <BookOpen size={32} className="mb-2 opacity-20" />
                  Aucun cours inscrit
                </div>
              ) : (
                <div className="space-y-3">
                  {enrollments.slice(0, 3).map(e => (
                    <div key={e.id}>
                      <div className="flex justify-between text-xs text-slate-400 mb-1">
                        <span className="truncate max-w-[160px]">{e.course.title}</span>
                        <span>{e.progress}%</span>
                      </div>
                      <ProgressBar value={e.progress} size="sm" color={e.completed ? 'emerald' : 'gradient'} />
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>

          {/* My courses in progress */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.08]"
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-white">Mes cours en cours</h3>
              <Link href="/student/courses">
                <button className="text-sm text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors">
                  Voir tout <ChevronRight size={14} />
                </button>
              </Link>
            </div>

            {loading ? (
              <div className="space-y-4">
                {[1, 2].map(i => (
                  <div key={i} className="h-20 rounded-xl bg-white/[0.03] animate-pulse" />
                ))}
              </div>
            ) : inProgress.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-slate-500">
                <AlertCircle size={32} className="mb-2 opacity-20" />
                <p className="text-sm">Aucun cours en cours — <Link href="/student/courses" className="text-indigo-400 hover:underline">explorez le catalogue</Link></p>
              </div>
            ) : (
              <div className="space-y-4">
                {inProgress.map(e => (
                  <Link key={e.id} href={`/student/courses/${e.course.id}`}>
                    <div className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.12] transition-all group cursor-pointer">
                      <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-white/5">
                        {e.course.thumbnail ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={e.course.thumbnail} alt={e.course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <BookOpen size={24} className="text-slate-600" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-white text-sm truncate">{e.course.title}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{e.course.trainer?.name}</p>
                        <div className="mt-2">
                          <ProgressBar value={e.progress} size="sm" color="gradient" />
                          <p className="text-xs text-slate-500 mt-1">{e.progress}% complété</p>
                        </div>
                      </div>
                      <button className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 hover:bg-indigo-500/20 transition-colors flex-shrink-0">
                        <Play size={14} className="ml-0.5" />
                      </button>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </motion.div>

          {/* AI Recommendations */}
          {recommendations.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
              className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.08]"
            >
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="font-semibold text-white">Recommandé pour vous</h3>
                  <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                    <Brain size={11} className="text-indigo-400" />
                    Sélectionné par l&apos;IA selon votre profil
                  </p>
                </div>
                <Link href="/student/courses">
                  <button className="text-sm text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors">
                    Explorer <ChevronRight size={14} />
                  </button>
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {recommendations.slice(0, 3).map(r => (
                  <div key={r.courseId} className="group flex gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-indigo-500/30 cursor-pointer transition-all">
                    <div className="w-12 h-12 rounded-lg bg-indigo-500/10 flex items-center justify-center flex-shrink-0">
                      <Brain size={20} className="text-indigo-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white line-clamp-2 leading-snug">{r.title}</p>
                      <p className="text-xs text-slate-500 mt-1">{r.category}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

        </main>
      </div>
    </div>
  );
}
