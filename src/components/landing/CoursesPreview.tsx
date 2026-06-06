'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Clock, Users, Star, BookOpen, Cpu, TrendingUp, Globe, Shield, Code2 } from 'lucide-react';

const courses = [
  {
    id: 1,
    title: 'Machine Learning avec Python et Scikit-Learn',
    trainer: 'Dr. Salma Ben Amor',
    duration: '42h',
    students: '3.2k',
    rating: 4.9,
    level: 'Intermédiaire',
    tag: 'Bestseller',
    tagColor: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
    gradient: 'from-indigo-500 to-violet-600',
    icon: <Cpu size={42} className="text-white/30" />,
    topics: ['Supervised Learning', 'Neural Networks', 'Deployment'],
  },
  {
    id: 2,
    title: 'Développement Full-Stack React & Node.js',
    trainer: 'Karim Mansouri',
    duration: '68h',
    students: '5.1k',
    rating: 4.8,
    level: 'Débutant',
    tag: 'Populaire',
    tagColor: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
    gradient: 'from-cyan-500 to-blue-600',
    icon: <Code2 size={42} className="text-white/30" />,
    topics: ['React 18', 'REST APIs', 'PostgreSQL'],
  },
  {
    id: 3,
    title: 'Data Science & Visualisation avec Power BI',
    trainer: 'Sonia Trabelsi',
    duration: '35h',
    students: '2.4k',
    rating: 4.9,
    level: 'Avancé',
    tag: 'Nouveau',
    tagColor: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
    gradient: 'from-violet-500 to-purple-600',
    icon: <TrendingUp size={42} className="text-white/30" />,
    topics: ['DAX', 'ETL', 'Dashboards'],
  },
  {
    id: 4,
    title: 'DevOps & Cloud avec Kubernetes & AWS',
    trainer: 'Yassine Chermiti',
    duration: '55h',
    students: '1.8k',
    rating: 4.7,
    level: 'Avancé',
    tag: 'Certification',
    tagColor: 'bg-violet-500/15 text-violet-400 border-violet-500/20',
    gradient: 'from-orange-500 to-red-600',
    icon: <Globe size={42} className="text-white/30" />,
    topics: ['Docker', 'Terraform', 'CI/CD'],
  },
  {
    id: 5,
    title: 'Cybersécurité et Ethical Hacking',
    trainer: 'Mehdi Bensalem',
    duration: '48h',
    students: '1.2k',
    rating: 4.8,
    level: 'Intermédiaire',
    tag: 'Bestseller',
    tagColor: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
    gradient: 'from-rose-500 to-pink-600',
    icon: <Shield size={42} className="text-white/30" />,
    topics: ['Pentesting', 'OWASP', 'CTF'],
  },
  {
    id: 6,
    title: 'Business Intelligence & Analyse Décisionnelle',
    trainer: 'Imen Ouali',
    duration: '30h',
    students: '980',
    rating: 4.6,
    level: 'Débutant',
    tag: 'Nouveau',
    tagColor: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
    gradient: 'from-emerald-500 to-teal-600',
    icon: <BookOpen size={42} className="text-white/30" />,
    topics: ['SQL avancé', 'Looker', 'KPIs'],
  },
];

const levelColor: Record<string, string> = {
  Débutant: 'text-emerald-400',
  Intermédiaire: 'text-amber-400',
  Avancé: 'text-rose-400',
};

export default function CoursesPreview() {
  return (
    <section id="courses" className="relative py-28 sm:py-36 overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] rounded-full bg-cyan-600/[0.04] blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
          className="flex flex-col sm:flex-row sm:items-end justify-between gap-5 mb-10"
        >
          <div>
            <div className="section-badge mb-5">
              <BookOpen size={13} />
              Catalogue de cours
            </div>
            <h2 className="text-4xl sm:text-5xl font-black text-white tracking-tight mb-3">
              350+ cours pour
              <br />
              <span className="gradient-text">booster votre carrière</span>
            </h2>
            <p className="text-slate-400 text-base max-w-lg">
              Créés par des experts, mis à jour pour rester en phase avec le marché.
            </p>
          </div>

          <Link href="/register">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-300 border border-white/[0.1] hover:bg-white/[0.04] hover:border-white/[0.18] hover:text-white transition-all duration-200 whitespace-nowrap"
            >
              Voir tout le catalogue
              <ArrowRight size={14} />
            </motion.button>
          </Link>
        </motion.div>

        {/* Courses grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {courses.map((course, i) => (
            <motion.div
              key={course.id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.07, ease: [0.23, 1, 0.32, 1] }}
              className="group relative flex flex-col rounded-2xl bg-white/[0.025] border border-white/[0.07] hover:border-white/[0.13] hover:bg-white/[0.04] transition-all duration-300 overflow-hidden cursor-pointer"
            >
              {/* Thumbnail */}
              <div className={`relative h-[130px] bg-gradient-to-br ${course.gradient} flex items-center justify-center overflow-hidden`}>
                <div
                  className="absolute inset-0 opacity-10"
                  style={{
                    backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
                    backgroundSize: '20px 20px',
                  }}
                />
                {course.icon}
                <div className={`absolute top-3 right-3 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${course.tagColor}`}>
                  {course.tag}
                </div>
              </div>

              {/* Content */}
              <div className="flex flex-col flex-1 p-5">
                <h3 className="text-[14px] font-bold text-white leading-snug mb-1.5 group-hover:text-indigo-100 transition-colors">
                  {course.title}
                </h3>
                <p className="text-[12px] text-slate-500 mb-3">{course.trainer}</p>

                {/* Topic chips */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {course.topics.map((t) => (
                    <span
                      key={t}
                      className="px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/[0.06] text-[10px] text-slate-400"
                    >
                      {t}
                    </span>
                  ))}
                </div>

                <div className="mt-auto flex items-center justify-between text-[12px] text-slate-500 pt-3 border-t border-white/[0.05]">
                  <div className="flex items-center gap-1">
                    <Star size={11} className="text-amber-400 fill-amber-400" />
                    <span className="text-amber-300 font-semibold">{course.rating}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock size={11} />
                    {course.duration}
                  </div>
                  <div className="flex items-center gap-1">
                    <Users size={11} />
                    {course.students}
                  </div>
                  <span className={`font-semibold ${levelColor[course.level]}`}>{course.level}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="mt-12 text-center"
        >
          <Link href="/register">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="inline-flex items-center gap-2.5 px-6 py-3 rounded-xl text-sm font-semibold bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:from-indigo-500 hover:to-violet-500 shadow-xl shadow-indigo-600/20 transition-all"
            >
              Explorer les 350+ cours
              <ArrowRight size={14} />
            </motion.button>
          </Link>
          <p className="text-[12px] text-slate-600 mt-3">Nouveaux cours ajoutés chaque semaine</p>
        </motion.div>
      </div>
    </section>
  );
}
