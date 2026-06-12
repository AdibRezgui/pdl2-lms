import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { trigger, style, animate, transition, stagger, query } from '@angular/animations';
import { AuthService } from '../../../core/services/auth';
import { ApiService } from '../../../core/services/api';
import { Sidebar } from '../../../shared/sidebar/sidebar';

@Component({
  selector: 'app-trainer-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, Sidebar],
  animations: [
    trigger('fadeUp', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('400ms cubic-bezier(0.23,1,0.32,1)', style({ opacity: 1, transform: 'translateY(0)' })),
      ]),
    ]),
  ],
  template: `
    <div class="shell">
      <app-sidebar [role]="auth.role() ?? ''" [userName]="auth.user()?.name ?? ''" />

      <main class="main-area">
        <header class="topbar">
          <div>
            <h1 class="topbar-title">Espace <span class="gt">Formateur</span></h1>
            <p class="topbar-sub">Gérez vos cours et suivez vos stagiaires</p>
          </div>
          <a routerLink="/trainer/courses/new" class="btn-primary">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Nouveau cours
          </a>
        </header>

        <div class="content">
          <!-- Stats -->
          <div class="stats-row">
            <div class="stat-card" *ngFor="let s of stats">
              <div class="stat-icon" [style.background]="s.bg" [style.boxShadow]="'0 6px 20px '+s.glow">
                <span [innerHTML]="s.svg"></span>
              </div>
              <div>
                <p class="stat-value">{{ s.value }}</p>
                <p class="stat-label">{{ s.label }}</p>
              </div>
            </div>
          </div>

          <div class="two-col">
            <!-- Recent courses -->
            <section @fadeUp class="card p-5">
              <div class="flex items-center justify-between mb-5">
                <h2 class="section-title">Mes cours récents</h2>
                <a routerLink="/trainer/courses" class="text-xs font-semibold underline-draw" style="color:#a78bfa">Voir tout →</a>
              </div>
              <div *ngIf="loading()" class="space-y-3">
                <div *ngFor="let _ of [1,2,3]" class="skeleton h-16 rounded-xl"></div>
              </div>
              <div class="course-list">
                <div class="course-item" *ngFor="let c of courses()">
                  <div class="course-avatar" [style.background]="c.published ? 'linear-gradient(135deg,#a78bfa,#fb7299)' : 'rgba(167,139,250,.18)'">
                    {{ c.title?.charAt(0) ?? 'C' }}
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="course-title">{{ c.title }}</p>
                    <div class="flex items-center gap-2 mt-1">
                      <span class="badge" [class.badge-success]="c.published" [class.badge-warning]="!c.published">
                        {{ c.published ? 'Publié' : 'Brouillon' }}
                      </span>
                      <span class="text-xs" style="color:#948da3">{{ c.studentsCount ?? 0 }} stagiaires</span>
                    </div>
                  </div>
                  <a [routerLink]="'/trainer/courses/' + c.id" class="edit-btn">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  </a>
                </div>
              </div>
            </section>

            <!-- Quick actions -->
            <div class="flex flex-col gap-5">
              <section @fadeUp class="card p-5">
                <h2 class="section-title mb-4">Actions rapides</h2>
                <div class="flex flex-col gap-2">
                  <a *ngFor="let a of actions" [routerLink]="a.path" class="action-row">
                    <div class="action-icon" [style.background]="a.bg"><span [innerHTML]="a.svg"></span></div>
                    <div>
                      <p class="text-sm font-semibold" style="color:#221f2c">{{ a.label }}</p>
                      <p class="text-xs mt-0.5" style="color:#948da3">{{ a.desc }}</p>
                    </div>
                    <svg class="ml-auto" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#c4bdd6" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
                  </a>
                </div>
              </section>

              <section @fadeUp class="card p-5">
                <h2 class="section-title mb-4">Statistiques globales</h2>
                <div class="flex flex-col gap-3">
                  <div *ngFor="let m of metrics" class="metric-row">
                    <span class="text-sm" style="color:#948da3">{{ m.label }}</span>
                    <span class="text-sm font-bold" style="color:#221f2c">{{ m.value }}</span>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      </main>
    </div>
  `,
  styles: [`
    .shell { display:flex;height:100vh;overflow:hidden;background:linear-gradient(160deg,#fffdfb 0%,#fdf2f8 60%,#f6f0ff 100%); }
    .main-area { flex:1;overflow-y:auto;display:flex;flex-direction:column; }
    .topbar { display:flex;align-items:center;justify-content:space-between;padding:22px 30px;border-bottom:1px solid rgba(167,139,250,.12);background:rgba(255,253,251,.78);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);position:sticky;top:0;z-index:10; }
    .topbar-title { font-family:'Fraunces',Georgia,serif;font-size:22px;font-weight:700;color:#221f2c;margin:0;letter-spacing:-.01em; }
    .topbar-sub { font-size:13px;color:#948da3;margin:3px 0 0; }
    .gt { background:linear-gradient(135deg,#a78bfa,#fb7299);background-size:200% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;animation:shimmer-flow 5s linear infinite; }
    .content { padding:26px 30px;display:flex;flex-direction:column;gap:22px; }
    .stats-row { display:grid;grid-template-columns:repeat(4,1fr);gap:16px; }
    @media(max-width:1100px){.stats-row{grid-template-columns:repeat(2,1fr)}}
    .stat-icon { width:44px;height:44px;border-radius:14px;display:flex;align-items:center;justify-content:center;flex-shrink:0; }
    .stat-value { font-size:26px;font-weight:800;color:#221f2c;line-height:1;font-family:'Fraunces',Georgia,serif; }
    .stat-label { font-size:12px;color:#948da3;margin-top:4px; }
    .section-title { font-family:'Fraunces',Georgia,serif;font-weight:700;color:#221f2c; }
    .two-col { display:grid;grid-template-columns:1fr 320px;gap:20px; }
    @media(max-width:900px){.two-col{grid-template-columns:1fr}}
    .course-list { display:flex;flex-direction:column;gap:9px; }
    .course-item { display:flex;align-items:center;gap:12px;padding:12px;border-radius:16px;background:rgba(167,139,250,.045);border:1px solid rgba(167,139,250,.12);transition:all .25s cubic-bezier(.16,1,.3,1); }
    .course-item:hover { border-color:rgba(167,139,250,.32);background:rgba(167,139,250,.08);transform:translateX(2px); }
    .course-avatar { width:38px;height:38px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:800;color:white;flex-shrink:0; }
    .course-title { font-size:13px;font-weight:600;color:#221f2c;overflow:hidden;text-overflow:ellipsis;white-space:nowrap; }
    .edit-btn { width:32px;height:32px;border-radius:11px;background:rgba(167,139,250,.08);border:1px solid rgba(167,139,250,.16);display:flex;align-items:center;justify-content:center;color:#948da3;text-decoration:none;transition:all .22s cubic-bezier(.16,1,.3,1);flex-shrink:0; }
    .edit-btn:hover { background:rgba(167,139,250,.18);border-color:rgba(167,139,250,.4);color:#7c5ce0;transform:scale(1.08); }
    .action-row { display:flex;align-items:center;gap:12px;padding:13px;border-radius:16px;background:rgba(167,139,250,.04);border:1px solid rgba(167,139,250,.1);text-decoration:none;transition:all .25s cubic-bezier(.16,1,.3,1); }
    .action-row:hover { background:rgba(167,139,250,.08);border-color:rgba(167,139,250,.28);transform:translateX(3px); }
    .action-icon { width:36px;height:36px;border-radius:12px;display:flex;align-items:center;justify-content:center;flex-shrink:0; }
    .metric-row { display:flex;align-items:center;justify-content:space-between;padding:10px 14px;border-radius:13px;background:rgba(167,139,250,.04);border:1px solid rgba(167,139,250,.08); }
  `],
})
export class TrainerDashboard implements OnInit {
  loading = signal(true);
  courses = signal<any[]>([]);

