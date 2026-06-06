'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Search, UserPlus, Edit3, Trash2, Shield, CheckCircle, XCircle } from 'lucide-react';
import Sidebar from '@/components/dashboard/Sidebar';
import Header from '@/components/dashboard/Header';
import Button from '@/components/ui/Button';
import { formatDate } from '@/lib/utils';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import toast from 'react-hot-toast';

const roleLabels: Record<string, string> = { ADMIN: 'Admin', TRAINER: 'Formateur', STUDENT: 'Stagiaire' };
const roleColors: Record<string, string> = {
  ADMIN: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  TRAINER: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  STUDENT: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
};

interface ApiUser {
  id: string; name: string; email: string; role: string;
  active: boolean; createdAt: string; avatar?: string;
}

export default function AdminUsersPage() {
  const authUser = useAuthStore(s => s.user);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'ADMIN' | 'TRAINER' | 'STUDENT'>('all');
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);

  useEffect(() => {
    api.get<{ content: ApiUser[]; totalElements: number }>('/admin/users?size=100')
      .then(d => { setUsers(d.content); setTotalUsers(d.totalElements); })
      .catch(() => null);
  }, []);

  const filtered = users.filter(u => {
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const toggleStatus = async (id: string) => {
    try {
      const updated = await api.put<ApiUser>(`/admin/users/${id}/toggle-active`);
      setUsers(prev => prev.map(u => u.id === id ? { ...u, active: updated.active } : u));
      toast.success('Statut mis à jour');
    } catch {
      toast.error('Erreur lors de la mise à jour');
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar role="admin" userName={authUser?.name ?? 'Administrateur'} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Gestion des utilisateurs" subtitle={`${totalUsers} utilisateurs enregistrés`} />

        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Stats summary */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Stagiaires', count: users.filter(u => u.role === 'STUDENT').length, color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20' },
              { label: 'Formateurs', count: users.filter(u => u.role === 'TRAINER').length, color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' },
              { label: 'Admins', count: users.filter(u => u.role === 'ADMIN').length, color: 'text-rose-400 bg-rose-500/10 border-rose-500/20' },
            ].map((s, i) => (
              <div key={i} className={`p-4 rounded-2xl border ${s.color} flex items-center justify-between`}>
                <span className="text-sm font-medium">{s.label}</span>
                <span className="text-2xl font-black text-white">{s.count}</span>
              </div>
            ))}
          </div>

          {/* Toolbar */}
          <div className="flex items-center gap-4 flex-wrap">
            <div className="relative flex-1 max-w-sm">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Rechercher un utilisateur..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/40"
              />
            </div>

            <div className="flex gap-2">
              {(['all', 'STUDENT', 'TRAINER', 'ADMIN'] as const).map(r => (
                <button
                  key={r}
                  onClick={() => setRoleFilter(r)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                    roleFilter === r
                      ? 'bg-indigo-500/15 border-indigo-500/40 text-indigo-300'
                      : 'bg-white/[0.02] border-white/[0.08] text-slate-400 hover:text-white hover:border-white/20'
                  }`}
                >
                  {r === 'all' ? 'Tous' : (roleLabels[r] ?? r)}
                </button>
              ))}
            </div>

            <Button gradient size="sm" icon={<UserPlus size={14} />} className="ml-auto">
              Ajouter un utilisateur
            </Button>
          </div>

          {/* Users table */}
          <div className="rounded-2xl bg-white/[0.03] border border-white/[0.08] overflow-hidden">
            <div className="grid grid-cols-12 gap-4 px-5 py-3 border-b border-white/[0.06] text-xs font-medium text-slate-500 uppercase tracking-wider">
              <div className="col-span-4">Utilisateur</div>
              <div className="col-span-2">Rôle</div>
              <div className="col-span-3">Inscription</div>
              <div className="col-span-2">Statut</div>
              <div className="col-span-1">Actions</div>
            </div>

            <div className="divide-y divide-white/[0.04]">
              {filtered.map((user, i) => (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.04 }}
                  className="grid grid-cols-12 gap-4 px-5 py-4 items-center hover:bg-white/[0.02] transition-colors"
                >
                  <div className="col-span-4 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-xs font-bold text-indigo-300 flex-shrink-0">
                      {user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{user.name}</p>
                      <p className="text-xs text-slate-500">{user.email}</p>
                    </div>
                  </div>

                  <div className="col-span-2">
                    <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${roleColors[user.role] ?? ''}`}>
                      {roleLabels[user.role] ?? user.role}
                    </span>
                  </div>

                  <div className="col-span-3">
                    <p className="text-sm text-slate-400">{formatDate(user.createdAt)}</p>
                  </div>

                  <div className="col-span-2">
                    <button
                      onClick={() => toggleStatus(user.id)}
                      className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border transition-all ${
                        user.active
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500/20'
                      }`}
                    >
                      {user.active ? <CheckCircle size={11} /> : <XCircle size={11} />}
                      {user.active ? 'Actif' : 'Inactif'}
                    </button>
                  </div>

                  <div className="col-span-1 flex items-center gap-1">
                    <button className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-all">
                      <Edit3 size={13} />
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
              <Shield size={36} className="mx-auto mb-3 opacity-30" />
              <p>Aucun utilisateur trouvé</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
