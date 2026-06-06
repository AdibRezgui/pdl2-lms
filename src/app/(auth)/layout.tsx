import Link from 'next/link';
import { Brain } from 'lucide-react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#04040a] flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex w-1/2 relative overflow-hidden bg-[#08081a] border-r border-white/[0.06]">
        {/* Background effects */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-purple-600/15 rounded-full blur-3xl" />
          <div className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `linear-gradient(rgba(99,102,241,1) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,1) 1px, transparent 1px)`,
              backgroundSize: '40px 40px',
            }}
          />
        </div>

        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          {/* Logo */}
          <Link href="/" className="inline-flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-600/30">
              <Brain size={22} className="text-white" />
            </div>
            <span className="text-2xl font-bold">
              Edu<span className="gradient-text">AI</span> Pro
            </span>
          </Link>

          {/* Main content */}
          <div className="max-w-md">
            <h1 className="text-5xl font-black text-white leading-tight mb-6">
              L&apos;apprentissage
              <br />
              <span className="gradient-text">réinventé</span>
              <br />
              par l&apos;IA.
            </h1>
            <p className="text-xl text-slate-400 leading-relaxed">
              Rejoignez plus de 12 000 apprenants qui accélèrent leur carrière grâce à notre plateforme de formation intelligente.
            </p>

            {/* Testimonial */}
            <div className="mt-10 p-5 rounded-2xl bg-white/[0.04] border border-white/[0.08]">
              <div className="flex gap-1 mb-3">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-4 h-4 text-amber-400 fill-amber-400" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                ))}
              </div>
              <p className="text-sm text-slate-300 italic mb-4">
                &ldquo;En 6 mois sur EduAI Pro, j&apos;ai obtenu ma certification AWS et décroché un poste de DevOps Engineer. L&apos;IA m&apos;a guidé à chaque étape.&rdquo;
              </p>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-indigo-500/20 border border-indigo-500/30 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=testimonial" alt="User" className="w-full h-full" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-white">Rami Boussetta</p>
                  <p className="text-xs text-slate-500">DevOps Engineer, Sofrecom</p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom stats */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { value: '12K+', label: 'Apprenants' },
              { value: '350+', label: 'Cours' },
              { value: '98%', label: 'Satisfaction' },
            ].map(stat => (
              <div key={stat.label} className="text-center p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <p className="text-xl font-black text-white">{stat.value}</p>
                <p className="text-xs text-slate-500 mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — auth form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        {/* Mobile logo */}
        <div className="absolute top-6 left-6 lg:hidden">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
              <Brain size={16} className="text-white" />
            </div>
            <span className="text-lg font-bold">EduAI Pro</span>
          </Link>
        </div>
        {children}
      </div>
    </div>
  );
}
