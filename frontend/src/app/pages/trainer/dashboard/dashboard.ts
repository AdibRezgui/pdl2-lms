import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth';
import { ApiService } from '../../../core/services/api';
import { Sidebar } from '../../../shared/sidebar/sidebar';
import { AnimatedTextComponent } from '../../../shared/animated-text/animated-text';

interface AnalyticsData {
  totalStudents: number; totalCourses: number; publishedCourses: number;
  avgRating: number; totalHours: number; totalQuizAttempts: number;
  courseStats: { id: string; title: string; studentsCount: number; avgProgress: number; completedCount: number; published: boolean }[];
}
interface CourseItem { id: string; title: string; published: boolean; studentsCount: number; }
interface QuizStat  { id: string; avgScore: number; attemptsCount: number; passedCount: number; }

@Component({
  selector: 'app-trainer-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, Sidebar, AnimatedTextComponent],
  template: `
    <div class="shell">
      <app-sidebar [role]="auth.role() ?? ''" [userName]="auth.user()?.name ?? ''" />

      <main class="main">

        <!-- Top bar -->
        <header class="topbar">
          <app-animated-text
            prefix="Espace "
            name="Formateur"
            subtitle="Gérez vos cours et suivez vos stagiaires" />
          <a routerLink="/trainer/courses/new" class="btn-new">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Nouveau cours
          </a>
        </header>

        <div class="content">

          <!-- KPI Row -->
          <div class="kpi-row">

            <div class="kpi" [class.kpi-loading]="loading()">
              <div class="kpi-left">
                <div class="kpi-icon" style="background:rgba(0,180,198,.12)">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#0099AE" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
                </div>
                <div>
                  <p class="kpi-label">Cours publiés</p>
                  <p class="kpi-val" style="color:#0099AE">{{ loading() ? '—' : analytics()?.publishedCourses ?? 0 }}</p>
                </div>
              </div>
              <p class="kpi-total">/ {{ analytics()?.totalCourses ?? 0 }} total</p>
            </div>

            <div class="kpi" [class.kpi-loading]="loading()">
              <div class="kpi-left">
                <div class="kpi-icon" style="background:rgba(110,231,183,.12)">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#1f9d6f" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                </div>
                <div>
                  <p class="kpi-label">Stagiaires</p>
                  <p class="kpi-val" style="color:#1f9d6f">{{ loading() ? '—' : analytics()?.totalStudents ?? 0 }}</p>
                </div>
              </div>
              <p class="kpi-total">inscrits</p>
            </div>

            <div class="kpi" [class.kpi-loading]="loadingQuiz()">
              <div class="kpi-left">
                <div class="kpi-icon" style="background:rgba(124,58,237,.1)">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                </div>
                <div>
                  <p class="kpi-label">Score quiz moyen</p>
                  <p class="kpi-val" style="color:#7c3aed">{{ loadingQuiz() ? '—' : globalAvgScore() + '%' }}</p>
                </div>
              </div>
              <p class="kpi-total">{{ analytics()?.totalQuizAttempts ?? 0 }} tentatives</p>
            </div>

            <div class="kpi" [class.kpi-loading]="loading()">
              <div class="kpi-left">
                <div class="kpi-icon" style="background:rgba(245,165,36,.12)">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#e08a10" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                </div>
                <div>
                  <p class="kpi-label">Note moyenne</p>
                  <p class="kpi-val" style="color:#e08a10">{{ loading() ? '—' : (analytics()?.avgRating ?? 0).toFixed(1) }}</p>
                </div>
              </div>
              <div class="stars-mini">
                <svg *ngFor="let i of [0,1,2,3,4]" width="10" height="10" viewBox="0 0 24 24"
                  [attr.fill]="(analytics()?.avgRating ?? 0) > i ? '#f5a524' : 'none'"
                  [attr.stroke]="(analytics()?.avgRating ?? 0) > i ? '#f5a524' : '#d4d4d8'" stroke-width="1.5">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                </svg>
              </div>
            </div>

          </div>

          <!-- Main grid -->
          <div class="main-grid">

            <!-- Recent courses -->
            <section class="card">
              <div class="card-head">
                <h2 class="card-title">Mes cours récents</h2>
                <a routerLink="/trainer/courses" class="link-see-all">Voir tout →</a>
              </div>

              <div *ngIf="loadingCourses()" class="skel-list">
                <div *ngFor="let _ of [1,2,3]" class="skeleton" style="height:62px;border-radius:14px"></div>
              </div>

              <div *ngIf="!loadingCourses() && courses().length === 0" class="empty">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#c0d0da" stroke-width="1.5"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
                <p>Aucun cours créé</p>
                <a routerLink="/trainer/courses/new" class="btn-create">Créer mon premier cours</a>
              </div>

              <div *ngIf="!loadingCourses()" class="course-list">
                <a *ngFor="let c of courses()" [routerLink]="'/trainer/courses/' + c.id" class="course-item">
                  <div class="c-avatar" [style.background]="c.published ? 'linear-gradient(135deg,#00B4C6,#0099AE)' : 'linear-gradient(135deg,#94a3b8,#64748b)'">
                    {{ c.title?.charAt(0)?.toUpperCase() ?? 'C' }}
                  </div>
                  <div class="c-body">
                    <div class="c-top">
                      <p class="c-title">{{ c.title }}</p>
                      <span class="c-badge" [class.c-published]="c.published" [class.c-draft]="!c.published">
                        {{ c.published ? 'Publié' : 'Brouillon' }}
                      </span>
                    </div>
                    <div class="c-meta">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                      <span>{{ c.studentsCount ?? 0 }} stagiaires</span>
                      <span *ngIf="courseProgress(c.id) !== null" class="c-progress-label">
                        · {{ courseProgress(c.id) }}% progression moy.
                      </span>
                    </div>
                    <div *ngIf="courseProgress(c.id) !== null" class="c-bar-wrap">
                      <div class="c-bar">
                        <div class="c-bar-fill" [style.width.%]="courseProgress(c.id)"
                          [style.background]="(courseProgress(c.id) ?? 0) >= 60 ? 'linear-gradient(90deg,#6ee7b7,#1f9d6f)' : (courseProgress(c.id) ?? 0) >= 30 ? 'linear-gradient(90deg,#fde68a,#f5a524)' : 'linear-gradient(90deg,#fda4af,#f25c78)'">
                        </div>
                      </div>
                    </div>
                  </div>
                  <svg class="c-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#c0d0da" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
                </a>
              </div>
            </section>

            <!-- Right column -->
            <div class="right-col">

              <!-- Quick actions -->
              <section class="card">
                <h2 class="card-title mb-4">Actions rapides</h2>
                <div class="actions-grid">
                  <a routerLink="/trainer/courses/new" class="action-tile" style="--ac:#00B4C6">
                    <div class="action-icon" style="background:rgba(0,180,198,.12)">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0099AE" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    </div>
                    <span>Créer</span>
                  </a>
                  <a routerLink="/trainer/evaluations" class="action-tile" style="--ac:#7c3aed">
                    <div class="action-icon" style="background:rgba(124,58,237,.1)">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                    </div>
                    <span>Évaluations</span>
                  </a>
                  <a routerLink="/trainer/analytics" class="action-tile" style="--ac:#e08a10">
                    <div class="action-icon" style="background:rgba(245,165,36,.1)">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#e08a10" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
                    </div>
                    <span>Analytics</span>
                  </a>
                  <a routerLink="/trainer/students" class="action-tile" style="--ac:#1f9d6f">
                    <div class="action-icon" style="background:rgba(110,231,183,.12)">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1f9d6f" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                    </div>
                    <span>Étudiants</span>
                  </a>
                </div>
              </section>

              <!-- Real stats -->
              <section class="card">
                <h2 class="card-title mb-4">Statistiques globales</h2>

                <div *ngIf="loading() || loadingQuiz()" class="skel-list">
                  <div *ngFor="let _ of [1,2,3,4]" class="skeleton" style="height:38px;border-radius:10px"></div>
                </div>

                <div *ngIf="!loading() && !loadingQuiz()" class="stat-list">
                  <div class="stat-row">
                    <div class="stat-dot" style="background:#0099AE"></div>
                    <span class="stat-lbl">Tentatives quiz</span>
                    <span class="stat-val" style="color:#0099AE">{{ analytics()?.totalQuizAttempts ?? 0 }}</span>
                  </div>
                  <div class="stat-row">
                    <div class="stat-dot" style="background:#7c3aed"></div>
                    <span class="stat-lbl">Quiz créés</span>
                    <span class="stat-val" style="color:#7c3aed">{{ quizStats().length }}</span>
                  </div>
                  <div class="stat-row">
                    <div class="stat-dot" style="background:#1f9d6f"></div>
                    <span class="stat-lbl">Taux complétion global</span>
                    <span class="stat-val" style="color:#1f9d6f">{{ globalCompletionRate() }}%</span>
                  </div>
                  <div class="stat-row">
                    <div class="stat-dot" style="background:#e08a10"></div>
                    <span class="stat-lbl">Heures de contenu</span>
                    <span class="stat-val" style="color:#e08a10">{{ analytics()?.totalHours ?? 0 }}h</span>
                  </div>
                </div>

                <!-- Completion bar -->
                <div *ngIf="!loading()" class="completion-wrap">
                  <div class="bar-track" style="height:8px;margin-top:4px">
                    <div class="bar-fill" style="height:8px;transition:width .8s cubic-bezier(.16,1,.3,1)"
                      [style.width.%]="globalCompletionRate()"
                      [style.background]="globalCompletionRate() >= 60 ? 'linear-gradient(90deg,#6ee7b7,#1f9d6f)' : globalCompletionRate() >= 30 ? 'linear-gradient(90deg,#fde68a,#f5a524)' : 'linear-gradient(90deg,#fda4af,#f25c78)'">
                    </div>
                  </div>
                  <p class="completion-label">Taux de complétion moyen de vos cours</p>
                </div>
              </section>

            </div>
          </div>
        </div>
      </main>
    </div>
  `,
  styles: [`
    .shell { display:flex; height:100vh; overflow:hidden; background:linear-gradient(160deg,#f5fdfe 0%,#edf9fb 60%,#daf2f6 100%); }
    .main  { flex:1; overflow-y:auto; display:flex; flex-direction:column; }

    /* Topbar */
    .topbar { display:flex; align-items:center; justify-content:space-between; padding:20px 30px; border-bottom:1px solid rgba(0,180,198,.1); background:rgba(255,253,251,.85); backdrop-filter:blur(20px); -webkit-backdrop-filter:blur(20px); position:sticky; top:0; z-index:10; }
    .btn-new { display:flex; align-items:center; gap:8px; padding:10px 20px; border-radius:12px; background:linear-gradient(135deg,#00B4C6,#0099AE); color:white; font-size:13px; font-weight:600; text-decoration:none; transition:all .2s ease; box-shadow:0 4px 14px rgba(0,180,198,.3); }
    .btn-new:hover { transform:translateY(-1px); box-shadow:0 6px 20px rgba(0,180,198,.4); }

    /* Content */
    .content { padding:26px 30px; display:flex; flex-direction:column; gap:20px; }

    /* KPI Row */
    .kpi-row { display:grid; grid-template-columns:repeat(4,1fr); gap:14px; }
    @media(max-width:1100px){ .kpi-row { grid-template-columns:repeat(2,1fr); } }
    .kpi { background:white; border:1px solid rgba(0,180,198,.12); border-radius:18px; padding:18px 20px; display:flex; align-items:center; justify-content:space-between; box-shadow:0 2px 12px rgba(0,180,198,.06); transition:transform .2s ease, box-shadow .2s ease; }
    .kpi:hover { transform:translateY(-2px); box-shadow:0 6px 24px rgba(0,180,198,.12); }
    .kpi-loading { opacity:.6; pointer-events:none; }
    .kpi-left { display:flex; align-items:center; gap:13px; }
    .kpi-icon { width:40px; height:40px; border-radius:12px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
    .kpi-label { font-size:11px; color:#5a7a8a; text-transform:uppercase; letter-spacing:.05em; margin-bottom:3px; }
    .kpi-val  { font-size:26px; font-weight:800; line-height:1; font-family:'Fraunces',Georgia,serif; }
    .kpi-total { font-size:11px; color:#94a3b8; text-align:right; }
    .stars-mini { display:flex; gap:2px; }

    /* Main grid */
    .main-grid { display:grid; grid-template-columns:1fr 308px; gap:18px; }
    @media(max-width:900px){ .main-grid { grid-template-columns:1fr; } }
    .right-col { display:flex; flex-direction:column; gap:18px; }

    /* Card */
    .card { background:white; border:1px solid rgba(0,180,198,.1); border-radius:20px; padding:22px; box-shadow:0 2px 14px rgba(0,180,198,.06); }
    .card-head { display:flex; align-items:center; justify-content:space-between; margin-bottom:18px; }
    .card-title { font-family:'Fraunces',Georgia,serif; font-size:15px; font-weight:700; color:#1a2d3a; }
    .link-see-all { font-size:12px; font-weight:600; color:#0099AE; text-decoration:none; transition:opacity .15s; }
    .link-see-all:hover { opacity:.75; }
    .mb-4 { margin-bottom:16px; }

    /* Course list */
    .course-list { display:flex; flex-direction:column; gap:8px; }
    .course-item { display:flex; align-items:center; gap:12px; padding:12px 14px; border-radius:14px; background:rgba(0,180,198,.03); border:1px solid rgba(0,180,198,.1); text-decoration:none; transition:all .22s ease; cursor:pointer; }
    .course-item:hover { background:rgba(0,180,198,.07); border-color:rgba(0,180,198,.25); transform:translateX(2px); }
    .c-avatar { width:36px; height:36px; border-radius:11px; display:flex; align-items:center; justify-content:center; font-size:13px; font-weight:800; color:white; flex-shrink:0; }
    .c-body  { flex:1; min-width:0; }
    .c-top   { display:flex; align-items:center; gap:8px; margin-bottom:3px; }
    .c-title { font-size:13px; font-weight:600; color:#1a2d3a; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; flex:1; }
    .c-badge { font-size:10px; padding:2px 8px; border-radius:999px; font-weight:600; flex-shrink:0; }
    .c-published { background:rgba(110,231,183,.18); color:#1f9d6f; }
    .c-draft     { background:rgba(148,163,184,.12); color:#64748b; }
    .c-meta  { display:flex; align-items:center; gap:4px; font-size:11px; color:#94a3b8; }
    .c-progress-label { color:#94a3b8; }
    .c-bar-wrap { margin-top:5px; }
    .c-bar   { height:4px; background:rgba(0,0,0,.06); border-radius:99px; overflow:hidden; }
    .c-bar-fill { height:100%; border-radius:99px; transition:width .6s ease; }
    .c-arrow { flex-shrink:0; opacity:0; transition:opacity .2s; }
    .course-item:hover .c-arrow { opacity:1; }

    /* Empty state */
    .empty { display:flex; flex-direction:column; align-items:center; gap:10px; padding:32px 0; color:#94a3b8; font-size:13px; }
    .btn-create { font-size:12px; padding:8px 16px; border-radius:10px; background:rgba(0,180,198,.1); color:#0099AE; text-decoration:none; font-weight:600; transition:background .2s; }
    .btn-create:hover { background:rgba(0,180,198,.18); }

    /* Quick actions */
    .actions-grid { display:grid; grid-template-columns:1fr 1fr; gap:8px; }
    .action-tile { display:flex; align-items:center; gap:10px; padding:11px 13px; border-radius:13px; background:rgba(0,0,0,.02); border:1px solid rgba(0,0,0,.06); text-decoration:none; font-size:12px; font-weight:600; color:#1a2d3a; transition:all .2s ease; cursor:pointer; }
    .action-tile:hover { background:rgba(var(--ac),.06); border-color:rgba(var(--ac),.2); transform:translateY(-1px); }
    .action-icon { width:30px; height:30px; border-radius:9px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }

    /* Stat list */
    .stat-list { display:flex; flex-direction:column; gap:8px; }
    .stat-row  { display:flex; align-items:center; gap:10px; padding:9px 12px; border-radius:11px; background:rgba(0,0,0,.02); }
    .stat-dot  { width:7px; height:7px; border-radius:50%; flex-shrink:0; }
    .stat-lbl  { flex:1; font-size:12px; color:#5a7a8a; }
    .stat-val  { font-size:14px; font-weight:700; }
    .completion-wrap { margin-top:14px; }
    .completion-label { font-size:11px; color:#94a3b8; margin-top:5px; }

    /* Progress bars */
    .bar-track { background:rgba(0,0,0,.06); border-radius:99px; overflow:hidden; }
    .bar-fill  { border-radius:99px; }

    /* Skeleton */
    .skel-list { display:flex; flex-direction:column; gap:8px; }
    .skeleton  { background:linear-gradient(90deg,rgba(0,180,198,.06) 25%,rgba(0,180,198,.1) 50%,rgba(0,180,198,.06) 75%); background-size:200%; animation:shimmer 1.4s infinite; }
    @keyframes shimmer { 0%{background-position:200%} 100%{background-position:-200%} }
  `],
})
export class TrainerDashboard implements OnInit {
  loading       = signal(true);
  loadingCourses= signal(true);
  loadingQuiz   = signal(true);

