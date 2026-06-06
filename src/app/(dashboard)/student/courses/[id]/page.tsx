'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play, CheckCircle, Lock, ChevronDown, ChevronRight,
  Clock, BookOpen, Award, MessageSquare, Star,
  FileText, Video, HelpCircle, Download, Share2,
  ArrowLeft, Volume2, Maximize2, SkipForward,
} from 'lucide-react';
import Link from 'next/link';
import Sidebar from '@/components/dashboard/Sidebar';
import Button from '@/components/ui/Button';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/auth.store';

const course = {
  id: 'course-1',
  title: 'Intelligence Artificielle & Machine Learning avec Python',
  trainer: 'Dr. Amira Ben Salah',
  trainerAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=trainer1',
  rating: 4.9,
  studentsCount: 1248,
  progress: 34,
  thumbnail: 'https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=1200&q=80',
};

const modules = [
  {
    id: 'm1',
    title: 'Introduction & Fondamentaux',
    lessons: [
      { id: 'l1', title: 'Bienvenue dans le cours', type: 'video', duration: '5:20', completed: true, free: true },
      { id: 'l2', title: 'Qu\'est-ce que l\'Intelligence Artificielle ?', type: 'video', duration: '12:45', completed: true, free: true },
      { id: 'l3', title: 'Historique et évolution du ML', type: 'video', duration: '9:30', completed: true, free: false },
      { id: 'l4', title: 'Ressources et outils du cours', type: 'pdf', duration: '3 min', completed: false, free: false },
    ],
  },
  {
    id: 'm2',
    title: 'Python pour le Machine Learning',
    lessons: [
      { id: 'l5', title: 'Environnement Python & Jupyter', type: 'video', duration: '15:00', completed: false, free: false },
      { id: 'l6', title: 'NumPy — manipulation de tableaux', type: 'video', duration: '22:10', completed: false, free: false },
      { id: 'l7', title: 'Pandas — analyse de données', type: 'video', duration: '28:45', completed: false, free: false },
      { id: 'l8', title: 'Quiz — Python ML', type: 'quiz', duration: '15 min', completed: false, free: false },
    ],
  },
  {
    id: 'm3',
    title: 'Algorithmes de Machine Learning',
    lessons: [
      { id: 'l9', title: 'Régression linéaire et logistique', type: 'video', duration: '31:20', completed: false, free: false },
      { id: 'l10', title: 'Arbres de décision & Random Forest', type: 'video', duration: '25:00', completed: false, free: false },
      { id: 'l11', title: 'SVM — Support Vector Machines', type: 'video', duration: '18:30', completed: false, free: false },
      { id: 'l12', title: 'Projet pratique — Classification', type: 'pdf', duration: '10 min', completed: false, free: false },
      { id: 'l13', title: 'Quiz — Algorithmes ML', type: 'quiz', duration: '20 min', completed: false, free: false },
    ],
  },
  {
    id: 'm4',
    title: 'Deep Learning & Réseaux de Neurones',
    lessons: [
      { id: 'l14', title: 'Introduction aux réseaux de neurones', type: 'video', duration: '20:15', completed: false, free: false },
      { id: 'l15', title: 'TensorFlow & Keras', type: 'video', duration: '35:00', completed: false, free: false },
      { id: 'l16', title: 'CNN pour la vision par ordinateur', type: 'video', duration: '42:30', completed: false, free: false },
    ],
  },
];

