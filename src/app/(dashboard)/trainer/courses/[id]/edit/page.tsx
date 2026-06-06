'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Save, Eye, ArrowLeft, Plus, Trash2, GripVertical,
  Video, FileText, HelpCircle, Upload, Globe, Lock,
  Sparkles, ChevronDown, AlertCircle, CheckCircle,
  BookOpen, Clock, Tag, DollarSign,
} from 'lucide-react';
import Link from 'next/link';
import Sidebar from '@/components/dashboard/Sidebar';
import Button from '@/components/ui/Button';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/auth.store';

type LessonType = 'video' | 'pdf' | 'quiz';

interface Lesson {
  id: string;
  title: string;
  type: LessonType;
  duration: string;
  isFree: boolean;
}

interface Module {
  id: string;
  title: string;
  lessons: Lesson[];
}

const initialModules: Module[] = [
  {
    id: 'm1',
    title: 'Introduction & Fondamentaux',
    lessons: [
      { id: 'l1', title: 'Bienvenue dans le cours', type: 'video', duration: '5:20', isFree: true },
      { id: 'l2', title: 'Qu\'est-ce que l\'IA ?', type: 'video', duration: '12:45', isFree: true },
      { id: 'l3', title: 'Historique du Machine Learning', type: 'video', duration: '9:30', isFree: false },
      { id: 'l4', title: 'Ressources du cours', type: 'pdf', duration: '3 min', isFree: false },
    ],
  },
  {
    id: 'm2',
    title: 'Python pour le Machine Learning',
    lessons: [
      { id: 'l5', title: 'Environnement Python & Jupyter', type: 'video', duration: '15:00', isFree: false },
      { id: 'l6', title: 'NumPy — manipulation de tableaux', type: 'video', duration: '22:10', isFree: false },
      { id: 'l7', title: 'Quiz — Python ML', type: 'quiz', duration: '15 min', isFree: false },
    ],
  },
];

const lessonTypeConfig = {
  video: { icon: <Video size={13} />, label: 'Vidéo', color: 'text-indigo-400 bg-indigo-500/10' },
  pdf: { icon: <FileText size={13} />, label: 'PDF', color: 'text-amber-400 bg-amber-500/10' },
  quiz: { icon: <HelpCircle size={13} />, label: 'Quiz', color: 'text-purple-400 bg-purple-500/10' },
};

