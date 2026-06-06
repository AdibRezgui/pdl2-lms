'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Search, PlusCircle, Star, Users, BookOpen, Edit3, Trash2, Eye } from 'lucide-react';
import Sidebar from '@/components/dashboard/Sidebar';
import Header from '@/components/dashboard/Header';
import Button from '@/components/ui/Button';
import { getLevelColor } from '@/lib/utils';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import toast from 'react-hot-toast';

interface Course {
  id: string; title: string; thumbnail: string; level: string;
  durationHours: number; studentsCount: number; rating: number; published: boolean;
}

export default function TrainerCoursesPage() {
  const user = useAuthStore(s => s.user);
  const [courses, setCourses] = useState<Course[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get<Course[]>('/courses/my').then(setCourses).catch(() => null);
  }, []);

  const filtered = courses.filter(c =>
    c.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar role="trainer" userName={user?.name ?? 'Formateur'} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Mes cours" subtitle="Gérez et améliorez vos formations" />

        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Toolbar */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Rechercher..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/40"
              />
            </div>
            <Link href="/trainer/courses/create">
              <Button gradient icon={<PlusCircle size={16} />}>Nouveau cours</Button>
            </Link>
          </div>

          {/* Course table */}
          <div className="rounded-2xl bg-white/[0.03] border border-white/[0.08] overflow-hidden">
            <div className="grid grid-cols-12 gap-4 px-5 py-3 border-b border-white/[0.06] text-xs font-medium text-slate-500 uppercase tracking-wider">
              <div className="col-span-5">Cours</div>
              <div className="col-span-2 text-center">Étudiants</div>
              <div className="col-span-1 text-center">Note</div>
              <div className="col-span-2 text-center">Statut</div>
              <div className="col-span-2 text-right">Actions</div>
            </div>

            <div className="divide-y divide-white/[0.04]">
              {filtered.map((course, i) => (
                <motion.div
                  key={course.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className="grid grid-cols-12 gap-4 px-5 py-4 items-center hover:bg-white/[0.02] transition-colors"
                >
                  {/* Course info */}
                  <div className="col-span-5 flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{course.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${getLevelColor(course.level)}`}>
                          {course.level}
                        </span>
                        <span className="text-xs text-slate-500">{course.durationHours}h</span>
                      </div>
                    </div>
                  </div>

                  {/* Students */}
                  <div className="col-span-2 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <Users size={13} className="text-cyan-400" />
                      <span className="text-sm font-semibold text-white">{course.studentsCount.toLocaleString('fr-FR')}</span>
                    </div>
                  </div>

                  {/* Rating */}
                  <div className="col-span-1 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Star size={13} className="text-amber-400 fill-amber-400" />
                      <span className="text-sm font-semibold text-amber-400">{course.rating}</span>
                    </div>
                  </div>

                  {/* Status */}
                  <div className="col-span-2 text-center">
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium border ${
                      course.published
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    }`}>
                      {course.published ? '● Publié' : '○ Brouillon'}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="col-span-2 flex items-center justify-end gap-2">
                    <button
                      className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all"
                      title="Voir"
                    >
                      <Eye size={14} />
                    </button>
                    <button
                      className="p-2 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 transition-all"
                      title="Modifier"
                    >
                      <Edit3 size={14} />
                    </button>
                    <button
                      className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                      title="Supprimer"
                      onClick={() => toast.error('Fonctionnalité en développement')}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-16 text-slate-500">
              <BookOpen size={36} className="mx-auto mb-3 opacity-30" />
              <p>Aucun cours trouvé</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
