'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, TrendingUp, TrendingDown, Brain, AlertTriangle, CheckCircle, AlertCircle, Users } from 'lucide-react';
import Sidebar from '@/components/dashboard/Sidebar';
import { useAuthStore } from '@/store/auth.store';
import Header from '@/components/dashboard/Header';
import ProgressBar from '@/components/ui/ProgressBar';
import { api } from '@/lib/api';

interface StudentEnrollment {
  courseId: string;
  courseTitle: string;
  progress: number;
  completed: boolean;
  lastAccessedAt: string | null;
}

interface StudentRow {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  joinedAt: string;
  avgProgress: number;
  coursesCount: number;
  enrollments: StudentEnrollment[];
}

export default function TrainerStudentsPage() {
  const authUser = useAuthStore(s => s.user);
  const userName = authUser?.name ?? 'Formateur';
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    api.get<StudentRow[]>('/trainer/students')
      .then(setStudents)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = students.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.email.toLowerCase().includes(search.toLowerCase())
  );

  const selectedStudent = students.find(s => s.id === selected);

  const aiInsights = (s: StudentRow) => {
    const insights = [];
    if (s.avgProgress >= 70) {
      insights.push({ icon: <TrendingUp size={13} className="text-emerald-400" />, text: 'Progression régulière — en avance sur la moyenne de la classe' });
    } else if (s.avgProgress < 30) {
      insights.push({ icon: <TrendingDown size={13} className="text-rose-400" />, text: 'Progression lente — intervention recommandée' });
    }
    const stuck = s.enrollments.find(e => !e.completed && e.progress > 0 && e.progress < 50);
    if (stuck) {
      insights.push({ icon: <AlertTriangle size={13} className="text-amber-400" />, text: `Difficulté détectée sur "${stuck.courseTitle}" — suivi recommandé` });
    }
    const completed = s.enrollments.filter(e => e.completed).length;
    if (completed > 0) {
      insights.push({ icon: <CheckCircle size={13} className="text-indigo-400" />, text: `${completed} cours terminé(s) avec succès` });
    }
    if (insights.length === 0) {
      insights.push({ icon: <Brain size={13} className="text-slate-400" />, text: 'Pas encore assez de données pour une analyse IA' });
    }
    return insights;
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar role="trainer" userName={userName} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Mes stagiaires" subtitle="Suivez la progression de vos apprenants" />

        <main className="flex-1 overflow-hidden flex gap-0">
          {/* Student list */}
          <div className={`flex flex-col ${selected ? 'w-80 border-r border-white/[0.06]' : 'flex-1'} p-6 overflow-y-auto`}>
            <div className="relative mb-4">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input type="text" placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/40" />
            </div>

            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => <div key={i} className="h-20 rounded-xl bg-white/[0.03] animate-pulse" />)}
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                <Users size={40} className="mb-3 opacity-20" />
                <p className="text-sm">{students.length === 0 ? 'Aucun stagiaire inscrit à vos cours' : 'Aucun résultat'}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filtered.map((s, i) => (
                  <motion.div key={s.id}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
                    onClick={() => setSelected(s.id === selected ? null : s.id)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${selected === s.id ? 'bg-indigo-500/10 border-indigo-500/30' : 'bg-white/[0.02] border-white/[0.08] hover:border-white/[0.15]'}`}>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-xs font-bold text-indigo-300">
                        {s.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{s.name}</p>
                        <p className="text-xs text-slate-500 truncate">{s.email}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-white">{s.avgProgress}%</p>
                        <p className="text-xs text-slate-500">{s.coursesCount} cours</p>
                      </div>
                    </div>
                    <div className="mt-2">
                      <ProgressBar value={s.avgProgress} size="sm" />
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Detail panel */}
          {selectedStudent && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
              className="flex-1 p-6 overflow-y-auto space-y-5">
              <div className="flex items-center gap-4 p-5 rounded-2xl bg-white/[0.03] border border-white/[0.08]">
                <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-xl font-black text-indigo-300">
                  {selectedStudent.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">{selectedStudent.name}</h2>
                  <p className="text-sm text-slate-400">{selectedStudent.email}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Inscrit le {selectedStudent.joinedAt ? new Date(selectedStudent.joinedAt).toLocaleDateString('fr-FR') : 'N/A'}
                  </p>
                </div>
                <div className="ml-auto text-right">
                  <p className="text-3xl font-black text-white">{selectedStudent.avgProgress}%</p>
                  <p className="text-xs text-slate-400">Progression moyenne</p>
                </div>
              </div>

              {/* AI insights */}
              <div className="p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/20">
                <div className="flex items-center gap-2 mb-3">
                  <Brain size={15} className="text-indigo-400" />
                  <p className="text-sm font-semibold text-white">Analyse IA</p>
                </div>
                <div className="space-y-2">
                  {aiInsights(selectedStudent).map((insight, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-slate-400">
                      <span className="mt-0.5">{insight.icon}</span>
                      {insight.text}
                    </div>
                  ))}
                </div>
              </div>

              {/* Course progress */}
              <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.08]">
                <h3 className="font-semibold text-white mb-4">Progression par cours</h3>
                {selectedStudent.enrollments.length === 0 ? (
                  <p className="text-sm text-slate-500">Aucune inscription</p>
                ) : (
                  <div className="space-y-4">
                    {selectedStudent.enrollments.map((e, i) => (
                      <div key={i}>
                        <div className="flex justify-between mb-1.5">
                          <p className="text-sm font-medium text-white">{e.courseTitle}</p>
                          <div className="flex items-center gap-2">
                            {e.completed && <CheckCircle size={13} className="text-emerald-400" />}
                            <span className="text-sm font-bold text-white">{e.progress}%</span>
                          </div>
                        </div>
                        <ProgressBar value={e.progress} size="sm" color={e.completed ? 'emerald' : 'gradient'} />
                        {e.lastAccessedAt && (
                          <p className="text-xs text-slate-500 mt-1">
                            Dernière activité: {new Date(e.lastAccessedAt).toLocaleDateString('fr-FR')}
                            {e.completed && ' · ✓ Complété'}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </main>
      </div>
    </div>
  );
}
