'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Search, X, Check, Info, AlertTriangle, CheckCircle } from 'lucide-react';
import { mockNotifications } from '@/lib/mock-data';
import { formatRelativeTime } from '@/lib/utils';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

const notifIcons = {
  info: <Info size={14} className="text-blue-400" />,
  success: <CheckCircle size={14} className="text-emerald-400" />,
  warning: <AlertTriangle size={14} className="text-amber-400" />,
  error: <X size={14} className="text-rose-400" />,
};

export default function Header({ title, subtitle }: HeaderProps) {
  const [showNotifs, setShowNotifs] = useState(false);
  const [search, setSearch] = useState('');
  const unread = mockNotifications.filter(n => !n.isRead).length;

  return (
    <header className="h-16 border-b border-white/[0.06] bg-[#04040a]/80 backdrop-blur-xl flex items-center px-6 gap-4 sticky top-0 z-10">
      {/* Title */}
      <div className="flex-1">
        <h1 className="text-lg font-bold text-white">{title}</h1>
        {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
      </div>

      {/* Search */}
      <div className="relative hidden sm:block">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          type="text"
          placeholder="Rechercher..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-52 pl-9 pr-4 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/40 focus:border-indigo-500/40 transition-all"
        />
      </div>

      {/* Notifications */}
      <div className="relative">
        <button
          onClick={() => setShowNotifs(!showNotifs)}
          className="relative w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/[0.08] transition-all"
        >
          <Bell size={16} />
          {unread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-indigo-500 text-white text-[9px] font-bold flex items-center justify-center">
              {unread}
            </span>
          )}
        </button>

        {/* Notifications dropdown */}
        <AnimatePresence>
          {showNotifs && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowNotifs(false)} />
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-12 w-80 rounded-2xl bg-[#0d0d1a] border border-white/10 shadow-2xl shadow-black/50 z-20 overflow-hidden"
              >
                <div className="flex items-center justify-between p-4 border-b border-white/[0.06]">
                  <h3 className="font-semibold text-white">Notifications</h3>
                  <button className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
                    <Check size={12} /> Tout marquer lu
                  </button>
                </div>
                <div className="divide-y divide-white/[0.04] max-h-80 overflow-y-auto">
                  {mockNotifications.map(notif => (
                    <div
                      key={notif.id}
                      className={`flex gap-3 p-4 hover:bg-white/[0.03] transition-colors cursor-pointer ${!notif.isRead ? 'bg-indigo-500/[0.04]' : ''}`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        notif.type === 'success' ? 'bg-emerald-500/10' :
                        notif.type === 'warning' ? 'bg-amber-500/10' :
                        notif.type === 'error' ? 'bg-rose-500/10' : 'bg-blue-500/10'
                      }`}>
                        {notifIcons[notif.type]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white mb-0.5">{notif.title}</p>
                        <p className="text-xs text-slate-400 line-clamp-2">{notif.message}</p>
                        <p className="text-xs text-slate-600 mt-1">{formatRelativeTime(notif.createdAt)}</p>
                      </div>
                      {!notif.isRead && (
                        <div className="w-2 h-2 rounded-full bg-indigo-500 mt-1.5 flex-shrink-0" />
                      )}
                    </div>
                  ))}
                </div>
                <div className="p-3 border-t border-white/[0.06]">
                  <button className="w-full text-center text-xs text-indigo-400 hover:text-indigo-300 transition-colors py-1">
                    Voir toutes les notifications
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}
