'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Star, Users, BookOpen, Eye, Edit3, Trash2, CheckCircle, XCircle } from 'lucide-react';
import Sidebar from '@/components/dashboard/Sidebar';
import { useAuthStore } from '@/store/auth.store';
import Header from '@/components/dashboard/Header';
import { mockCourses } from '@/lib/mock-data';
import { getLevelColor, formatDuration } from '@/lib/utils';
import toast from 'react-hot-toast';


export default function AdminCoursesPage() {
  const authUser = useAuthStore(s => s.user);
  const userName = authUser?.name ?? 'Administrateur';
  const [search, setSearch] = useState('');
  const [courses, setCourses] = useState(mockCourses);

  const filtered = courses.filter(c =>
    c.title.toLowerCase().includes(search.toLowerCase()) ||
    c.category.toLowerCase().includes(search.toLowerCase()) ||
    c.trainerName.toLowerCase().includes(search.toLowerCase())
  );

  const togglePublish = (id: string) => {
    setCourses(prev => prev.map(c => c.id === id ? { ...c, isPublished: !c.isPublished } : c));
    toast.success('Statut du cours mis à jour');
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar role="admin" userName={userName} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Gestion des cours" subtitle={`${courses.length} cours sur la plateforme`} />

        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Toolbar */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Rechercher par titre, catégorie, formateur..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/40"
              />
            </div>
          </div>

          {/* Table */}
          <div className="rounded-2xl bg-white/[0.03] border border-white/[0.08] overflow-hidden">
            <div className="grid grid-cols-12 gap-4 px-5 py-3 border-b border-white/[0.06] text-xs font-medium text-slate-500 uppercase tracking-wider">
              <div className="col-span-4">Cours</div>
              <div className="col-span-2">Formateur</div>
              <div className="col-span-1 text-center">Étudiants</div>
              <div className="col-span-1 text-center">Note</div>
              <div className="col-span-1 text-center">Prix</div>
              <div className="col-span-2 text-center">Statut</div>
              <div className="col-span-1">Actions</div>
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
                  {/* Course */}
                  <div className="col-span-4 flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{course.title}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className={`text-xs px-1.5 py-0.5 rounded-full border ${getLevelColor(course.level)}`}>
                          {course.level}
                        </span>
                        <span className="text-xs text-slate-600">{course.category}</span>
                      </div>
                    </div>
                  </div>

                  {/* Trainer */}
                  <div className="col-span-2">
                    <p className="text-sm text-slate-300 truncate">{course.trainerName}</p>
                  </div>

                  {/* Students */}
                  <div className="col-span-1 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Users size={12} className="text-cyan-400" />
                      <span className="text-sm text-white font-medium">{course.studentsCount.toLocaleString('fr-FR')}</span>
                    </div>
                  </div>

                  {/* Rating */}
                  <div className="col-span-1 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Star size={12} className="text-amber-400 fill-amber-400" />
                      <span className="text-sm text-amber-400 font-medium">{course.rating}</span>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="col-span-1 text-center">
                    <span className={`text-sm font-semibold ${course.price === 0 ? 'text-emerald-400' : 'text-white'}`}>
                      {course.price === 0 ? 'Gratuit' : `${course.price}`}
                    </span>
                  </div>

                  {/* Status */}
                  <div className="col-span-2 text-center">
                    <button
                      onClick={() => togglePublish(course.id)}
                      className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border transition-all ${
                        course.isPublished
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20'
                      }`}
                    >
                      {course.isPublished ? <CheckCircle size={11} /> : <XCircle size={11} />}
                      {course.isPublished ? 'Publié' : 'Brouillon'}
                    </button>
                  </div>

                  {/* Actions */}
                  <div className="col-span-1 flex items-center gap-1">
                    <button className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-all">
                      <Eye size={13} />
                    </button>
                    <button
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                      onClick={() => toast.error('Suppression désactivée en démo')}
                    >
                      <Trash2 size={13} />
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
