'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  ChevronRight,
  ChevronLeft,
  Upload,
  Plus,
  Trash2,
  Brain,
  Sparkles,
  BookOpen,
  FileText,
  Video,
  CheckCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import Sidebar from '@/components/dashboard/Sidebar';
import { useAuthStore } from '@/store/auth.store';
import Header from '@/components/dashboard/Header';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';


const categories = ['Intelligence Artificielle', 'Développement Web', 'Data Science', 'DevOps', 'Cybersécurité', 'Mobile', 'Design', 'Cloud'];
const levels = ['Débutant', 'Intermédiaire', 'Avancé'];

interface Lesson {
  id: string;
  title: string;
  type: 'video' | 'pdf' | 'quiz';
  duration: string;
}

export default function CreateCoursePage() {
  const authUser = useAuthStore(s => s.user);
  const userName = authUser?.name ?? 'Formateur';
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);

  const [form, setForm] = useState({
    title: '',
    description: '',
    category: '',
    level: '',
    price: '',
    language: 'Français',
    tags: '',
  });

  const [lessons, setLessons] = useState<Lesson[]>([
    { id: '1', title: 'Introduction au cours', type: 'video', duration: '15' },
    { id: '2', title: 'Les fondamentaux', type: 'video', duration: '30' },
  ]);

  const update = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const addLesson = () => {
    setLessons(prev => [...prev, { id: Date.now().toString(), title: 'Nouvelle leçon', type: 'video', duration: '20' }]);
  };

  const removeLesson = (id: string) => setLessons(prev => prev.filter(l => l.id !== id));

  const updateLesson = (id: string, k: keyof Lesson, v: string) =>
    setLessons(prev => prev.map(l => l.id === id ? { ...l, [k]: v } : l));

  const generateWithAI = async () => {
    if (!form.title) { toast.error('Entrez d\'abord le titre du cours'); return; }
    setAiGenerating(true);
    await new Promise(r => setTimeout(r, 2000));
    setForm(f => ({
      ...f,
      description: `Maîtrisez ${f.title} de A à Z avec une approche pratique et progressive. Ce cours couvre les concepts fondamentaux jusqu'aux techniques avancées utilisées en entreprise. À travers des projets réels et des exercices pratiques, vous développerez les compétences recherchées par les recruteurs.`,
    }));
    setLessons([
      { id: '1', title: 'Introduction et contexte', type: 'video', duration: '20' },
      { id: '2', title: 'Installation et configuration', type: 'video', duration: '25' },
      { id: '3', title: 'Les fondamentaux — Partie 1', type: 'video', duration: '40' },
      { id: '4', title: 'Quiz — Vérification des acquis', type: 'quiz', duration: '15' },
      { id: '5', title: 'Concepts avancés', type: 'video', duration: '45' },
      { id: '6', title: 'Projet pratique', type: 'video', duration: '60' },
      { id: '7', title: 'Évaluation finale', type: 'quiz', duration: '30' },
    ]);
    setAiGenerating(false);
    toast.success('Plan de cours généré par l\'IA !');
  };

  const handlePublish = async () => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 1500));
    setLoading(false);
    toast.success('Cours publié avec succès ! 🎉');
    router.push('/trainer/courses');
  };

  const steps = ['Informations', 'Contenu', 'Publication'];

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar role="trainer" userName={userName} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Créer un cours" subtitle="Construisez votre formation avec l'aide de l'IA" />

        <main className="flex-1 overflow-y-auto p-6">
          {/* Stepper */}
          <div className="flex items-center gap-0 mb-8 max-w-lg">
            {steps.map((s, i) => (
              <div key={i} className="flex items-center flex-1">
                <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-bold transition-all ${
                  step > i + 1 ? 'bg-indigo-600 border-indigo-600 text-white' :
                  step === i + 1 ? 'border-indigo-500 text-indigo-400' :
                  'border-white/20 text-slate-600'
                }`}>
                  {step > i + 1 ? <CheckCircle size={16} /> : i + 1}
                </div>
                <span className={`ml-2 text-sm font-medium ${step === i + 1 ? 'text-white' : 'text-slate-500'}`}>{s}</span>
                {i < steps.length - 1 && (
                  <div className={`flex-1 h-px mx-4 ${step > i + 1 ? 'bg-indigo-500' : 'bg-white/10'}`} />
                )}
              </div>
            ))}
          </div>

          <div className="max-w-3xl space-y-6">
            <AnimatePresence mode="wait">
              {/* Step 1 — Course info */}
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  {/* AI Generator */}
                  <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-600/10 to-purple-600/10 border border-indigo-500/20">
                    <div className="flex items-center gap-2 mb-3">
                      <Brain size={18} className="text-indigo-400" />
                      <h3 className="font-semibold text-white">Assistance IA</h3>
                    </div>
                    <p className="text-sm text-slate-400 mb-4">
                      Entrez le titre de votre cours et laissez l&apos;IA générer automatiquement la description, le plan de cours et les objectifs pédagogiques.
                    </p>
                    <Input
                      label="Titre du cours"
                      placeholder="Ex: Machine Learning avec Python pour débutants"
                      value={form.title}
                      onChange={update('title')}
                    />
                    <Button
                      variant="outline"
                      className="mt-3"
                      loading={aiGenerating}
                      onClick={generateWithAI}
                      icon={<Sparkles size={14} />}
                    >
                      {aiGenerating ? 'Génération en cours...' : 'Générer avec l\'IA'}
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-slate-300 mb-1.5 block">Catégorie</label>
                      <select
                        value={form.category}
                        onChange={update('category')}
                        className="w-full px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500/40"
                      >
                        <option value="" className="bg-[#0d0d1a]">Sélectionner...</option>
                        {categories.map(c => <option key={c} value={c} className="bg-[#0d0d1a]">{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-300 mb-1.5 block">Niveau</label>
                      <select
                        value={form.level}
                        onChange={update('level')}
                        className="w-full px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500/40"
                      >
                        <option value="" className="bg-[#0d0d1a]">Sélectionner...</option>
                        {levels.map(l => <option key={l} value={l} className="bg-[#0d0d1a]">{l}</option>)}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-slate-300 mb-1.5 block">Description</label>
                    <textarea
                      value={form.description}
                      onChange={update('description')}
                      rows={5}
                      placeholder="Décrivez votre cours en détail..."
                      className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/40 resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <Input label="Prix (TND, 0 = gratuit)" placeholder="0" type="number" value={form.price} onChange={update('price')} />
                    <Input label="Tags (séparés par virgule)" placeholder="Python, ML, IA" value={form.tags} onChange={update('tags')} />
                  </div>

                  <div className="flex justify-end">
                    <Button gradient iconRight={<ChevronRight size={16} />} onClick={() => setStep(2)}>
                      Continuer : Contenu
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* Step 2 — Lessons */}
              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-5"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-white">Plan du cours</h3>
                      <p className="text-xs text-slate-500">{lessons.length} leçons · {lessons.reduce((a, l) => a + parseInt(l.duration || '0'), 0)} min total</p>
                    </div>
                    <Button variant="secondary" size="sm" icon={<Plus size={14} />} onClick={addLesson}>
                      Ajouter une leçon
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {lessons.map((lesson, i) => (
                      <div key={lesson.id} className="flex items-center gap-3 p-4 rounded-xl bg-white/[0.03] border border-white/[0.08]">
                        <span className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-xs text-slate-500 font-bold flex-shrink-0">
                          {i + 1}
                        </span>

                        <div className="flex-1 grid grid-cols-3 gap-3">
                          <div className="col-span-2">
                            <input
                              value={lesson.title}
                              onChange={e => updateLesson(lesson.id, 'title', e.target.value)}
                              className="w-full bg-transparent text-sm text-white focus:outline-none placeholder:text-slate-500"
                              placeholder="Titre de la leçon"
                            />
                          </div>
                          <div className="flex gap-2">
                            <select
                              value={lesson.type}
                              onChange={e => updateLesson(lesson.id, 'type', e.target.value)}
                              className="flex-1 bg-transparent text-xs text-slate-400 focus:outline-none"
                            >
                              <option value="video" className="bg-[#0d0d1a]">Vidéo</option>
                              <option value="pdf" className="bg-[#0d0d1a]">PDF</option>
                              <option value="quiz" className="bg-[#0d0d1a]">Quiz</option>
                            </select>
                            <input
                              value={lesson.duration}
                              onChange={e => updateLesson(lesson.id, 'duration', e.target.value)}
                              type="number"
                              className="w-14 bg-transparent text-xs text-slate-400 focus:outline-none text-right"
                              placeholder="min"
                            />
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {lesson.type === 'video' && <Video size={14} className="text-slate-500" />}
                          {lesson.type === 'pdf' && <FileText size={14} className="text-slate-500" />}
                          {lesson.type === 'quiz' && <BookOpen size={14} className="text-slate-500" />}
                          <button onClick={() => removeLesson(lesson.id)} className="p-1 rounded text-slate-600 hover:text-rose-400 transition-colors">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Upload area */}
                  <div className="border-2 border-dashed border-white/10 rounded-2xl p-8 text-center hover:border-indigo-500/30 transition-colors cursor-pointer group">
                    <Upload size={24} className="text-slate-500 mx-auto mb-3 group-hover:text-indigo-400 transition-colors" />
                    <p className="text-sm text-slate-400">Glissez vos fichiers ici ou <span className="text-indigo-400 hover:underline cursor-pointer">parcourir</span></p>
                    <p className="text-xs text-slate-600 mt-1">MP4, PDF, ZIP — Max 2GB par fichier</p>
                  </div>

                  <div className="flex justify-between">
                    <Button variant="ghost" icon={<ChevronLeft size={16} />} onClick={() => setStep(1)}>Retour</Button>
                    <Button gradient iconRight={<ChevronRight size={16} />} onClick={() => setStep(3)}>Continuer : Publication</Button>
                  </div>
                </motion.div>
              )}

              {/* Step 3 — Publish */}
              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  {/* Summary */}
                  <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.08]">
                    <h3 className="font-semibold text-white mb-4">Récapitulatif du cours</h3>
                    <div className="space-y-3">
                      {[
                        { label: 'Titre', value: form.title || 'Non défini' },
                        { label: 'Catégorie', value: form.category || 'Non défini' },
                        { label: 'Niveau', value: form.level || 'Non défini' },
                        { label: 'Prix', value: form.price === '0' || !form.price ? 'Gratuit' : `${form.price} TND` },
                        { label: 'Leçons', value: `${lessons.length} leçons` },
                      ].map(item => (
                        <div key={item.label} className="flex justify-between py-2 border-b border-white/[0.05] last:border-0">
                          <span className="text-sm text-slate-400">{item.label}</span>
                          <span className="text-sm font-medium text-white">{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Thumbnail upload */}
                  <div>
                    <label className="text-sm font-medium text-slate-300 mb-3 block">Image de couverture</label>
                    <div className="border-2 border-dashed border-white/10 rounded-2xl p-8 text-center hover:border-indigo-500/30 transition-colors cursor-pointer">
                      <Upload size={24} className="text-slate-500 mx-auto mb-2" />
                      <p className="text-sm text-slate-400">Cliquez pour uploader une image</p>
                      <p className="text-xs text-slate-600 mt-1">PNG, JPG, WEBP — 1280×720px recommandé</p>
                    </div>
                  </div>

                  <div className="flex justify-between">
                    <Button variant="ghost" icon={<ChevronLeft size={16} />} onClick={() => setStep(2)}>Retour</Button>
                    <div className="flex gap-3">
                      <Button variant="secondary" onClick={() => { toast.success('Cours sauvegardé en brouillon'); router.push('/trainer/courses'); }}>
                        Sauvegarder brouillon
                      </Button>
                      <Button gradient loading={loading} onClick={handlePublish} icon={<CheckCircle size={16} />}>
                        Publier le cours
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
}
