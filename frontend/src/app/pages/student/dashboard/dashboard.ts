import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { trigger, style, animate, transition, stagger, query } from '@angular/animations';
import { AuthService } from '../../../core/services/auth';
import { ApiService } from '../../../core/services/api';
import { Sidebar } from '../../../shared/sidebar/sidebar';

interface Enrollment { id: string; course: { id: string; title: string; category: string; level: string }; progress: number; completed: boolean; }
interface Recommendation { id: string; title: string; category: string; level: string; }

@Component({
  selector: 'app-student-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, Sidebar],
  animations: [
    trigger('fadeUp', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('420ms cubic-bezier(0.23,1,0.32,1)', style({ opacity: 1, transform: 'translateY(0)' })),
      ]),
    ]),
    trigger('staggerCards', [
      transition(':enter', [
        query('.stat-card', [
          style({ opacity: 0, transform: 'translateY(24px)' }),
          stagger(80, animate('380ms cubic-bezier(0.23,1,0.32,1)', style({ opacity: 1, transform: 'translateY(0)' }))),
        ], { optional: true }),
      ]),
    ]),
  ],
  template: `
    <div class="shell">
      <app-sidebar [role]="auth.role() ?? ''" [userName]="auth.user()?.name ?? ''" />

      <main class="main-area">
        <!-- Top bar -->
        <header class="topbar reveal">
          <div>
            <h1 class="topbar-title">Bonjour, <span class="gradient-text">{{ firstName }}</span> 👋</h1>
            <p class="topbar-sub">Voici un résumé de votre progression aujourd'hui</p>
          </div>
          <a routerLink="/student/courses" class="btn-primary">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Explorer les cours
          </a>
        </header>

        <div class="content">
          <!-- Stats -->
          <div @staggerCards class="stats-row">
            <div class="stat-card" *ngFor="let s of stats">
              <div class="stat-icon" [style.background]="s.bg" [style.boxShadow]="'0 6px 20px ' + s.glow">
                <span [innerHTML]="s.svg"></span>
              </div>
              <div>
                <p class="stat-value">{{ s.value }}</p>
                <p class="stat-label">{{ s.label }}</p>
              </div>
            </div>
          </div>

          <div class="two-col">
            <!-- Active courses -->
            <section @fadeUp class="card p-5">
              <div class="flex items-center justify-between mb-5">
                <h2 class="section-title">Cours en cours</h2>
                <a routerLink="/student/courses" class="text-xs font-semibold underline-draw" style="color:#a78bfa">Voir tout →</a>
              </div>

              <div *ngIf="loading()" class="space-y-3">
                <div *ngFor="let _ of [1,2,3]" class="skeleton h-16 rounded-xl"></div>
              </div>

              <div *ngIf="!loading() && active().length === 0" class="empty-state">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
                <p>Aucun cours en cours</p>
                <a routerLink="/student/courses" class="btn-primary text-xs mt-2">Commencer maintenant</a>
              </div>

              <div class="course-list">
                <div class="course-item" *ngFor="let e of active()">
                  <div class="course-cat-badge" [style.background]="catColor(e.course.category)">
                    {{ e.course.category?.charAt(0) ?? 'C' }}
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="course-title">{{ e.course.title }}</p>
                    <div class="flex items-center gap-3 mt-1.5">
                      <div class="progress-track flex-1">
                        <div class="progress-fill" [style.width.%]="e.progress"></div>
                      </div>
                      <span class="text-xs font-bold" style="color:#818cf8;min-width:30px">{{ e.progress }}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <!-- Right column -->
            <div class="flex flex-col gap-5">
              <!-- Quick actions -->
              <section @fadeUp class="card p-5">
                <h2 class="section-title mb-4">Accès rapide</h2>
                <div class="quick-grid">
                  <a *ngFor="let q of quickActions" [routerLink]="q.path" class="quick-item">
                    <div class="quick-icon" [style.background]="q.bg">
                      <span [innerHTML]="q.svg"></span>
                    </div>
                    <span class="quick-label">{{ q.label }}</span>
                  </a>
                </div>
              </section>

              <!-- AI recommendations -->
              <section @fadeUp class="card p-5">
                <div class="flex items-center gap-2 mb-4">
                  <div class="w-6 h-6 rounded-lg flex items-center justify-center" style="background:linear-gradient(135deg,#a78bfa,#fb7299)">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                  </div>
                  <h2 class="section-title">Recommandés pour vous</h2>
                </div>
                <div class="space-y-2">
                  <div *ngFor="let r of recs()" class="reco-item">
                    <div class="reco-dot"></div>
                    <div>
                      <p class="text-sm font-semibold" style="color:#221f2c">{{ r.title }}</p>
                      <p class="text-xs mt-0.5" style="color:#948da3">{{ r.category }} · {{ r.level }}</p>
                    </div>
                  </div>
                  <p *ngIf="recs().length===0 && !loading()" class="text-xs" style="color:#948da3">Aucune recommandation disponible</p>
                </div>
              </section>
            </div>
          </div>
        </div>
      </main>
    </div>
  `,
  styles: [`
    .shell { display:flex; height:100vh; overflow:hidden; background:linear-gradient(160deg,#fffdfb 0%,#fdf2f8 60%,#f6f0ff 100%); }
    .main-area { flex:1; overflow-y:auto; display:flex; flex-direction:column; }
    .topbar { display:flex; align-items:center; justify-content:space-between; padding:22px 30px; border-bottom:1px solid rgba(167,139,250,.12); background:rgba(255,253,251,.78); backdrop-filter:blur(20px); -webkit-backdrop-filter:blur(20px); position:sticky; top:0; z-index:10; }
    .topbar-title { font-family:'Fraunces',Georgia,serif; font-size:22px; font-weight:700; color:#221f2c; margin:0; letter-spacing:-.01em; }
    .topbar-sub { font-size:13px; color:#948da3; margin:3px 0 0; }
    .content { padding:26px 30px; display:flex; flex-direction:column; gap:22px; }
    .stats-row { display:grid; grid-template-columns:repeat(4,1fr); gap:16px; }
    @media(max-width:1100px) { .stats-row { grid-template-columns:repeat(2,1fr); } }
    .stat-icon { width:44px;height:44px;border-radius:14px;display:flex;align-items:center;justify-content:center;flex-shrink:0; }
    .stat-value { font-size:26px;font-weight:800;color:#221f2c;line-height:1;font-family:'Fraunces',Georgia,serif; }
    .stat-label { font-size:12px;color:#948da3;margin-top:4px; }
    .stat-card { display:flex;align-items:center;gap:14px; }
    .two-col { display:grid; grid-template-columns:1fr 340px; gap:20px; }
    @media(max-width:900px) { .two-col { grid-template-columns:1fr; } }
    .section-title { font-family:'Fraunces',Georgia,serif; font-weight:700; color:#221f2c; }
    .course-list { display:flex;flex-direction:column;gap:10px; }
    .course-item { display:flex;align-items:center;gap:12px;padding:12px;border-radius:16px;background:rgba(167,139,250,.045);border:1px solid rgba(167,139,250,.12);transition:all .25s cubic-bezier(.16,1,.3,1); }
    .course-item:hover { border-color:rgba(167,139,250,.32);background:rgba(167,139,250,.08);transform:translateX(2px); }
    .course-cat-badge { width:38px;height:38px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:800;color:white;flex-shrink:0; }
    .course-title { font-size:13px;font-weight:600;color:#221f2c;overflow:hidden;text-overflow:ellipsis;white-space:nowrap; }
    .quick-grid { display:grid;grid-template-columns:repeat(3,1fr);gap:9px; }
    .quick-item { display:flex;flex-direction:column;align-items:center;gap:8px;padding:15px 8px;border-radius:16px;background:rgba(167,139,250,.045);border:1px solid rgba(167,139,250,.12);text-decoration:none;transition:all .25s cubic-bezier(.16,1,.3,1);cursor:pointer; }
    .quick-item:hover { background:#fff;border-color:rgba(167,139,250,.32);transform:translateY(-3px);box-shadow:0 10px 26px rgba(167,139,250,.18); }
    .quick-icon { width:36px;height:36px;border-radius:11px;display:flex;align-items:center;justify-content:center; }
    .quick-label { font-size:11px;font-weight:600;color:#4a4458;text-align:center; }
    .reco-item { display:flex;align-items:flex-start;gap:10px;padding:11px;border-radius:14px;background:rgba(167,139,250,.03);border:1px solid rgba(167,139,250,.1);transition:all .2s; }
    .reco-item:hover { border-color:rgba(167,139,250,.26);background:rgba(167,139,250,.06); }
    .reco-item p:first-child { color:#221f2c !important; }
    .reco-dot { width:7px;height:7px;border-radius:50%;background:linear-gradient(135deg,#a78bfa,#fb7299);flex-shrink:0;margin-top:5px; }
    .empty-state { display:flex;flex-direction:column;align-items:center;gap:8px;padding:32px;color:#948da3;text-align:center; }
    .empty-state svg { color:#c4bdd6; }
    .empty-state p { font-size:13px; }
    .gradient-text { background:linear-gradient(135deg,#a78bfa,#fb7299);background-size:200% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;animation:shimmer-flow 5s linear infinite; }
  `],
})
export class StudentDashboard implements OnInit {
  loading  = signal(true);
  enrollments = signal<Enrollment[]>([]);
  recs     = signal<Recommendation[]>([]);