  stats = [
    { label: 'Cours publiés',  value: '—', bg: 'rgba(167,139,250,.16)', glow: 'rgba(167,139,250,.22)', svg: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8b6ef2" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>' },
    { label: 'Stagiaires',     value: '—', bg: 'rgba(110,231,183,.18)', glow: 'rgba(110,231,183,.24)', svg: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1f9d6f" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/></svg>' },
    { label: 'Taux complétion', value: '—', bg: 'rgba(251,114,153,.14)', glow: 'rgba(251,114,153,.2)', svg: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fb7299" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>' },
    { label: 'Note moyenne',   value: '—', bg: 'rgba(245,165,36,.14)',  glow: 'rgba(245,165,36,.2)', svg: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f5a524" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>' },
  ];

  actions = [
    { label: 'Créer un cours',       desc: 'Ajouter un nouveau contenu',        path: '/trainer/courses/new', bg: 'rgba(167,139,250,.14)', svg: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#8b6ef2" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>' },
    { label: 'Générer une évaluation',desc: 'IA génère les questions',          path: '/trainer/evaluations',  bg: 'rgba(251,114,153,.14)', svg: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fb7299" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/></svg>' },
    { label: 'Voir les analytics',   desc: 'Statistiques de vos cours',         path: '/trainer/analytics',    bg: 'rgba(245,165,36,.14)',  svg: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#f5a524" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>' },
  ];

  metrics: { label: string; value: string }[] = [];

  constructor(public auth: AuthService, private api: ApiService) {}

  ngOnInit() {
    this.api.get<any>('/trainer/analytics').subscribe({
      next: (res: any) => {
        const d = res ?? {};
        this.stats[0].value = String(d.totalCourses ?? 0);
        this.stats[1].value = String(d.totalStudents ?? 0);
        this.stats[2].value = (d.avgCompletionRate ?? 0) + '%';
        this.stats[3].value = (d.avgRating ?? 0).toFixed(1);
        this.metrics = [
          { label: 'Quiz publiés', value: String(d.totalQuizzes ?? 0) },
          { label: 'Tentatives quiz', value: String(d.totalAttempts ?? 0) },
          { label: 'Avis reçus', value: String(d.totalReviews ?? 0) },
        ];
      },
      error: () => {},
    });

    this.api.get<any[]>('/courses/my').subscribe({
      next: (res: any) => { this.courses.set((res ?? []).slice(0, 5)); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }
}
