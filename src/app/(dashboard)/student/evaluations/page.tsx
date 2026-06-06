'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Clock, CheckCircle, XCircle, Trophy, Brain, ChevronRight, RotateCcw, AlertCircle } from 'lucide-react';
import Sidebar from '@/components/dashboard/Sidebar';
import { useAuthStore } from '@/store/auth.store';
import Header from '@/components/dashboard/Header';
import Button from '@/components/ui/Button';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

interface QuizItem {
  id: string;
  title: string;
  courseTitle: string;
  courseId: string;
  questionsCount: number;
  timeLimit: number;
  passingScore: number;
  maxAttempts: number;
  attemptsCount: number;
  lastScore: number;
  passed: boolean;
  questions: Question[];
}

export default function EvaluationsPage() {
  const authUser = useAuthStore(s => s.user);
  const userName = authUser?.name ?? 'Stagiaire';

  const [quizzes, setQuizzes] = useState<QuizItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeQuiz, setActiveQuiz] = useState<QuizItem | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [showResult, setShowResult] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [lastAttempt, setLastAttempt] = useState<{ score: number; passed: boolean } | null>(null);

  useEffect(() => {
    api.get<QuizItem[]>('/quizzes/my-courses')
      .then(setQuizzes)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const startQuiz = (quiz: QuizItem) => {
    setActiveQuiz(quiz);
    setCurrentQuestion(0);
    setAnswers({});
    setShowResult(false);
    setLastAttempt(null);
  };

  const selectAnswer = (questionId: string, idx: number) => {
    setAnswers(prev => ({ ...prev, [questionId]: idx }));
  };

  const nextQuestion = () => {
    if (!activeQuiz) return;
    if (currentQuestion < activeQuiz.questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    } else {
      submitQuiz();
    }
  };

  const submitQuiz = async () => {
    if (!activeQuiz) return;
    setSubmitting(true);
    try {
      const timeTaken = activeQuiz.timeLimit * 60;
      const result = await api.post<{ score: number; passed: boolean }>('/quizzes/attempts', {
        quizId: activeQuiz.id,
        answers,
        timeTakenSeconds: timeTaken,
      });
      setLastAttempt(result);
      setShowResult(true);
      // Refresh quiz list
      api.get<QuizItem[]>('/quizzes/my-courses').then(setQuizzes).catch(() => {});
    } catch (e: any) {
      toast.error(e.message || 'Erreur lors de la soumission');
    } finally {
      setSubmitting(false);
    }
  };

  // Quiz in progress view
  if (activeQuiz && !showResult && activeQuiz.questions.length > 0) {
    const q = activeQuiz.questions[currentQuestion];
    const progress = ((currentQuestion + 1) / activeQuiz.questions.length) * 100;

    return (
      <div className="flex h-screen overflow-hidden">
        <Sidebar role="student" userName={userName} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header title={activeQuiz.title} subtitle={activeQuiz.courseTitle} />
          <main className="flex-1 overflow-y-auto p-6">
            <div className="max-w-2xl mx-auto">
              <div className="mb-6">
                <div className="flex justify-between text-sm text-slate-400 mb-2">
                  <span>Question {currentQuestion + 1} sur {activeQuiz.questions.length}</span>
                  <span className="flex items-center gap-1"><Clock size={13} /> {activeQuiz.timeLimit} min</span>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <motion.div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                    animate={{ width: `${progress}%` }} transition={{ duration: 0.3 }} />
                </div>
              </div>

              <AnimatePresence mode="wait">
                <motion.div key={q.id}
                  initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
                  className="p-6 rounded-2xl bg-white/[0.03] border border-white/[0.08] mb-6">
                  <div className="flex items-center gap-2 mb-4 text-xs text-indigo-400">
                    <Brain size={14} />
                    <span>Évaluation — {activeQuiz.courseTitle}</span>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-6">{q.text}</h3>
                  <div className="space-y-3">
                    {q.options.map((option, i) => (
                      <motion.button key={i} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                        onClick={() => selectAnswer(q.id, i)}
                        className={`w-full flex items-center gap-4 p-4 rounded-xl border text-left transition-all duration-200 ${
                          answers[q.id] === i
                            ? 'bg-indigo-500/15 border-indigo-500/40 text-indigo-200'
                            : 'bg-white/[0.02] border-white/[0.08] text-slate-300 hover:border-white/20 hover:bg-white/[0.05]'
                        }`}>
                        <span className={`w-8 h-8 rounded-lg border-2 flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                          answers[q.id] === i ? 'bg-indigo-600 border-indigo-500 text-white' : 'border-white/20 text-slate-400'
                        }`}>
                          {String.fromCharCode(65 + i)}
                        </span>
                        <span className="text-sm">{option}</span>
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              </AnimatePresence>

              <div className="flex justify-between">
                <Button variant="ghost" onClick={() => setActiveQuiz(null)}>Abandonner</Button>
                <Button gradient loading={submitting} disabled={answers[q.id] === undefined}
                  iconRight={<ChevronRight size={16} />} onClick={nextQuestion}>
                  {currentQuestion < activeQuiz.questions.length - 1 ? 'Question suivante' : 'Terminer le quiz'}
                </Button>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  // Results view
  if (showResult && lastAttempt) {
    const { score, passed } = lastAttempt;
    return (
      <div className="flex h-screen overflow-hidden">
        <Sidebar role="student" userName={userName} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header title="Résultats" />
          <main className="flex-1 overflow-y-auto p-6">
            <div className="max-w-xl mx-auto">
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                className="text-center p-8 rounded-2xl bg-white/[0.03] border border-white/[0.08]">
                <div className={`w-32 h-32 rounded-full border-4 mx-auto mb-6 flex flex-col items-center justify-center ${
                  passed ? 'border-emerald-500 bg-emerald-500/10' : 'border-rose-500 bg-rose-500/10'}`}>
                  <span className={`text-4xl font-black ${passed ? 'text-emerald-400' : 'text-rose-400'}`}>{score}%</span>
                  <span className="text-xs text-slate-400 mt-1">Score</span>
                </div>
                <h2 className="text-2xl font-black text-white mb-2">
                  {passed ? '🎉 Quiz réussi !' : '📚 Continuez vos efforts'}
                </h2>
                <p className="text-slate-400 mb-6">
                  Score minimum requis : {activeQuiz?.passingScore}%
                </p>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                    {passed ? <CheckCircle size={24} className="text-emerald-400 mx-auto mb-1" /> : null}
                    <p className="text-2xl font-black text-emerald-400">{score}%</p>
                    <p className="text-xs text-emerald-300">Votre score</p>
                  </div>
                  <div className={`p-3 rounded-xl ${passed ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-rose-500/10 border border-rose-500/20'}`}>
                    {passed ? <Trophy size={24} className="text-amber-400 mx-auto mb-1" /> : <XCircle size={24} className="text-rose-400 mx-auto mb-1" />}
                    <p className={`text-2xl font-black ${passed ? 'text-emerald-400' : 'text-rose-400'}`}>{passed ? 'RÉUSSI' : 'ÉCHOUÉ'}</p>
                    <p className="text-xs text-slate-400">Résultat</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button variant="secondary" icon={<RotateCcw size={14} />} onClick={() => activeQuiz && startQuiz(activeQuiz)} className="flex-1">
                    Réessayer
                  </Button>
                  <Button gradient icon={<CheckCircle size={14} />} onClick={() => { setActiveQuiz(null); setShowResult(false); }} className="flex-1">
                    Terminer
                  </Button>
                </div>
              </motion.div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  // Quiz list view
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar role="student" userName={userName} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Évaluations" subtitle="Testez et validez vos connaissances" />
        <main className="flex-1 overflow-y-auto p-6 space-y-6">

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {[1, 2, 3].map(i => <div key={i} className="h-48 rounded-2xl bg-white/[0.03] animate-pulse" />)}
            </div>
          ) : quizzes.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-500">
              <AlertCircle size={40} className="mb-3 opacity-20" />
              <p className="text-base font-semibold text-slate-400">Aucun quiz disponible</p>
              <p className="text-sm mt-1">Inscrivez-vous à des cours pour accéder aux évaluations</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {quizzes.map((quiz, i) => {
                const locked = quiz.attemptsCount >= quiz.maxAttempts && !quiz.passed;
                const done = quiz.passed;
                const hasScore = quiz.lastScore >= 0;

                return (
                  <motion.div key={quiz.id}
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                    className={`p-5 rounded-2xl border transition-all ${locked ? 'bg-white/[0.02] border-white/[0.06] opacity-60' : 'bg-white/[0.03] border-white/[0.08] hover:border-white/[0.15]'}`}>

                    <div className="flex items-start justify-between mb-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${done ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-indigo-500/10 border border-indigo-500/20'}`}>
                        {done ? <Trophy size={18} className="text-emerald-400" /> : <FileText size={18} className="text-indigo-400" />}
                      </div>
                      {hasScore && (
                        <span className={`text-sm font-bold px-2.5 py-1 rounded-full ${quiz.lastScore >= quiz.passingScore ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                          {quiz.lastScore}%
                        </span>
                      )}
                    </div>

                    <h3 className="font-bold text-white text-sm mb-1">{quiz.title}</h3>
                    <p className="text-xs text-indigo-400 mb-3">{quiz.courseTitle}</p>

                    <div className="flex items-center gap-3 text-xs text-slate-500 mb-4">
                      <span className="flex items-center gap-1"><FileText size={11} />{quiz.questionsCount} questions</span>
                      <span className="flex items-center gap-1"><Clock size={11} />{quiz.timeLimit} min</span>
                      <span>{quiz.attemptsCount}/{quiz.maxAttempts} essais</span>
                    </div>

                    {quiz.questions.length === 0 ? (
                      <button disabled className="w-full py-2 rounded-xl bg-white/5 text-slate-500 text-xs font-medium cursor-not-allowed">
                        Aucune question disponible
                      </button>
                    ) : locked ? (
                      <button disabled className="w-full py-2 rounded-xl bg-white/5 text-slate-500 text-xs font-medium cursor-not-allowed">
                        Tentatives épuisées
                      </button>
                    ) : (
                      <Button
                        gradient={!done}
                        variant={done ? 'secondary' : 'primary'}
                        size="sm"
                        className="w-full"
                        icon={done ? <RotateCcw size={13} /> : <ChevronRight size={13} />}
                        onClick={() => startQuiz(quiz)}
                      >
                        {done ? 'Recommencer' : quiz.attemptsCount > 0 ? 'Réessayer' : 'Commencer'}
                      </Button>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
