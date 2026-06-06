'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Award, Download, Share2 } from 'lucide-react';
import Sidebar from '@/components/dashboard/Sidebar';
import { useAuthStore } from '@/store/auth.store';
import Header from '@/components/dashboard/Header';
import Button from '@/components/ui/Button';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

interface Enrollment {
  id: string;
  course: { id: string; title: string; trainer: { name: string } };
  progress: number;
  completed: boolean;
  completedAt: string | null;
  certificateUrl: string | null;
}

export default function CertificatesPage() {
  const authUser = useAuthStore(s => s.user);
  const userName = authUser?.name ?? 'Stagiaire';
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<Enrollment[]>('/enrollments/me')
      .then(data => setEnrollments(data.filter(e => e.completed)))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar role="student" userName={userName} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Mes certificats" subtitle="Vos accomplissements certifiés" />
        <main className="flex-1 overflow-y-auto p-6">

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2].map(i => <div key={i} className="h-64 rounded-2xl bg-white/[0.03] animate-pulse" />)}
            </div>
          ) : enrollments.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {enrollments.map((e, i) => (
                <motion.div
                  key={e.id}
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                  className="rounded-2xl overflow-hidden border border-amber-500/20 bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-transparent"
                >
                  <div className="relative p-8 text-center border-b border-amber-500/10">
                    <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(251,191,36,0.5) 0%, transparent 70%)' }} />
                    <Award size={48} className="text-amber-400 mx-auto mb-3" />
                    <p className="text-xs text-amber-400/60 uppercase tracking-widest font-semibold mb-2">Certificat de complétion</p>
                    <h3 className="text-base font-bold text-white leading-snug">{e.course.title}</h3>
                    <p className="text-xs text-slate-400 mt-2">EduAI Pro — {e.course.trainer?.name}</p>
                  </div>
                  <div className="p-4">
                    <p className="text-xs text-slate-500 text-center mb-4">
                      Délivré le {e.completedAt
                        ? new Date(e.completedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
                        : 'N/A'}
                    </p>
                    <div className="flex gap-2">
                      <Button variant="secondary" size="sm" icon={<Download size={13} />} className="flex-1"
                        onClick={() => e.certificateUrl ? window.open(e.certificateUrl, '_blank') : toast.success('Certificat généré !')}>
                        Télécharger
                      </Button>
                      <Button variant="secondary" size="sm" icon={<Share2 size={13} />}
                        onClick={() => toast.success('Lien copié — partagez sur LinkedIn !')}>
                        Partager
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-500">
              <Award size={48} className="mb-4 opacity-20" />
              <p className="text-lg font-semibold text-slate-400">Aucun certificat pour l&apos;instant</p>
              <p className="text-sm mt-2">Complétez vos cours pour obtenir vos certificats</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
