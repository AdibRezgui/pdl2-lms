'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Mail, Lock, User, GraduationCap, BookOpen, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import type { UserRole } from '@/types';

const roleOptions: { value: UserRole; label: string; icon: React.ReactNode; description: string }[] = [
  {
    value: 'student',
    label: 'Stagiaire',
    icon: <GraduationCap size={20} />,
    description: 'Je veux apprendre et développer mes compétences',
  },
  {
    value: 'trainer',
    label: 'Formateur',
    icon: <BookOpen size={20} />,
    description: 'Je veux créer et partager mes connaissances',
  },
];

interface AuthResponse {
  token: string;
  userId: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
}

export default function RegisterPage() {
  const router = useRouter();
  const setAuth = useAuthStore(s => s.setAuth);
  const [step, setStep] = useState(1);
  const [role, setRole] = useState<UserRole>('student');
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const update = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const validateStep1 = () => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = 'Le nom est requis';
    if (!form.email) errs.email = 'L\'email est requis';
    else if (!/^[^@]+@[^@]+\.[^@]+$/.test(form.email)) errs.email = 'Email invalide';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateStep2 = () => {
    const errs: Record<string, string> = {};
    if (!form.password) errs.password = 'Le mot de passe est requis';
    else if (form.password.length < 8) errs.password = 'Minimum 8 caractères';
    if (form.password !== form.confirmPassword) errs.confirmPassword = 'Les mots de passe ne correspondent pas';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep2()) return;
    setLoading(true);
    try {
      const data = await api.post<AuthResponse>('/auth/register', {
        name: form.name,
        email: form.email,
        password: form.password,
        role: role.toUpperCase(),
      });
      setAuth(data.token, {
        id: data.userId,
        name: data.name,
        email: data.email,
        role: data.role as 'ADMIN' | 'TRAINER' | 'STUDENT',
        avatar: data.avatar,
      });
      toast.success('Compte créé avec succès ! Bienvenue sur EduAI Pro');
      router.push(data.role === 'TRAINER' ? '/trainer' : '/student');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur lors de la création du compte');
    } finally {
      setLoading(false);
    }
  };

  const progress = (step / 3) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-md"
    >
      <div className="mb-8">
        <h1 className="text-3xl font-black text-white mb-2">Créer votre compte</h1>
        <p className="text-slate-400">Rejoignez la communauté EduAI Pro gratuitement</p>
      </div>

      {/* Progress */}
      <div className="mb-8">
        <div className="flex justify-between text-xs text-slate-500 mb-2">
          <span>Étape {step} sur 3</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
        <div className="flex justify-between mt-3">
          {['Profil', 'Sécurité', 'Rôle'].map((s, i) => (
            <span
              key={s}
              className={`text-xs font-medium ${step > i ? 'text-indigo-400' : step === i + 1 ? 'text-white' : 'text-slate-600'}`}
            >
              {s}
            </span>
          ))}
        </div>
      </div>

      {step === 1 && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-5"
        >
          <Input
            label="Nom complet"
            placeholder="Prénom Nom"
            value={form.name}
            onChange={update('name')}
            error={errors.name}
            icon={<User size={16} />}
          />
          <Input
            label="Adresse email"
            type="email"
            placeholder="vous@exemple.com"
            value={form.email}
            onChange={update('email')}
            error={errors.email}
            icon={<Mail size={16} />}
          />
          <Button gradient className="w-full" size="lg" onClick={handleNext} iconRight={<ChevronRight size={18} />}>
            Continuer
          </Button>
        </motion.div>
      )}

      {step === 2 && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-5"
        >
          <Input
            label="Mot de passe"
            type="password"
            placeholder="Min. 8 caractères"
            value={form.password}
            onChange={update('password')}
            error={errors.password}
            icon={<Lock size={16} />}
            hint="Au moins 8 caractères, avec majuscules et chiffres"
          />
          <Input
            label="Confirmer le mot de passe"
            type="password"
            placeholder="••••••••"
            value={form.confirmPassword}
            onChange={update('confirmPassword')}
            error={errors.confirmPassword}
            icon={<Lock size={16} />}
          />
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" size="lg" onClick={() => setStep(1)}>
              Retour
            </Button>
            <Button gradient className="flex-1" size="lg" onClick={() => { if (validateStep2()) setStep(3); }} iconRight={<ChevronRight size={18} />}>
              Continuer
            </Button>
          </div>
        </motion.div>
      )}

      {step === 3 && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <p className="text-sm font-medium text-slate-300 mb-4">Quel est votre rôle ?</p>
          <div className="space-y-3 mb-6">
            {roleOptions.map(option => (
              <button
                key={option.value}
                type="button"
                onClick={() => setRole(option.value)}
                className={`w-full flex items-start gap-4 p-4 rounded-xl border text-left transition-all duration-200 ${
                  role === option.value
                    ? 'bg-indigo-500/15 border-indigo-500/40'
                    : 'bg-white/[0.02] border-white/[0.08] hover:border-white/20 hover:bg-white/5'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  role === option.value ? 'bg-indigo-500/20 text-indigo-400' : 'bg-white/5 text-slate-400'
                }`}>
                  {option.icon}
                </div>
                <div>
                  <p className={`font-semibold text-sm ${role === option.value ? 'text-indigo-300' : 'text-white'}`}>
                    {option.label}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">{option.description}</p>
                </div>
                {role === option.value && (
                  <div className="ml-auto w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center flex-shrink-0">
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </button>
            ))}
          </div>

          <div className="flex items-start gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] mb-6">
            <input type="checkbox" id="terms" className="mt-0.5 w-4 h-4 rounded accent-indigo-500" defaultChecked />
            <label htmlFor="terms" className="text-xs text-slate-400 leading-relaxed">
              J&apos;accepte les{' '}
              <a href="#" className="text-indigo-400 hover:underline">Conditions d&apos;utilisation</a>{' '}
              et la{' '}
              <a href="#" className="text-indigo-400 hover:underline">Politique de confidentialité</a>{' '}
              d&apos;EduAI Pro
            </label>
          </div>

          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" size="lg" onClick={() => setStep(2)}>
              Retour
            </Button>
            <Button
              gradient
              className="flex-1"
              size="lg"
              loading={loading}
              onClick={handleSubmit as React.MouseEventHandler}
            >
              Créer mon compte
            </Button>
          </div>
        </motion.div>
      )}

      <p className="mt-8 text-center text-sm text-slate-400">
        Déjà inscrit ?{' '}
        <Link href="/login" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
          Se connecter
        </Link>
      </p>
    </motion.div>
  );
}