  analytics = signal<AnalyticsData | null>(null);
  courses   = signal<CourseItem[]>([]);
  quizStats = signal<QuizStat[]>([]);

  globalAvgScore = computed(() => {
    const qs = this.quizStats();
    if (!qs.length) return 0;
    const total = qs.reduce((s, q) => s + q.avgScore * q.attemptsCount, 0);
    const att   = qs.reduce((s, q) => s + q.attemptsCount, 0);
    return att > 0 ? Math.round(total / att) : Math.round(qs.reduce((s, q) => s + q.avgScore, 0) / qs.length);
  });

  globalCompletionRate = computed(() => {
    const stats = this.analytics()?.courseStats ?? [];
    const withStudents = stats.filter(c => c.studentsCount > 0);
    if (!withStudents.length) return 0;
    const total = withStudents.reduce((s, c) => s + Math.round((c.completedCount / c.studentsCount) * 100), 0);
    return Math.round(total / withStudents.length);
  });

  courseProgress(courseId: string): number | null {
    const stat = this.analytics()?.courseStats?.find(c => c.id === courseId);
    return stat ? stat.avgProgress : null;
  }

  constructor(public auth: AuthService, private api: ApiService) {}

  ngOnInit() {
    this.api.get<AnalyticsData>('/trainer/analytics').subscribe({
      next: data => { this.analytics.set(data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });

    this.api.get<CourseItem[]>('/courses/my').subscribe({
      next: res => { this.courses.set((res ?? []).slice(0, 5)); this.loadingCourses.set(false); },
      error: () => this.loadingCourses.set(false),
    });

    this.api.get<QuizStat[]>('/trainer/quizzes').subscribe({
      next: data => { this.quizStats.set(data ?? []); this.loadingQuiz.set(false); },
      error: () => this.loadingQuiz.set(false),
    });
  }
}
