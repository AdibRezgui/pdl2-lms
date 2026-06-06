'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Mail, Lock, GraduationCap, BookOpen, Shield, ChevronRight } from 'lucide-react';
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
    icon: <GraduationCap size={18} />,
    description: 'Accéder à vos cours',
  },
  {
    value: 'trainer',
    label: 'Formateur',
    icon: <BookOpen size={18} />,
    description: 'Gérer vos formations',
  },
  {
    value: 'admin',
    label: 'Administrateur',
    icon: <Shield size={18} />,
    description: 'Administrer la plateforme',
  },
];

const redirectMap: Record<string, string> = {
  STUDENT: '/student',
  TRAINER: '/trainer',
  ADMIN: '/admin',
};

interface AuthResponse {
  token: string;
  userId: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
}

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore(s => s.setAuth);
  const [role, setRole] = useState<UserRole>('student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!email) errs.email = "L'email est requis";
    else if (!/^[^@]+@[^@]+\.[^@]+$/.test(email)) errs.email = 'Email invalide';
    if (!password) errs.password = 'Le mot de passe est requis';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const data = await api.post<AuthResponse>('/auth/login', { email, password });
      setAuth(data.token, {
        id: data.userId,
        name: data.name,
        email: data.email,
        role: data.role as 'ADMIN' | 'TRAINER' | 'STUDENT',
        avatar: data.avatar,
      });
      toast.success(`Bienvenue, ${data.name} !`);
      router.push(redirectMap[data.role] ?? '/student');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-md"
    >
      <div className="mb-10">
        <h1 className="text-3xl font-black text-white mb-2">Bon retour !</h1>
        <p className="text-slate-400">Connectez-vous pour accéder à votre espace</p>
      </div>

      {/* Role selector */}
      <div className="mb-8">
        <p className="text-sm font-medium text-slate-300 mb-3">Sélectionnez votre profil</p>
        <div className="grid grid-cols-3 gap-2">
          {roleOptions.map(option => (
            <button
              key={option.value}
              type="button"
              onClick={() => setRole(option.value)}
              className={`flex flex-col items-center gap-2 p-3 rounded-xl border text-center transition-all duration-200 ${
                role === option.value
                  ? 'bg-indigo-500/15 border-indigo-500/40 text-indigo-300'
                  : 'bg-white/[0.02] border-white/[0.08] text-slate-400 hover:text-white hover:border-white/20 hover:bg-white/5'
              }`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                role === option.value ? 'bg-indigo-500/20' : 'bg-white/5'
              }`}>
                {option.icon}
              </div>
              <span className="text-xs font-semibold">{option.label}</span>
              <span className="text-xs opacity-70 leading-tight">{option.description}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Quick fill for demo */}
      <div className="mb-6 p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/20">
        <p className="text-xs text-indigo-300 font-medium mb-2">🎯 Démo rapide — cliquez pour pré-remplir :</p>
        <div className="flex gap-2 flex-wrap">
          {[
            { value: 'student' as UserRole, label: 'Stagiaire', email: 'youssef@student.tn', pass: 'Demo1234!' },
            { value: 'trainer' as UserRole, label: 'Formateur', email: 'amira@eduai.tn', pass: 'Demo1234!' },
            { value: 'admin' as UserRole, label: 'Admin', email: 'admin@eduai.tn', pass: 'Admin@1234' },
          ].map(r => (
            <button
              key={r.value}
              type="button"
              onClick={() => {
                setRole(r.value);
                setEmail(r.email);
                setPassword(r.pass);
              }}
              className="px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-300 hover:bg-indigo-500/20 transition-colors"
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          label="Adresse email"
          type="email"
          placeholder="vous@exemple.com"
          value={email}
          onChange={e => setEmail(e.target.value)}
          error={errors.email}
          icon={<Mail size={16} />}
        />
        <Input
          label="Mot de passe"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={e => setPassword(e.target.value)}
          error={errors.password}
          icon={<Lock size={16} />}
        />

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" className="w-4 h-4 rounded accent-indigo-500" />
            <span className="text-sm text-slate-400">Se souvenir de moi</span>
          </label>
          <a href="#" className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors">
            Mot de passe oublié ?
          </a>
        </div>

        <Button
          type="submit"
          loading={loading}
          gradient
          className="w-full"
          size="lg"
          iconRight={!loading ? <ChevronRight size={18} /> : undefined}
        >
          Se connecter
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-slate-400">
        Pas encore de compte ?{' '}
        <Link href="/register" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
          Créer un compte gratuit
        </Link>
      </p>
    </motion.div>
  );
}