export default function CourseEditPage() {
  const authUser = useAuthStore(s => s.user);
  const userName = authUser?.name ?? 'Formateur';
  const [activeTab, setActiveTab] = useState<'info' | 'content' | 'settings'>('info');
  const [modules, setModules] = useState<Module[]>(initialModules);
  const [expandedModules, setExpandedModules] = useState<string[]>(['m1', 'm2']);
  const [isSaving, setIsSaving] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [isPublished, setIsPublished] = useState(true);

  const [formData, setFormData] = useState({
    title: 'Intelligence Artificielle & Machine Learning avec Python',
    description: 'Maîtrisez les fondamentaux de l\'IA et du ML. De la régression linéaire aux réseaux de neurones profonds, avec des projets pratiques sur des données réelles.',
    category: 'Intelligence Artificielle',
    level: 'Intermédiaire',
    language: 'Français',
    duration: '42',
    price: '0',
    tags: 'Python, ML, Deep Learning, TensorFlow',
  });

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise(r => setTimeout(r, 1200));
    setIsSaving(false);
    toast.success('Cours sauvegardé avec succès !');
  };

  const generateWithAI = async () => {
    setAiGenerating(true);
    await new Promise(r => setTimeout(r, 2000));
    setAiGenerating(false);
    setFormData(prev => ({
      ...prev,
      description: 'Plongez dans le monde passionnant de l\'Intelligence Artificielle et du Machine Learning avec Python. Ce cours complet vous guidera depuis les concepts fondamentaux jusqu\'aux techniques avancées de Deep Learning. Vous travaillerez sur des projets réels avec TensorFlow, Keras et Scikit-learn, en appliquant vos connaissances sur des datasets concrets. À la fin du cours, vous serez capable de concevoir, entraîner et déployer vos propres modèles d\'IA.',
    }));
    toast.success('Description générée par l\'IA !');
  };

  const toggleModule = (id: string) => {
    setExpandedModules(prev => prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]);
  };

  const addModule = () => {
    const newMod: Module = {
      id: `m${Date.now()}`,
      title: 'Nouveau module',
      lessons: [],
    };
    setModules(prev => [...prev, newMod]);
    setExpandedModules(prev => [...prev, newMod.id]);
  };

  const removeModule = (modId: string) => {
    setModules(prev => prev.filter(m => m.id !== modId));
    toast('Module supprimé', { icon: '🗑️' });
  };

  const addLesson = (modId: string) => {
    const newLesson: Lesson = {
      id: `l${Date.now()}`,
      title: 'Nouvelle leçon',
      type: 'video',
      duration: '',
      isFree: false,
    };
    setModules(prev => prev.map(m =>
      m.id === modId ? { ...m, lessons: [...m.lessons, newLesson] } : m
    ));
  };

  const removeLesson = (modId: string, lessonId: string) => {
    setModules(prev => prev.map(m =>
      m.id === modId ? { ...m, lessons: m.lessons.filter(l => l.id !== lessonId) } : m
    ));
  };

  const updateLessonTitle = (modId: string, lessonId: string, title: string) => {
    setModules(prev => prev.map(m =>
      m.id === modId
        ? { ...m, lessons: m.lessons.map(l => l.id === lessonId ? { ...l, title } : l) }
        : m
    ));
  };

  const updateLessonType = (modId: string, lessonId: string, type: LessonType) => {
    setModules(prev => prev.map(m =>
      m.id === modId
        ? { ...m, lessons: m.lessons.map(l => l.id === lessonId ? { ...l, type } : l) }
        : m
    ));
  };

  const totalLessons = modules.reduce((acc, m) => acc + m.lessons.length, 0);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar role="trainer" userName={userName} />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-white/[0.06] bg-[#04040a] flex-shrink-0">
          <div className="flex items-center gap-3">
            <Link href="/trainer/courses">
              <motion.button whileHover={{ x: -2 }} className="p-1.5 rounded-lg hover:bg-white/[0.05] text-slate-400 hover:text-white transition-colors">
                <ArrowLeft size={18} />
              </motion.button>
            </Link>
            <div>
              <h1 className="text-white font-semibold text-sm">Modifier le cours</h1>
              <p className="text-xs text-slate-500 truncate max-w-xs">{formData.title}</p>
            </div>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
              isPublished ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
            }`}>
              {isPublished ? 'Publié' : 'Brouillon'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Link href={`/student/courses/course-1`}>
              <Button variant="ghost" size="sm">
                <Eye size={14} /> Prévisualiser
              </Button>
            </Link>
            <Button variant="primary" size="sm" loading={isSaving} onClick={handleSave}>
              <Save size={14} /> Sauvegarder
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-6 border-b border-white/[0.06] flex-shrink-0">
          <div className="flex gap-6">
            {(['info', 'content', 'settings'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab ? 'border-indigo-500 text-white' : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                {tab === 'info' ? 'Informations' : tab === 'content' ? `Contenu (${totalLessons})` : 'Paramètres'}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">

            {/* ── Info tab ── */}
            {activeTab === 'info' && (
              <motion.div
                key="info"
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="max-w-3xl space-y-5"
              >
                {/* Title */}
                <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.08] space-y-4">
                  <h2 className="text-white font-semibold flex items-center gap-2">
                    <BookOpen size={16} className="text-indigo-400" /> Informations générales
                  </h2>
                  <div>
                    <label className="text-sm text-slate-400 mb-1.5 block">Titre du cours *</label>
                    <input
                      value={formData.title}
                      onChange={e => setFormData(p => ({ ...p, title: e.target.value }))}
                      className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500/60 transition-colors"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-sm text-slate-400">Description</label>
                      <button
                        onClick={generateWithAI}
                        disabled={aiGenerating}
                        className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 transition-colors disabled:opacity-50"
                      >
                        <Sparkles size={11} className={aiGenerating ? 'animate-spin' : ''} />
                        {aiGenerating ? 'Génération...' : 'Générer avec l\'IA'}
                      </button>
                    </div>
                    <textarea
                      value={formData.description}
                      onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
                      rows={4}
                      className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500/60 transition-colors resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { label: 'Catégorie', key: 'category', options: ['Intelligence Artificielle', 'Développement Web', 'Data Science', 'DevOps', 'Cybersécurité'] },
                      { label: 'Niveau', key: 'level', options: ['Débutant', 'Intermédiaire', 'Avancé'] },
                      { label: 'Langue', key: 'language', options: ['Français', 'Anglais', 'Arabe'] },
                    ].map(f => (
                      <div key={f.key}>
                        <label className="text-sm text-slate-400 mb-1.5 block">{f.label}</label>
                        <div className="relative">
                          <select
                            value={formData[f.key as keyof typeof formData]}
                            onChange={e => setFormData(p => ({ ...p, [f.key]: e.target.value }))}
                            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500/60 transition-colors appearance-none pr-8"
                          >
                            {f.options.map(o => <option key={o} value={o} className="bg-[#0d0d1a]">{o}</option>)}
                          </select>
                          <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                        </div>
                      </div>
                    ))}
                    <div>
                      <label className="text-sm text-slate-400 mb-1.5 flex items-center gap-1.5 block">
                        <DollarSign size={12} /> Prix (0 = gratuit)
                      </label>
                      <input
                        type="number"
                        value={formData.price}
                        onChange={e => setFormData(p => ({ ...p, price: e.target.value }))}
                        className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500/60 transition-colors"
                        placeholder="0"
                        min="0"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm text-slate-400 mb-1.5 flex items-center gap-1.5 block">
                      <Tag size={12} /> Tags (séparés par des virgules)
                    </label>
                    <input
                      value={formData.tags}
                      onChange={e => setFormData(p => ({ ...p, tags: e.target.value }))}
                      className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500/60 transition-colors"
                      placeholder="Python, ML, IA..."
                    />
                  </div>
                </div>

                {/* Thumbnail */}
                <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.08] space-y-3">
                  <h2 className="text-white font-semibold flex items-center gap-2">
                    <Upload size={16} className="text-indigo-400" /> Image de couverture
                  </h2>
                  <div className="relative rounded-xl overflow-hidden aspect-video bg-white/[0.02] border border-dashed border-white/[0.12]">
                    <img
                      src="https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=800&q=80"
                      alt="thumbnail"
                      className="w-full h-full object-cover opacity-60"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <motion.label
                        whileHover={{ scale: 1.03 }}
                        className="cursor-pointer flex flex-col items-center gap-2 bg-black/60 backdrop-blur-sm px-6 py-4 rounded-xl border border-white/20"
                      >
                        <Upload size={20} className="text-white" />
                        <span className="text-white text-sm font-medium">Changer l&apos;image</span>
                        <input type="file" accept="image/*" className="hidden" onChange={() => toast.success('Image mise à jour !')} />
                      </motion.label>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── Content tab ── */}
            {activeTab === 'content' && (
              <motion.div
                key="content"
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="max-w-3xl space-y-3"
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-white font-semibold">Structure du cours</h2>
                    <p className="text-sm text-slate-500">{modules.length} modules · {totalLessons} leçons</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={addModule}>
                    <Plus size={14} /> Ajouter un module
                  </Button>
                </div>

                {modules.map((mod, mi) => {
                  const isExpanded = expandedModules.includes(mod.id);
                  return (
                    <motion.div
                      key={mod.id}
                      layout
                      className="rounded-2xl bg-white/[0.03] border border-white/[0.08] overflow-hidden"
                    >
                      {/* Module header */}
                      <div className="flex items-center gap-2 p-4">
                        <GripVertical size={16} className="text-slate-600 cursor-grab flex-shrink-0" />
                        <button onClick={() => toggleModule(mod.id)} className="flex-shrink-0 text-slate-500">
                          <motion.div animate={{ rotate: isExpanded ? 90 : 0 }} transition={{ duration: 0.2 }}>
                            <ChevronDown size={16} />
                          </motion.div>
                        </button>
                        <input
                          value={mod.title}
                          onChange={e => setModules(prev => prev.map(m => m.id === mod.id ? { ...m, title: e.target.value } : m))}
                          className="flex-1 bg-transparent text-white font-medium text-sm focus:outline-none border-b border-transparent focus:border-white/20 transition-colors"
                          placeholder="Titre du module"
                        />
                        <span className="text-xs text-slate-500 flex-shrink-0">{mod.lessons.length} leçons</span>
                        <button
                          onClick={() => removeModule(mod.id)}
                          className="text-slate-600 hover:text-rose-400 transition-colors flex-shrink-0"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>

                      {/* Lessons */}
                      <AnimatePresence initial={false}>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.25 }}
                            className="overflow-hidden border-t border-white/[0.06]"
                          >
                            {mod.lessons.map(lesson => (
                              <motion.div
                                key={lesson.id}
                                layout
                                className="flex items-center gap-2 px-4 py-2.5 border-b border-white/[0.04] last:border-0 hover:bg-white/[0.01] transition-colors"
                              >
                                <GripVertical size={13} className="text-slate-700 cursor-grab flex-shrink-0" />

                                <div className={`px-1.5 py-0.5 rounded-md text-xs flex items-center gap-1 flex-shrink-0 ${lessonTypeConfig[lesson.type].color}`}>
                                  {lessonTypeConfig[lesson.type].icon}
                                </div>

                                <input
                                  value={lesson.title}
                                  onChange={e => updateLessonTitle(mod.id, lesson.id, e.target.value)}
                                  className="flex-1 bg-transparent text-slate-300 text-sm focus:outline-none border-b border-transparent focus:border-white/20 transition-colors min-w-0"
                                  placeholder="Titre de la leçon"
                                />

                                {/* Type selector */}
                                <select
                                  value={lesson.type}
                                  onChange={e => updateLessonType(mod.id, lesson.id, e.target.value as LessonType)}
                                  className="bg-white/[0.04] border border-white/[0.08] rounded-lg px-2 py-1 text-xs text-slate-400 focus:outline-none flex-shrink-0"
                                >
                                  <option value="video" className="bg-[#0d0d1a]">Vidéo</option>
                                  <option value="pdf" className="bg-[#0d0d1a]">PDF</option>
                                  <option value="quiz" className="bg-[#0d0d1a]">Quiz</option>
                                </select>

                                {/* Free toggle */}
                                <button
                                  onClick={() => setModules(prev => prev.map(m =>
                                    m.id === mod.id
                                      ? { ...m, lessons: m.lessons.map(l => l.id === lesson.id ? { ...l, isFree: !l.isFree } : l) }
                                      : m
                                  ))}
                                  className={`text-xs flex-shrink-0 px-1.5 py-0.5 rounded-md border transition-colors ${
                                    lesson.isFree
                                      ? 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10'
                                      : 'text-slate-600 border-white/[0.06] hover:text-slate-400'
                                  }`}
                                >
                                  {lesson.isFree ? <Globe size={11} /> : <Lock size={11} />}
                                </button>

                                <button
                                  onClick={() => removeLesson(mod.id, lesson.id)}
                                  className="text-slate-600 hover:text-rose-400 transition-colors flex-shrink-0"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </motion.div>
                            ))}

                            <div className="px-4 py-2.5">
                              <button
                                onClick={() => addLesson(mod.id)}
                                className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                              >
                                <Plus size={12} /> Ajouter une leçon
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}

                {modules.length === 0 && (
                  <div className="text-center py-16 text-slate-500">
                    <BookOpen size={32} className="mx-auto mb-3 opacity-30" />
                    <p className="text-sm">Aucun module. Ajoutez votre premier module.</p>
                  </div>
                )}
              </motion.div>
            )}

            {/* ── Settings tab ── */}
            {activeTab === 'settings' && (
              <motion.div
                key="settings"
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="max-w-3xl space-y-5"
              >
                {/* Publication */}
                <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.08] space-y-4">
                  <h2 className="text-white font-semibold flex items-center gap-2">
                    <Globe size={16} className="text-indigo-400" /> Publication
                  </h2>
                  <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                    <div>
                      <p className="text-white text-sm font-medium">Statut de publication</p>
                      <p className="text-slate-500 text-xs mt-0.5">
                        {isPublished ? 'Le cours est visible par les étudiants' : 'Le cours est en mode brouillon'}
                      </p>
                    </div>
                    <button
                      onClick={() => { setIsPublished(p => !p); toast.success(isPublished ? 'Cours dépublié' : 'Cours publié !'); }}
                      className={`relative w-11 h-6 rounded-full transition-colors ${isPublished ? 'bg-indigo-500' : 'bg-white/[0.1]'}`}
                    >
                      <motion.div
                        animate={{ x: isPublished ? 20 : 2 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        className="absolute top-1 w-4 h-4 rounded-full bg-white"
                      />
                    </button>
                  </div>
                </div>

                {/* Duration */}
                <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.08] space-y-4">
                  <h2 className="text-white font-semibold flex items-center gap-2">
                    <Clock size={16} className="text-indigo-400" /> Durée & Accès
                  </h2>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-slate-400 mb-1.5 block">Durée estimée (heures)</label>
                      <input
                        type="number"
                        value={formData.duration}
                        onChange={e => setFormData(p => ({ ...p, duration: e.target.value }))}
                        className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500/60 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-slate-400 mb-1.5 block">Type d&apos;accès</label>
                      <div className="relative">
                        <select className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500/60 transition-colors appearance-none pr-8">
                          <option className="bg-[#0d0d1a]">Accès à vie</option>
                          <option className="bg-[#0d0d1a]">Accès 6 mois</option>
                          <option className="bg-[#0d0d1a]">Accès 1 an</option>
                        </select>
                        <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Danger zone */}
                <div className="p-5 rounded-2xl bg-rose-500/5 border border-rose-500/20 space-y-3">
                  <h2 className="text-rose-400 font-semibold flex items-center gap-2">
                    <AlertCircle size={16} /> Zone de danger
                  </h2>
                  <p className="text-slate-400 text-sm">Ces actions sont irréversibles. Procédez avec précaution.</p>
                  <div className="flex gap-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-rose-400 hover:bg-rose-500/10 border-rose-500/20"
                      onClick={() => toast.error('Fonctionnalité en cours de développement')}
                    >
                      <Trash2 size={14} /> Supprimer le cours
                    </Button>
                  </div>
                </div>

                {/* Save */}
                <div className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08]">
                  <div className="flex items-center gap-2 text-emerald-400 text-sm">
                    <CheckCircle size={15} /> Toutes les modifications seront sauvegardées
                  </div>
                  <Button variant="primary" loading={isSaving} onClick={handleSave}>
                    <Save size={14} /> Sauvegarder
                  </Button>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
