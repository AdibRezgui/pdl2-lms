import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDuration(hours: number): string {
  if (hours < 1) return `${Math.round(hours * 60)}min`;
  if (hours === 1) return '1h';
  return `${hours}h`;
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function formatRelativeTime(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "À l'instant";
  if (diffMins < 60) return `Il y a ${diffMins}min`;
  if (diffHours < 24) return `Il y a ${diffHours}h`;
  if (diffDays < 7) return `Il y a ${diffDays}j`;
  return formatDate(dateStr);
}

export function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

export function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.substring(0, length) + '...';
}

export function getLevelColor(level: string): string {
  switch (level) {
    case 'Débutant': return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
    case 'Intermédiaire': return 'text-amber-400 bg-amber-400/10 border-amber-400/20';
    case 'Avancé': return 'text-rose-400 bg-rose-400/10 border-rose-400/20';
    default: return 'text-slate-400 bg-slate-400/10 border-slate-400/20';
  }
}

export function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    'Développement Web': 'text-blue-400 bg-blue-400/10 border-blue-400/20',
    'Data Science': 'text-purple-400 bg-purple-400/10 border-purple-400/20',
    'Intelligence Artificielle': 'text-indigo-400 bg-indigo-400/10 border-indigo-400/20',
    'DevOps': 'text-orange-400 bg-orange-400/10 border-orange-400/20',
    'Design': 'text-pink-400 bg-pink-400/10 border-pink-400/20',
    'Cybersécurité': 'text-red-400 bg-red-400/10 border-red-400/20',
    'Mobile': 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20',
    'Cloud': 'text-sky-400 bg-sky-400/10 border-sky-400/20',
  };
  return colors[category] || 'text-slate-400 bg-slate-400/10 border-slate-400/20';
}

export function formatPrice(price: number): string {
  if (price === 0) return 'Gratuit';
  return new Intl.NumberFormat('fr-TN', {
    style: 'currency',
    currency: 'TND',
    maximumFractionDigits: 0,
  }).format(price);
}

export function calculateProgress(completed: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((completed / total) * 100);
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}
