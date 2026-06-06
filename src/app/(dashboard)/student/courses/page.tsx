'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Star, Clock, BookOpen, Play, Check, Award } from 'lucide-react';
import Sidebar from '@/components/dashboard/Sidebar';
import Header from '@/components/dashboard/Header';
import ProgressBar from '@/components/ui/ProgressBar';
import { getLevelColor } from '@/lib/utils';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';

const categories = ['Tous', 'Intelligence Artificielle', 'Développement Web', 'Data Science', 'DevOps', 'Cybersécurité', 'Mobile'];

interface Course {
  id: string; title: string; description: string; thumbnail: string;
  category: string; level: string; durationHours: number;
  studentsCount: number; rating: number; price: number; published: boolean;
}
interface Enrollment {
  id: string; course: { id: string }; progress: number; completed: boolean;
}

export default function StudentCoursesPage() {
  const user = useAuthStore(s => s.user);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('Tous');
  const [tab, setTab] = useState<'enrolled' | 'explore'>('enrolled');
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get<{ content: Course[]; totalElements: number }>('/courses?size=100'),
      api.get<Enrollment[]>('/enrollments/me'),
    ]).then(([coursesPage, enrs]) => {
      setAllCourses(coursesPage.content ?? []);
      setEnrollments(enrs ?? []);
    }).finally(() => setLoading(false));
  }, []);

  const enrollmentMap = Object.fromEntries(enrollments.map(e => [e.course.id, e]));
  const enrolledIds = Object.keys(enrollmentMap);
  const enrolledCourses = allCourses.filter(c => enrolledIds.includes(c.id));
  const exploreCourses = allCourses.filter(c => !enrolledIds.includes(c.id));

  const displayCourses = (tab === 'enrolled' ? enrolledCourses : exploreCourses).filter(c => {
    const matchSearch = c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.description.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === 'Tous' || c.category === category;
    return matchSearch && matchCat;
  });

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar role="student" userName={user?.name ?? 'Stagiaire'} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Mes cours" subtitle="Gérez et explorez votre catalogue de formation" />

        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Tabs */}
          <div className="flex gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/[0.08] w-fit">
            {[
              { key: 'enrolled', label: loading ? 'Mes cours' : `Mes cours (${enrolledCourses.length})` },
              { key: 'explore', label: loading ? 'Explorer' : `Explorer (${exploreCourses.length})` },
            ].map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key as 'enrolled' | 'explore')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  tab === t.key
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Rechercher un cours..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/40 transition-all"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                    category === cat
                      ? 'bg-indigo-500/15 border-indigo-500/40 text-indigo-300'
                      : 'bg-white/[0.02] border-white/[0.08] text-slate-400 hover:text-white hover:border-white/20'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Course grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {displayCourses.map((course, i) => {
              const enrollment = enrollmentMap[course.id];
              return (
                <motion.div
                  key={course.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="group rounded-2xl bg-white/[0.03] border border-white/[0.08] overflow-hidden hover:border-white/[0.15] hover:shadow-xl hover:shadow-black/30 transition-all duration-300 cursor-pointer"
                >
                  {/* Thumbnail */}
                  <div className="relative h-40 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={course.thumbnail}
                      alt={course.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#04040a] via-transparent to-transparent" />
                    <div className="absolute top-3 left-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium border backdrop-blur-sm ${getLevelColor(course.level)}`}>
                        {course.level}
                      </span>
                    </div>
                    {enrollment?.completed && (
                      <div className="absolute top-3 right-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg">
                          <Check size={14} className="text-white" strokeWidth={3} />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <p className="text-xs text-indigo-400 font-medium mb-2">{course.category}</p>
                    <h3 className="font-bold text-white text-sm leading-snug mb-3 line-clamp-2">
                      {course.title}
                    </h3>

                    <div className="flex items-center gap-3 text-xs text-slate-500 mb-3">
                      <span className="flex items-center gap-1"><Clock size={11} />{course.durationHours}h</span>
                      <span className="flex items-center gap-1 ml-auto">
                        <Star size={11} className="text-amber-400 fill-amber-400" />
                        <span className="text-amber-400">{course.rating.toFixed(1)}</span>
                      </span>
                    </div>

                    {enrollment ? (
                      <div>
                        <ProgressBar value={enrollment.progress} size="sm" />
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-slate-500">{enrollment.progress}% complété</span>
                          {enrollment.completed ? (
                            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
                              <Award size={11} /> Certificat
                            </button>
                          ) : (
                            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-medium hover:bg-indigo-500 transition-colors">
                              <Play size={11} /> Continuer
                            </button>
                          )}
                        </div>
                      </div>
                    ) : (
                      <button className="w-full py-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-medium hover:bg-indigo-500/20 transition-colors">
                        S&apos;inscrire — {course.price === 0 ? 'Gratuit' : `${course.price} TND`}
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>

          {displayCourses.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-slate-500">
              <BookOpen size={40} className="mb-4 opacity-30" />
              <p className="font-medium">Aucun cours trouvé</p>
              <p className="text-sm mt-1">Essayez d&apos;autres critères de recherche</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
