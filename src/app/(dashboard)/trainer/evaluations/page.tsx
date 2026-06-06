'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText, Brain, Sparkles, Plus, Trash2, Check, AlertCircle, Users } from 'lucide-react';
import Sidebar from '@/components/dashboard/Sidebar';
import { useAuthStore } from '@/store/auth.store';
import Header from '@/components/dashboard/Header';
import Button from '@/components/ui/Button';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

interface Course { id: string; title: string }
interface QuizRow {
  id: string; title: string; courseTitle: string;
  questionsCount: number; attemptsCount: number; avgScore: number; passedCount: number;
}
interface GeneratedQuestion { text: string; options: string[]; correct: number; explanation: string }

export default function TrainerEvaluationsPage() {
  const authUser = useAuthStore(s => s.user);
  const userName = authUser?.name ?? 'Formateur';

  const [quizzes, setQuizzes] = useState<QuizRow[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);

  const [topic, setTopic] = useState('');
  const [nbQuestions, setNbQuestions] = useState(5);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [quizTitle, setQuizTitle] = useState('');
  const [generatedQuestions, setGeneratedQuestions] = useState<GeneratedQuestion[]>([]);

  useEffect(() => {
    Promise.all([
      api.get<QuizRow[]>('/trainer/quizzes'),
      api.get<Course[]>('/courses/my'),
    ]).then(([qs, cs]) => {
      setQuizzes(qs);
      setCourses(cs);
      if (cs.length > 0) setSelectedCourseId(cs[0].id);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const generateWithAI = async () => {
    if (!topic.trim()) { toast.error('Entrez un sujet pour générer des questions'); return; }
    setGenerating(true);
    try {
      const res = await api.post<{ questions?: GeneratedQuestion[] }>('/ai/generate-quiz', {
        topic,
        nbQuestions,
        difficulty: 'intermediate',
      });
      const questions = (res as any).questions ?? [];
      if (questions.length === 0) throw new Error('Aucune question générée');
      setGeneratedQuestions(questions);
      if (!quizTitle) setQuizTitle(`Quiz — ${topic}`);
      toast.success(`${questions.length} questions générées par l'IA !`);
    } catch (e: any) {
      toast.error(e.message || 'Erreur de génération');
    } finally {
      setGenerating(false);
    }
  };

  const saveQuiz = async () => {
    if (!selectedCourseId) { toast.error('Sélectionnez un cours'); return; }
    if (!quizTitle.trim()) { toast.error('Entrez un titre pour le quiz'); return; }
    if (generatedQuestions.length === 0) { toast.error('Générez des questions d\'abord'); return; }
    setSaving(true);
    try {
      await api.post('/quizzes', {
        courseId: selectedCourseId,
        title: quizTitle,
        timeLimit: 15,
        passingScore: 70,
        questions: generatedQuestions.map(q => ({
          text: q.text,
          options: q.options,
          correct: q.correct,
          explanation: q.explanation,
        })),
      });
      toast.success('Quiz créé et publié !');
      setGeneratedQuestions([]);
      setTopic('');
      setQuizTitle('');
      // Refresh list
      api.get<QuizRow[]>('/trainer/quizzes').then(setQuizzes).catch(() => {});
    } catch (e: any) {
      toast.error(e.message || 'Erreur lors de la création');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar role="trainer" userName={userName} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Évaluations" subtitle="Créez et gérez vos quiz avec l'aide de l'IA" />
        <main className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* AI Generator */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-600/10 to-purple-600/10 border border-indigo-500/20">
            <div className="flex items-center gap-2 mb-4">
              <Brain size={18} className="text-indigo-400" />
              <h3 className="font-semibold text-white">Générateur de quiz IA</h3>
            </div>
            <p className="text-sm text-slate-400 mb-4">
              L&apos;IA génère des questions pertinentes basées sur le sujet et le contenu de vos cours.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
              <input value={topic} onChange={e => setTopic(e.target.value)}
                placeholder="Sujet (ex: Réseaux de neurones, Docker...)"
                className="md:col-span-2 px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/40" />
              <select value={nbQuestions} onChange={e => setNbQuestions(Number(e.target.value))}
                className="px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500/40">
                {[3, 5, 8, 10, 15].map(n => <option key={n} value={n}>{n} questions</option>)}
              </select>
            </div>

            <Button gradient loading={generating} onClick={generateWithAI} icon={<Sparkles size={14} />}>
              Générer avec l&apos;IA
            </Button>

            {generatedQuestions.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-5 space-y-4">
                <div className="flex items-center gap-3 flex-wrap">
                  <input value={quizTitle} onChange={e => setQuizTitle(e.target.value)}
                    placeholder="Titre du quiz..."
                    className="flex-1 min-w-48 px-4 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/40" />
                  <select value={selectedCourseId} onChange={e => setSelectedCourseId(e.target.value)}
                    className="px-3 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500/40">
                    {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                  </select>
                  <Button size="sm" loading={saving} icon={<Plus size={13} />} onClick={saveQuiz}>
                    Créer le quiz
                  </Button>
                </div>

                <div className="space-y-3">
                  {generatedQuestions.map((q, i) => (
                    <div key={i} className="p-4 rounded-xl bg-white/[0.04] border border-white/10">
                      <p className="text-sm font-medium text-white mb-2">{i + 1}. {q.text}</p>
                      <div className="grid grid-cols-2 gap-2">
                        {q.options.map((opt, j) => (
                          <div key={j} className={`flex items-center gap-2 text-xs px-2.5 py-1.5 rounded-lg ${j === q.correct ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'text-slate-500'}`}>
                            {j === q.correct && <Check size={10} />}
                            {opt}
                          </div>
                        ))}
                      </div>
                      {q.explanation && (
                        <p className="text-xs text-slate-500 mt-2 italic">💡 {q.explanation}</p>
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>

          {/* Existing quizzes */}
          <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.08]">
            <h3 className="font-semibold text-white mb-5">Quiz existants</h3>

            {loading ? (
              <div className="space-y-3">
                {[1, 2].map(i => <div key={i} className="h-16 rounded-xl bg-white/[0.03] animate-pulse" />)}
              </div>
            ) : quizzes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-slate-500">
                <AlertCircle size={32} className="mb-2 opacity-20" />
                <p className="text-sm">Aucun quiz créé — utilisez le générateur IA ci-dessus</p>
              </div>
            ) : (
              <div className="space-y-3">
                {quizzes.map(quiz => (
                  <div key={quiz.id} className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.12] transition-all">
                    <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                      <FileText size={16} className="text-indigo-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white">{quiz.title}</p>
                      <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-500">
                        <span>{quiz.courseTitle}</span>
                        <span>·</span>
                        <span>{quiz.questionsCount} questions</span>
                        <span>·</span>
                        <span className="flex items-center gap-1"><Users size={10} />{quiz.attemptsCount} tentatives</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-bold ${quiz.avgScore >= 70 ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {quiz.attemptsCount > 0 ? `${quiz.avgScore}%` : '—'}
                      </p>
                      <p className="text-xs text-slate-500">Score moyen</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
