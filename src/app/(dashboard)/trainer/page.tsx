'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  BookOpen,
  Users,
  Star,
  TrendingUp,
  PlusCircle,
  ChevronRight,
  Eye,
  Clock,
  BarChart3,
  Brain,
  Sparkles,
} from 'lucide-react';
import Sidebar from '@/components/dashboard/Sidebar';
import { useAuthStore } from '@/store/auth.store';
import Header from '@/components/dashboard/Header';
import StatsCard from '@/components/dashboard/StatsCard';
import { mockCourses, chartData } from '@/lib/mock-data';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const trainerCourses = mockCourses.filter(c => c.trainerId === 'trainer-1');

const aiSuggestions = [
  {
    icon: <Brain size={16} className="text-indigo-400" />,
    title: 'Difficultés détectées',
    desc: '23% des étudiants bloquent sur le module "Réseaux de neurones". Créer un exercice supplémentaire ?',
    action: 'Générer exercice',
    color: 'bg-indigo-500/10 border-indigo-500/20',
  },
  {
    icon: <Sparkles size={16} className="text-amber-400" />,
    title: 'Optimisation suggérée',
    desc: 'La leçon 12 "CNNs" a un taux d\'abandon de 40%. Reformuler l\'introduction pourrait améliorer l\'engagement.',
    action: 'Améliorer la leçon',
    color: 'bg-amber-500/10 border-amber-500/20',
  },
  {
    icon: <TrendingUp size={16} className="text-emerald-400" />,
    title: 'Cours populaire',
    desc: 'Votre cours d\'IA est le plus recherché cette semaine. Créer une suite avancée augmenterait vos revenus de ~30%.',
    action: 'Planifier un cours',
    color: 'bg-emerald-500/10 border-emerald-500/20',
  },
];

export default function TrainerDashboard() {
  const authUser = useAuthStore(s => s.user);
  const userName = authUser?.name ?? 'Formateur';
  const totalStudents = trainerCourses.reduce((acc, c) => acc + c.studentsCount, 0);
  const avgRating = (trainerCourses.reduce((acc, c) => acc + c.rating, 0) / trainerCourses.length).toFixed(1);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar role="trainer" userName={userName} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          title="Espace Formateur"
          subtitle={`Bonjour ${userName.split(' ')[0]} ! Voici votre tableau de bord`}
        />

        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard title="Mes cours" value={trainerCourses.length} icon={<BookOpen size={20} />} color="indigo" change={33} changeLabel=" ce mois" delay={0} />
            <StatsCard title="Étudiants inscrits" value={totalStudents} icon={<Users size={20} />} color="cyan" change={12} changeLabel=" ce mois" delay={0.1} />
            <StatsCard title="Note moyenne" value={`${avgRating}/5`} icon={<Star size={20} />} color="amber" delay={0.2} subtitle={`${trainerCourses.reduce((a,c)=>a+c.ratingsCount,0)} avis`} />
            <StatsCard title="Heures de contenu" value="86h" icon={<Clock size={20} />} color="purple" change={8} changeLabel=" ce mois" delay={0.3} />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Enrollment chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="xl:col-span-2 p-5 rounded-2xl bg-white/[0.03] border border-white/[0.08]"
            >
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="font-semibold text-white">Nouvelles inscriptions</h3>
                  <p className="text-xs text-slate-500">12 derniers mois</p>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                  +42% cette année
                </span>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={chartData.monthlyEnrollments}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: '#0d0d1a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', color: '#fff' }}
                  />
                  <Line type="monotone" dataKey="étudiants" stroke="#6366f1" strokeWidth={2.5} dot={false} activeDot={{ r: 5, fill: '#818cf8' }} />
                </LineChart>
              </ResponsiveContainer>
            </motion.div>

            {/* Category distribution */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.08]"
            >
              <h3 className="font-semibold text-white mb-1">Répartition</h3>
              <p className="text-xs text-slate-500 mb-4">Par catégorie</p>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie
                    data={chartData.categoryDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {chartData.categoryDistribution.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2">
                {chartData.categoryDistribution.slice(0, 3).map((item, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: item.color }} />
                      <span className="text-xs text-slate-400 truncate">{item.name.split(' ').slice(-1)[0]}</span>
                    </div>
                    <span className="text-xs font-semibold text-white">{item.value}%</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* AI insights */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.08]"
          >
            <div className="flex items-center gap-2 mb-5">
              <Brain size={18} className="text-indigo-400" />
              <h3 className="font-semibold text-white">Insights IA — Recommandations pédagogiques</h3>
              <span className="ml-auto text-xs px-2 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                Mis à jour il y a 2h
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {aiSuggestions.map((s, i) => (
                <div key={i} className={`p-4 rounded-xl border ${s.color}`}>
                  <div className="flex items-center gap-2 mb-2">
                    {s.icon}
                    <p className="text-sm font-semibold text-white">{s.title}</p>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed mb-3">{s.desc}</p>
                  <button className="text-xs font-medium text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors">
                    {s.action} <ChevronRight size={11} />
                  </button>
                </div>
              ))}
            </div>
          </motion.div>

          {/* My courses */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.08]"
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-white">Mes cours</h3>
              <div className="flex gap-2">
                <Link href="/trainer/courses">
                  <button className="text-xs text-slate-400 hover:text-white flex items-center gap-1 px-3 py-1.5 rounded-lg border border-white/[0.08] hover:border-white/20 transition-all">
                    <Eye size={12} /> Voir tout
                  </button>
                </Link>
                <Link href="/trainer/courses/create">
                  <button className="text-xs text-white flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 transition-colors">
                    <PlusCircle size={12} /> Nouveau cours
                  </button>
                </Link>
              </div>
            </div>

            <div className="space-y-3">
              {trainerCourses.map(course => (
                <div key={course.id} className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.12] transition-all group cursor-pointer">
                  <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white text-sm truncate">{course.title}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                      <span className="flex items-center gap-1"><Users size={11} />{course.studentsCount.toLocaleString('fr-FR')}</span>
                      <span className="flex items-center gap-1"><Star size={11} className="text-amber-400 fill-amber-400" />{course.rating}</span>
                      <span className="flex items-center gap-1"><BarChart3 size={11} />{course.lessonsCount} leçons</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${course.isPublished ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
                      {course.isPublished ? 'Publié' : 'Brouillon'}
                    </span>
                    <ChevronRight size={16} className="text-slate-600 group-hover:text-slate-400 transition-colors" />
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