  active = computed(() => this.enrollments().filter(e => !e.completed));

  get firstName() { return (this.auth.user()?.name ?? 'Apprenant').split(' ')[0]; }

  stats = [
    { label: 'Cours actifs',    value: '—', bg: 'rgba(167,139,250,.16)', glow: 'rgba(167,139,250,.22)', svg: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8b6ef2" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>' },
    { label: 'Terminés',        value: '—', bg: 'rgba(110,231,183,.18)', glow: 'rgba(110,231,183,.24)', svg: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1f9d6f" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>' },
    { label: 'Progression moy.', value: '—', bg: 'rgba(251,114,153,.14)', glow: 'rgba(251,114,153,.2)', svg: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fb7299" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>' },
    { label: 'Certificats',     value: '—', bg: 'rgba(245,165,36,.14)',  glow: 'rgba(245,165,36,.2)', svg: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f5a524" stroke-width="2"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg>' },
  ];

  quickActions = [
    { label: 'Progression',  path: '/student/progress',    bg: 'rgba(167,139,250,.14)', svg: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8b6ef2" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>' },
    { label: 'Évaluations',  path: '/student/evaluations', bg: 'rgba(251,114,153,.14)', svg: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fb7299" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>' },
    { label: 'Assistant IA', path: '/student/chat',        bg: 'rgba(245,165,36,.14)',  svg: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f5a524" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>' },
  ];

  catColors: Record<string, string> = {
    'IA': 'linear-gradient(135deg,#a78bfa,#fb7299)',
    'Data': 'linear-gradient(135deg,#fb7299,#ffc7da)',
    'Dev': 'linear-gradient(135deg,#6ee7b7,#a78bfa)',
    'DevOps': 'linear-gradient(135deg,#f5a524,#fb92ae)',
  };
  catColor(cat: string) { return this.catColors[cat] ?? 'linear-gradient(135deg,#a78bfa,#fb7299)'; }

  constructor(public auth: AuthService, private api: ApiService) {}

  ngOnInit() {
    this.api.get<Enrollment[]>('/enrollments/my').subscribe({
      next: (res: any) => {
        const data: Enrollment[] = res?.data ?? [];
        this.enrollments.set(data);
        const completed = data.filter(e => e.completed).length;
        const avg = data.length ? Math.round(data.reduce((s, e) => s + e.progress, 0) / data.length) : 0;
        this.stats[0].value = String(data.filter(e => !e.completed).length);
        this.stats[1].value = String(completed);
        this.stats[2].value = avg + '%';
        this.stats[3].value = String(completed);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });

    this.api.get<any>('/ai/recommend').subscribe({
      next: (res: any) => {
        const list = res?.data?.recommendations ?? [];
        this.recs.set(list.slice(0, 4));
      },
      error: () => {},
    });
  }
}