const reviews = [
  { id: 1, name: 'Fatma Gharbi', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=student2', rating: 5, date: 'Il y a 2 semaines', text: 'Cours exceptionnel ! Les explications sont claires et les exercices pratiques sont très bien conçus. J\'ai enfin compris les réseaux de neurones.' },
  { id: 2, name: 'Karim Zouari', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=karim', rating: 5, date: 'Il y a 1 mois', text: 'La formatrice explique très bien les concepts complexes. Les notebooks Jupyter fournis sont un vrai plus. Je recommande vivement !' },
  { id: 3, name: 'Sonia Hamdi', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sonia', rating: 4, date: 'Il y a 2 mois', text: 'Très bon cours, bien structuré. Quelques vidéos pourraient être raccourcies, mais le contenu est de grande qualité.' },
];

const typeIcon = {
  video: <Video size={13} />,
  pdf: <FileText size={13} />,
  quiz: <HelpCircle size={13} />,
};

const typeColor = {
  video: 'text-indigo-400',
  pdf: 'text-amber-400',
  quiz: 'text-purple-400',
};

export default function CoursePlayerPage() {
  const authUser = useAuthStore(s => s.user);
  const userName = authUser?.name ?? 'Stagiaire';
  const [activeLesson, setActiveLesson] = useState(modules[0].lessons[1]);
  const [expandedModules, setExpandedModules] = useState<string[]>(['m1', 'm2']);
  const [activeTab, setActiveTab] = useState<'overview' | 'reviews' | 'notes'>('overview');
  const [completedLessons, setCompletedLessons] = useState<string[]>(['l1', 'l2', 'l3']);
  const [isPlaying, setIsPlaying] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [noteText, setNoteText] = useState('');

  const totalLessons = modules.flatMap(m => m.lessons).length;
  const progressPct = Math.round((completedLessons.length / totalLessons) * 100);

  const toggleModule = (id: string) => {
    setExpandedModules(prev =>
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    );
  };

  const markComplete = () => {
    if (!completedLessons.includes(activeLesson.id)) {
      setCompletedLessons(prev => [...prev, activeLesson.id]);
      toast.success('Leçon marquée comme terminée !');

      const allLessons = modules.flatMap(m => m.lessons);
      const currentIdx = allLessons.findIndex(l => l.id === activeLesson.id);
      if (currentIdx < allLessons.length - 1) {
        setTimeout(() => setActiveLesson(allLessons[currentIdx + 1]), 600);
      }
    }
  };

  const saveNote = () => {
    if (noteText.trim()) {
      toast.success('Note sauvegardée');
      setNoteText('');
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar role="student" userName={userName} />

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06] bg-[#04040a] flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <Link href="/student/courses">
              <motion.button
                whileHover={{ x: -2 }}
                className="p-1.5 rounded-lg hover:bg-white/[0.05] text-slate-400 hover:text-white transition-colors flex-shrink-0"
              >
                <ArrowLeft size={18} />
              </motion.button>
            </Link>
            <div className="min-w-0">
              <p className="text-white font-semibold text-sm truncate">{course.title}</p>
              <p className="text-xs text-slate-500 truncate">{activeLesson.title}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="hidden sm:flex items-center gap-2">
              <div className="w-28 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPct}%` }}
                  transition={{ duration: 0.8 }}
                />
              </div>
              <span className="text-xs text-slate-400">{progressPct}%</span>
            </div>
            <button
              onClick={() => { toast.success('Lien copié !'); }}
              className="p-1.5 rounded-lg hover:bg-white/[0.05] text-slate-400 hover:text-white transition-colors"
            >
              <Share2 size={15} />
            </button>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Video + tabs area */}
          <div className="flex-1 flex flex-col overflow-hidden min-w-0">
            {/* Video player */}
            <div className="relative bg-black flex-shrink-0" style={{ aspectRatio: '16/9', maxHeight: '55vh' }}>
              <img
                src={course.thumbnail}
                alt={course.title}
                className="w-full h-full object-cover opacity-70"
              />

              {/* Play overlay */}
              <div className="absolute inset-0 flex items-center justify-center">
                <motion.button
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center hover:bg-white/30 transition-colors"
                >
                  {isPlaying
                    ? <div className="flex gap-1.5"><div className="w-1.5 h-6 bg-white rounded-sm" /><div className="w-1.5 h-6 bg-white rounded-sm" /></div>
                    : <Play size={24} className="text-white ml-1" fill="white" />
                  }
                </motion.button>
              </div>

              {/* Progress bar */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
                <motion.div
                  className="h-full bg-indigo-500"
                  animate={{ width: isPlaying ? '45%' : '30%' }}
                  transition={{ duration: isPlaying ? 60 : 0.3 }}
                />
              </div>

              {/* Controls bar */}
              <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between">
                <span className="text-white/80 text-xs font-mono">3:41 / {activeLesson.duration}</span>
                <div className="flex items-center gap-3">
                  <button className="text-white/70 hover:text-white transition-colors">
                    <Volume2 size={15} />
                  </button>
                  <button className="text-white/70 hover:text-white transition-colors">
                    <SkipForward size={15} />
                  </button>
                  <button className="text-white/70 hover:text-white transition-colors">
                    <Maximize2 size={15} />
                  </button>
                </div>
              </div>

              {/* Lesson type badge */}
              {activeLesson.type !== 'video' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#04040a]">
                  <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mb-4 ${
                    activeLesson.type === 'pdf' ? 'bg-amber-500/20' : 'bg-purple-500/20'
                  }`}>
                    {activeLesson.type === 'pdf'
                      ? <FileText size={40} className="text-amber-400" />
                      : <HelpCircle size={40} className="text-purple-400" />
                    }
                  </div>
                  <p className="text-white font-semibold">{activeLesson.title}</p>
                  <p className="text-slate-400 text-sm mt-1">
                    {activeLesson.type === 'pdf' ? 'Document PDF' : 'Quiz interactif'}
                  </p>
                  <Link href={activeLesson.type === 'quiz' ? '/student/evaluations' : '#'}>
                    <Button variant="primary" size="sm" className="mt-4">
                      {activeLesson.type === 'pdf' ? (
                        <><Download size={14} /> Télécharger le PDF</>
                      ) : (
                        <><Play size={14} /> Commencer le quiz</>
                      )}
                    </Button>
                  </Link>
                </div>
              )}
            </div>

            {/* Tabs */}
            <div className="flex-1 overflow-y-auto">
              <div className="border-b border-white/[0.06] px-4">
                <div className="flex gap-6">
                  {(['overview', 'reviews', 'notes'] as const).map(tab => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`py-3 text-sm font-medium border-b-2 transition-colors capitalize ${
                        activeTab === tab
                          ? 'border-indigo-500 text-white'
                          : 'border-transparent text-slate-400 hover:text-white'
                      }`}
                    >
                      {tab === 'overview' ? 'Aperçu' : tab === 'reviews' ? 'Avis' : 'Notes'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-4">
                <AnimatePresence mode="wait">
                  {activeTab === 'overview' && (
                    <motion.div
                      key="overview"
                      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className="space-y-4"
                    >
                      {/* Lesson info */}
                      <div>
                        <h2 className="text-white font-semibold text-lg">{activeLesson.title}</h2>
                        <div className="flex items-center gap-4 mt-2 text-sm text-slate-400">
                          <span className="flex items-center gap-1.5">
                            <Clock size={13} /> {activeLesson.duration}
                          </span>
                          <span className={`flex items-center gap-1.5 ${typeColor[activeLesson.type as keyof typeof typeColor]}`}>
                            {typeIcon[activeLesson.type as keyof typeof typeIcon]}
                            {activeLesson.type === 'video' ? 'Vidéo' : activeLesson.type === 'pdf' ? 'PDF' : 'Quiz'}
                          </span>
                        </div>
                      </div>

                      {/* Trainer card */}
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                        <img src={course.trainerAvatar} alt={course.trainer} className="w-10 h-10 rounded-full" />
                        <div>
                          <p className="text-white text-sm font-medium">{course.trainer}</p>
                          <p className="text-slate-500 text-xs">Formatrice & Expert IA</p>
                        </div>
                        <div className="ml-auto flex items-center gap-1 text-amber-400">
                          <Star size={12} fill="currentColor" />
                          <span className="text-sm font-medium">{course.rating}</span>
                        </div>
                      </div>

                      {/* Course stats */}
                      <div className="grid grid-cols-3 gap-3">
                        {[
                          { icon: <BookOpen size={14} />, label: 'Leçons', value: totalLessons },
                          { icon: <CheckCircle size={14} />, label: 'Complétées', value: completedLessons.length },
                          { icon: <Award size={14} />, label: 'Progression', value: `${progressPct}%` },
                        ].map(stat => (
                          <div key={stat.label} className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-center">
                            <div className="flex justify-center text-indigo-400 mb-1">{stat.icon}</div>
                            <p className="text-white font-bold text-sm">{stat.value}</p>
                            <p className="text-slate-500 text-xs">{stat.label}</p>
                          </div>
                        ))}
                      </div>

                      <Button
                        variant={completedLessons.includes(activeLesson.id) ? 'outline' : 'primary'}
                        className="w-full"
                        onClick={markComplete}
                        disabled={completedLessons.includes(activeLesson.id)}
                      >
                        {completedLessons.includes(activeLesson.id) ? (
                          <><CheckCircle size={15} /> Leçon terminée</>
                        ) : (
                          <><CheckCircle size={15} /> Marquer comme terminée</>
                        )}
                      </Button>
                    </motion.div>
                  )}

                  {activeTab === 'reviews' && (
                    <motion.div
                      key="reviews"
                      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className="space-y-4"
                    >
                      {/* Rating summary */}
                      <div className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                        <div className="text-center">
                          <p className="text-4xl font-bold text-white">{course.rating}</p>
                          <div className="flex gap-0.5 my-1">
                            {[1,2,3,4,5].map(s => (
                              <Star key={s} size={12} className="text-amber-400" fill="currentColor" />
                            ))}
                          </div>
                          <p className="text-xs text-slate-500">{course.studentsCount} avis</p>
                        </div>
                        <div className="flex-1 space-y-1.5">
                          {[5,4,3,2,1].map(s => (
                            <div key={s} className="flex items-center gap-2">
                              <span className="text-xs text-slate-400 w-3">{s}</span>
                              <div className="flex-1 h-1.5 rounded-full bg-white/[0.06]">
                                <div
                                  className="h-full rounded-full bg-amber-400"
                                  style={{ width: s === 5 ? '72%' : s === 4 ? '20%' : s === 3 ? '6%' : '1%' }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* My rating */}
                      <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                        <p className="text-sm text-slate-400 mb-2">Votre note</p>
                        <div className="flex gap-1.5">
                          {[1,2,3,4,5].map(s => (
                            <motion.button
                              key={s}
                              whileHover={{ scale: 1.15 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => { setUserRating(s); toast.success('Note enregistrée !'); }}
                            >
                              <Star
                                size={22}
                                className={s <= userRating ? 'text-amber-400' : 'text-white/[0.12]'}
                                fill={s <= userRating ? 'currentColor' : 'none'}
                              />
                            </motion.button>
                          ))}
                        </div>
                      </div>

                      {reviews.map(r => (
                        <motion.div
                          key={r.id}
                          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                          className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]"
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <img src={r.avatar} alt={r.name} className="w-8 h-8 rounded-full" />
                            <div>
                              <p className="text-white text-sm font-medium">{r.name}</p>
                              <p className="text-slate-500 text-xs">{r.date}</p>
                            </div>
                            <div className="ml-auto flex gap-0.5">
                              {[1,2,3,4,5].map(s => (
                                <Star key={s} size={11} className={s <= r.rating ? 'text-amber-400' : 'text-white/10'} fill="currentColor" />
                              ))}
                            </div>
                          </div>
                          <p className="text-slate-300 text-sm leading-relaxed">{r.text}</p>
                        </motion.div>
                      ))}
                    </motion.div>
                  )}

                  {activeTab === 'notes' && (
                    <motion.div
                      key="notes"
                      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className="space-y-3"
                    >
                      <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center gap-2 text-sm text-slate-400">
                        <MessageSquare size={14} />
                        Note à <span className="text-indigo-400 font-mono">3:41</span> — {activeLesson.title}
                      </div>
                      <textarea
                        value={noteText}
                        onChange={e => setNoteText(e.target.value)}
                        placeholder="Prendre une note sur cette leçon..."
                        rows={4}
                        className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-white placeholder-slate-600 resize-none focus:outline-none focus:border-indigo-500/50 transition-colors"
                      />
                      <Button variant="primary" size="sm" onClick={saveNote}>
                        Sauvegarder la note
                      </Button>
                      <div className="mt-4 space-y-2">
                        {[
                          { time: '1:20', text: 'Concept important : les tenseurs sont des tableaux multidimensionnels généralisés.' },
                          { time: '0:45', text: 'Revoir la formule de back-propagation plus tard.' },
                        ].map((n, i) => (
                          <div key={i} className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                            <span className="text-indigo-400 text-xs font-mono">{n.time}</span>
                            <p className="text-slate-300 text-sm mt-1">{n.text}</p>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Curriculum sidebar */}
          <div className="w-72 border-l border-white/[0.06] flex flex-col overflow-hidden flex-shrink-0 hidden lg:flex">
            <div className="p-4 border-b border-white/[0.06]">
              <h3 className="text-white font-semibold text-sm">Contenu du cours</h3>
              <p className="text-xs text-slate-500 mt-0.5">{totalLessons} leçons · {completedLessons.length} terminées</p>
              <div className="mt-2 h-1 rounded-full bg-white/[0.06] overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                  animate={{ width: `${progressPct}%` }}
                  transition={{ duration: 0.8 }}
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {modules.map((mod, mi) => {
                const isExpanded = expandedModules.includes(mod.id);
                const modCompleted = mod.lessons.filter(l => completedLessons.includes(l.id)).length;
                return (
                  <div key={mod.id} className="border-b border-white/[0.04]">
                    <button
                      onClick={() => toggleModule(mod.id)}
                      className="w-full flex items-start gap-2 p-3 hover:bg-white/[0.02] transition-colors text-left"
                    >
                      <motion.div
                        animate={{ rotate: isExpanded ? 90 : 0 }}
                        transition={{ duration: 0.2 }}
                        className="mt-0.5 text-slate-500 flex-shrink-0"
                      >
                        <ChevronRight size={14} />
                      </motion.div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white/90 leading-tight">{mod.title}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{modCompleted}/{mod.lessons.length} leçons</p>
                      </div>
                    </button>

                    <AnimatePresence initial={false}>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25 }}
                          className="overflow-hidden"
                        >
                          {mod.lessons.map(lesson => {
                            const isDone = completedLessons.includes(lesson.id);
                            const isActive = activeLesson.id === lesson.id;
                            return (
                              <motion.button
                                key={lesson.id}
                                onClick={() => setActiveLesson(lesson)}
                                whileHover={{ x: 2 }}
                                className={`w-full flex items-start gap-2.5 pl-8 pr-3 py-2.5 text-left transition-colors ${
                                  isActive ? 'bg-indigo-500/10' : 'hover:bg-white/[0.02]'
                                }`}
                              >
                                <div className={`mt-0.5 flex-shrink-0 ${
                                  isDone ? 'text-emerald-400' : isActive ? 'text-indigo-400' : 'text-slate-600'
                                }`}>
                                  {isDone
                                    ? <CheckCircle size={14} />
                                    : lesson.free
                                    ? <div className={`w-3.5 h-3.5 rounded-full border-2 ${isActive ? 'border-indigo-400' : 'border-slate-600'}`} />
                                    : <Lock size={13} />
                                  }
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className={`text-xs leading-tight ${
                                    isActive ? 'text-white font-medium' : 'text-slate-400'
                                  }`}>
                                    {lesson.title}
                                  </p>
                                  <div className={`flex items-center gap-1.5 mt-0.5 ${typeColor[lesson.type as keyof typeof typeColor]}`}>
                                    <span className="opacity-70">{typeIcon[lesson.type as keyof typeof typeIcon]}</span>
                                    <span className="text-[10px] text-slate-600">{lesson.duration}</span>
                                  </div>
                                </div>
                              </motion.button>
                            );
                          })}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
