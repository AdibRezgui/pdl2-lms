'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain,
  LayoutDashboard,
  BookOpen,
  Users,
  BarChart3,
  MessageSquare,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  PlusCircle,
  Award,
  FileText,
  Bell,
  TrendingUp,
  ShieldCheck,
} from 'lucide-react';
import type { UserRole } from '@/types';

interface SidebarProps {
  role: UserRole;
  userName: string;
  userAvatar?: string;
}

const navItems: Record<UserRole, { label: string; href: string; icon: React.ReactNode; badge?: number }[]> = {
  student: [
    { label: 'Tableau de bord', href: '/student', icon: <LayoutDashboard size={18} /> },
    { label: 'Mes cours', href: '/student/courses', icon: <BookOpen size={18} /> },
    { label: 'Progression', href: '/student/progress', icon: <TrendingUp size={18} /> },
    { label: 'Assistant IA', href: '/student/chat', icon: <MessageSquare size={18} />, badge: 1 },
    { label: 'Évaluations', href: '/student/evaluations', icon: <FileText size={18} /> },
    { label: 'Certificats', href: '/student/certificates', icon: <Award size={18} /> },
  ],
  trainer: [
    { label: 'Tableau de bord', href: '/trainer', icon: <LayoutDashboard size={18} /> },
    { label: 'Mes cours', href: '/trainer/courses', icon: <BookOpen size={18} /> },
    { label: 'Créer un cours', href: '/trainer/courses/create', icon: <PlusCircle size={18} /> },
    { label: 'Mes stagiaires', href: '/trainer/students', icon: <Users size={18} /> },
    { label: 'Analytics', href: '/trainer/analytics', icon: <BarChart3 size={18} /> },
    { label: 'Évaluations', href: '/trainer/evaluations', icon: <FileText size={18} /> },
  ],
  admin: [
    { label: 'Vue d\'ensemble', href: '/admin', icon: <LayoutDashboard size={18} /> },
    { label: 'Utilisateurs', href: '/admin/users', icon: <Users size={18} /> },
    { label: 'Cours', href: '/admin/courses', icon: <BookOpen size={18} /> },
    { label: 'Analytics', href: '/admin/analytics', icon: <BarChart3 size={18} /> },
    { label: 'Sécurité', href: '/admin/security', icon: <ShieldCheck size={18} /> },
    { label: 'Notifications', href: '/admin/notifications', icon: <Bell size={18} />, badge: 3 },
  ],
};

const roleLabels: Record<UserRole, string> = {
  student: 'Stagiaire',
  trainer: 'Formateur',
  admin: 'Administrateur',
};

const roleColors: Record<UserRole, string> = {
  student: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
  trainer: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
  admin: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
};

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

export default function Sidebar({ role, userName, userAvatar }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const items = navItems[role];

  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 256 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="relative flex flex-col h-screen bg-[#08081a] border-r border-white/[0.06] flex-shrink-0 z-20"
    >
      {/* Logo */}
      <div className="flex items-center gap-3 p-4 h-16 border-b border-white/[0.06]">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-600/30 flex-shrink-0">
          <Brain size={18} className="text-white" />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              className="font-bold text-lg overflow-hidden whitespace-nowrap"
            >
              Edu<span className="gradient-text">AI</span> Pro
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-12 w-6 h-6 rounded-full bg-[#0d0d1a] border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:border-white/20 transition-all z-10 shadow-lg"
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>

      {/* User info */}
      <div className={`flex items-center gap-3 p-4 border-b border-white/[0.06] ${collapsed ? 'justify-center' : ''}`}>
        <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-sm font-bold text-indigo-300 flex-shrink-0">
          {getInitials(userName)}
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="min-w-0"
            >
              <p className="text-sm font-semibold text-white truncate">{userName}</p>
              <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium border ${roleColors[role]}`}>
                {roleLabels[role]}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Nav items */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {items.map(item => {
          const isActive = pathname === item.href || (item.href !== `/${role}` && pathname.startsWith(item.href));
          return (
            <Link key={item.href} href={item.href}>
              <div
                className={`sidebar-item flex items-center gap-3 px-3 py-2.5 rounded-xl border cursor-pointer relative group
                  ${isActive
                    ? 'bg-indigo-500/15 border-indigo-500/30 text-indigo-300'
                    : 'border-transparent text-slate-400 hover:text-white'
                  } ${collapsed ? 'justify-center' : ''}`}
                title={collapsed ? item.label : undefined}
              >
                <span className={`flex-shrink-0 ${isActive ? 'text-indigo-400' : ''}`}>{item.icon}</span>
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-sm font-medium truncate flex-1"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
                {item.badge && !collapsed && (
                  <span className="w-5 h-5 rounded-full bg-indigo-500 text-white text-[10px] font-bold flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
                {item.badge && collapsed && (
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-indigo-500" />
                )}
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-indigo-500 rounded-full" />
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Bottom actions */}
      <div className="p-3 border-t border-white/[0.06] space-y-1">
        <Link href="/settings">
          <div className={`sidebar-item flex items-center gap-3 px-3 py-2.5 rounded-xl border border-transparent text-slate-400 hover:text-white cursor-pointer ${collapsed ? 'justify-center' : ''}`}>
            <Settings size={18} className="flex-shrink-0" />
            <AnimatePresence>
              {!collapsed && (
                <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-sm font-medium">
                  Paramètres
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </Link>
        <Link href="/login">
          <div className={`sidebar-item flex items-center gap-3 px-3 py-2.5 rounded-xl border border-transparent text-slate-400 hover:text-rose-400 cursor-pointer ${collapsed ? 'justify-center' : ''}`}>
            <LogOut size={18} className="flex-shrink-0" />
            <AnimatePresence>
              {!collapsed && (
                <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-sm font-medium">
                  Déconnexion
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </Link>
      </div>
    </motion.aside>
  );
}
