import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth';
import { ApiService } from '../../../core/services/api';
import { Sidebar } from '../../../shared/sidebar/sidebar';

interface CourseStatItem {
  id: string; title: string; studentsCount: number; avgProgress: number;
  completedCount: number; published: boolean; rating: number; durationHours: number;
}
interface AnalyticsData {
  totalStudents: number; totalCourses: number; publishedCourses: number;
  avgRating: number; totalHours: number; totalQuizAttempts: number;
  courseStats: CourseStatItem[];
}
interface QuizStat {
  id: string; title: string; courseTitle: string; attemptsCount: number;
  avgScore: number; passedCount: number; questionsCount: number; passingScore: number;
}
interface StudentData {
  id: string; name: string; email: string; avgProgress: number; coursesCount: number;
  enrollments: { courseId: string; courseTitle: string; progress: number; completed: boolean; lastAccessedAt: string | null }[];
}

@Component({
  selector: 'app-trainer-analytics',
  standalone: true,
  imports: [CommonModule, Sidebar],
  template: `
    <div class="shell">
      <app-sidebar [role]="role" [userName]="userName"></app-sidebar>
      <main class="main">

        <!-- Header -->
        <div class="page-header reveal">
          <div>
            <h1 class="page-title">Analytics</h1>
            <p class="page-sub">Performance réelle de vos formations</p>
          </div>
          <div class="last-update">
            <div class="pulse-dot"></div>
            <span>Données en direct</span>
          </div>
        </div>

        <!-- KPI Cards -->
        <div class="kpi-grid reveal stagger-1">
          <div class="kpi-card">
            <div class="kpi-icon" style="background:linear-gradient(135deg,#00B4C6,#0099AE)">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            </div>
            <div>
              <p class="kpi-label">Stagiaires inscrits</p>
              <p class="kpi-value" style="color:#0099AE">{{ loading() ? '—' : (analytics()?.totalStudents ?? 0) }}</p>
            </div>
          </div>

          <div class="kpi-card">
            <div class="kpi-icon" style="background:linear-gradient(135deg,#a78bfa,#7c3aed)">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
            </div>
            <div>
              <p class="kpi-label">Cours publiés</p>
              <p class="kpi-value" style="color:#7c3aed">
                {{ loading() ? '—' : (analytics()?.publishedCourses ?? 0) }}
                <span class="kpi-sub">/ {{ analytics()?.totalCourses ?? 0 }}</span>
              </p>
            </div>
          </div>

          <div class="kpi-card">
            <div class="kpi-icon" style="background:linear-gradient(135deg,#f5a524,#e08a10)">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            </div>
            <div>
              <p class="kpi-label">Score quiz moyen</p>
              <p class="kpi-value" style="color:#e08a10">{{ loadingQuiz() ? '—' : (globalAvgScore() + '%') }}</p>
            </div>
          </div>

          <div class="kpi-card">
            <div class="kpi-icon" style="background:linear-gradient(135deg,#6ee7b7,#1f9d6f)">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
            </div>
            <div>
              <p class="kpi-label">Taux de complétion moyen</p>
              <p class="kpi-value" style="color:#1f9d6f">{{ loading() ? '—' : (globalCompletionRate() + '%') }}</p>
            </div>
          </div>

          <div class="kpi-card">
            <div class="kpi-icon" style="background:linear-gradient(135deg,#f9a8d4,#ec4899)">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            </div>
            <div>
              <p class="kpi-label">Heures de contenu</p>
              <p class="kpi-value" style="color:#ec4899">{{ loading() ? '—' : (analytics()?.totalHours ?? 0) + 'h' }}</p>
            </div>
          </div>

          <div class="kpi-card">
            <div class="kpi-icon" style="background:linear-gradient(135deg,#7dd3fc,#0284c7)">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
            </div>
            <div>
              <p class="kpi-label">Tentatives quiz totales</p>
              <p class="kpi-value" style="color:#0284c7">{{ loading() ? '—' : (analytics()?.totalQuizAttempts ?? 0) }}</p>
            </div>
          </div>
        </div>

        <!-- Course Progress + Quiz Performance -->
        <div class="two-col reveal stagger-2">

          <!-- Course Progress -->
          <div class="card section-card">
            <div class="section-head">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0099AE" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
              <h2 class="section-title">Progression par cours</h2>
            </div>

            <div *ngIf="loading()" class="skeleton-list">
              <div *ngFor="let _ of [1,2,3,4]" class="skeleton" style="height:56px;border-radius:12px"></div>
            </div>

            <div *ngIf="!loading() && courseStats().length === 0" class="empty-state">
              Aucun cours publié pour le moment
            </div>

            <div *ngIf="!loading()" class="course-list">
              <div *ngFor="let c of courseStats()" class="course-row">
                <div class="course-row-top">
                  <div class="course-title-wrap">
                    <div class="course-dot" [style.background]="c.published ? '#1f9d6f' : '#94a3b8'"></div>
                    <span class="course-name">{{ c.title }}</span>
                  </div>
                  <div class="course-meta-right">
                    <span class="badge-students">{{ c.studentsCount }} stagiaires</span>
                    <span class="badge-completed">{{ c.completedCount }} terminé(s)</span>
                    <span class="course-pct" [style.color]="c.avgProgress >= 60 ? '#1f9d6f' : c.avgProgress >= 30 ? '#e08a10' : '#f25c78'">
                      {{ c.avgProgress }}%
                    </span>
                  </div>
                </div>
                <div class="bar-track">
                  <div class="bar-fill"
                    [style.width.%]="c.avgProgress"
                    [style.background]="c.avgProgress >= 60 ? 'linear-gradient(90deg,#6ee7b7,#1f9d6f)' : c.avgProgress >= 30 ? 'linear-gradient(90deg,#fde68a,#f5a524)' : 'linear-gradient(90deg,#fda4af,#f25c78)'">
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Quiz Performance -->
          <div class="card section-card">
            <div class="section-head">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              <h2 class="section-title">Performance des quiz</h2>
            </div>

            <div *ngIf="loadingQuiz()" class="skeleton-list">
              <div *ngFor="let _ of [1,2,3]" class="skeleton" style="height:60px;border-radius:12px"></div>
            </div>

            <div *ngIf="!loadingQuiz() && quizStats().length === 0" class="empty-state">
              Aucun quiz créé pour le moment
            </div>

            <div *ngIf="!loadingQuiz()" class="quiz-list">
              <div *ngFor="let q of quizStats()" class="quiz-row">
                <div class="quiz-row-head">
                  <div>
                    <p class="quiz-name">{{ q.title }}</p>
                    <p class="quiz-course">{{ q.courseTitle }}</p>
                  </div>
                  <div class="quiz-badges">
                    <span class="chip chip-blue">{{ q.attemptsCount }} tentatives</span>
                    <span class="chip" [class.chip-green]="passRate(q) >= 60" [class.chip-red]="passRate(q) < 60">
                      {{ passRate(q) }}% réussite
                    </span>
                  </div>
                </div>
                <div class="quiz-score-row">
                  <span class="score-label">Score moy.</span>
                  <div class="bar-track" style="flex:1">
                    <div class="bar-fill"
                      [style.width.%]="q.avgScore"
                      [style.background]="q.avgScore >= 70 ? 'linear-gradient(90deg,#a78bfa,#7c3aed)' : 'linear-gradient(90deg,#fda4af,#f25c78)'">
                    </div>
                  </div>
                  <span class="score-value" [style.color]="q.avgScore >= 70 ? '#7c3aed' : '#f25c78'">{{ q.avgScore }}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Students Table -->
        <div class="card reveal stagger-3" style="margin-bottom:24px">
          <div class="section-head" style="padding:20px 20px 0">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0099AE" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
            <h2 class="section-title">Stagiaires</h2>
            <div style="margin-left:auto;display:flex;gap:8px">
              <span class="chip chip-green">{{ topStudents().length }} actifs</span>
              <span *ngIf="strugglingStudents().length > 0" class="chip chip-red">{{ strugglingStudents().length }} en difficulté</span>
            </div>
          </div>

          <div *ngIf="loadingStudents()" class="p-5">
            <div *ngFor="let _ of [1,2,3,4]" class="skeleton" style="height:48px;border-radius:10px;margin-bottom:8px"></div>
          </div>

          <div *ngIf="!loadingStudents() && students().length === 0" class="empty-state p-8">
            Aucun stagiaire inscrit pour le moment
          </div>

          <table *ngIf="!loadingStudents() && students().length > 0" class="data-table w-full" style="margin-top:12px">
            <thead>
              <tr>
                <th class="text-left p-3 font-medium" style="color:#5a7a8a;font-size:11px;text-transform:uppercase;letter-spacing:.05em">Stagiaire</th>
                <th class="text-left p-3 font-medium" style="color:#5a7a8a;font-size:11px;text-transform:uppercase;letter-spacing:.05em">Cours</th>
                <th class="text-left p-3 font-medium" style="color:#5a7a8a;font-size:11px;text-transform:uppercase;letter-spacing:.05em">Progression moy.</th>
                <th class="text-left p-3 font-medium" style="color:#5a7a8a;font-size:11px;text-transform:uppercase;letter-spacing:.05em">Statut</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let s of displayedStudents()" class="student-row">
                <td class="p-3">
                  <div class="student-id">
                    <div class="avatar" [style.background]="avatarGradient(s.avgProgress)">{{ s.name.charAt(0).toUpperCase() }}</div>
                    <div>
                      <p class="student-name">{{ s.name }}</p>
                      <p class="student-email">{{ s.email }}</p>
                    </div>
                  </div>
                </td>
                <td class="p-3 text-sm" style="color:#5a7a8a">{{ s.coursesCount }} cours</td>
                <td class="p-3">
                  <div class="prog-row">
                    <div class="bar-track" style="width:96px">
                      <div class="bar-fill"
                        [style.width.%]="s.avgProgress"
                        [style.background]="s.avgProgress >= 60 ? 'linear-gradient(90deg,#6ee7b7,#1f9d6f)' : s.avgProgress >= 30 ? 'linear-gradient(90deg,#fde68a,#f5a524)' : 'linear-gradient(90deg,#fda4af,#f25c78)'">
                      </div>
                    </div>
                    <span class="prog-pct" [style.color]="s.avgProgress >= 60 ? '#1f9d6f' : s.avgProgress >= 30 ? '#e08a10' : '#f25c78'">
                      {{ s.avgProgress }}%
                    </span>
                  </div>
                </td>
                <td class="p-3">
                  <span class="status-badge"
                    [style.background]="s.avgProgress >= 60 ? 'rgba(110,231,183,.15)' : s.avgProgress >= 30 ? 'rgba(245,165,36,.12)' : 'rgba(242,92,120,.1)'"
                    [style.color]="s.avgProgress >= 60 ? '#1f9d6f' : s.avgProgress >= 30 ? '#e08a10' : '#f25c78'">
                    {{ statusLabel(s.avgProgress) }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
          <div *ngIf="!loadingStudents() && students().length > 6" class="show-more-row">
            <button class="show-more-btn" (click)="showAll.set(!showAll())">
              {{ showAll() ? 'Réduire' : 'Voir tous les ' + students().length + ' stagiaires' }}
            </button>
          </div>
        </div>

        <!-- Insights section (real computed, no fake AI label) -->
        <div class="card reveal stagger-4" style="margin-bottom:32px" *ngIf="!loading() && !loadingStudents() && !loadingQuiz()">
          <div class="section-head" style="padding:20px 20px 0">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0284c7" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <h2 class="section-title">Insights</h2>
          </div>
          <div class="insights-grid">
            <div *ngFor="let ins of insights()" class="insight-tile" [style.border-color]="ins.color + '44'" [style.background]="ins.color + '0d'">
              <div class="ins-icon" [style.background]="ins.color + '22'" [style.color]="ins.color">
                <span [innerHTML]="ins.icon"></span>
              </div>
              <div>
                <p class="ins-label">{{ ins.label }}</p>
                <p class="ins-value" [style.color]="ins.color">{{ ins.value }}</p>
                <p class="ins-detail">{{ ins.detail }}</p>
              </div>
            </div>
          </div>
        </div>

      </main>
    </div>
  `,
  styles: [`
    .shell { display:flex; height:100vh; overflow:hidden; background:linear-gradient(160deg,#f5fdfe 0%,#edf9fb 60%,#daf2f6 100%); }
    .main  { flex:1; overflow-y:auto; padding:28px; }

    /* Header */
    .page-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:28px; }
    .page-title  { font-size:22px; font-weight:700; color:#1a2d3a; }
    .page-sub    { font-size:13px; color:#5a7a8a; margin-top:2px; }
    .last-update { display:flex; align-items:center; gap:8px; font-size:12px; color:#5a7a8a; background:white; border:1px solid rgba(0,180,198,.15); border-radius:20px; padding:6px 14px; }
    .pulse-dot   { width:7px; height:7px; border-radius:50%; background:#1f9d6f; box-shadow:0 0 0 0 rgba(31,157,111,.4); animation:pulse 2s infinite; }
    @keyframes pulse { 0%{box-shadow:0 0 0 0 rgba(31,157,111,.4)} 70%{box-shadow:0 0 0 6px rgba(31,157,111,0)} 100%{box-shadow:0 0 0 0 rgba(31,157,111,0)} }

    /* KPI Grid */
    .kpi-grid  { display:grid; grid-template-columns:repeat(3,1fr); gap:14px; margin-bottom:24px; }
    .kpi-card  { background:white; border-radius:18px; border:1px solid rgba(0,180,198,.12); padding:18px 20px; display:flex; align-items:center; gap:16px; box-shadow:0 2px 12px rgba(0,180,198,.06); transition:transform .2s,box-shadow .2s; cursor:default; }
    .kpi-card:hover { transform:translateY(-2px); box-shadow:0 6px 24px rgba(0,180,198,.12); }
    .kpi-icon  { width:44px; height:44px; border-radius:14px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
    .kpi-label { font-size:11px; color:#5a7a8a; text-transform:uppercase; letter-spacing:.05em; margin-bottom:4px; }
    .kpi-value { font-size:26px; font-weight:700; line-height:1; }
    .kpi-sub   { font-size:14px; font-weight:400; color:#94a3b8; }

    /* Two col */
    .two-col { display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:24px; }

    /* Section card */
    .section-card { padding:20px; min-height:280px; }
    .section-head { display:flex; align-items:center; gap:8px; margin-bottom:16px; }
    .section-title{ font-size:13px; font-weight:700; color:#1a2d3a; }

    /* Course list */
    .course-list { display:flex; flex-direction:column; gap:12px; }
    .course-row  { }
    .course-row-top { display:flex; align-items:center; justify-content:space-between; margin-bottom:5px; }
    .course-title-wrap { display:flex; align-items:center; gap:8px; min-width:0; }
    .course-dot  { width:7px; height:7px; border-radius:50%; flex-shrink:0; }
    .course-name { font-size:13px; font-weight:600; color:#1a2d3a; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:220px; }
    .course-meta-right { display:flex; align-items:center; gap:8px; flex-shrink:0; }
    .badge-students { font-size:10px; color:#5a7a8a; background:rgba(0,180,198,.08); border-radius:20px; padding:2px 8px; }
    .badge-completed{ font-size:10px; color:#1f9d6f; background:rgba(110,231,183,.12); border-radius:20px; padding:2px 8px; }
    .course-pct { font-size:13px; font-weight:700; min-width:36px; text-align:right; }

    /* Quiz list */
    .quiz-list { display:flex; flex-direction:column; gap:14px; }
    .quiz-row  { background:rgba(0,180,198,.04); border-radius:12px; padding:12px; }
    .quiz-row-head { display:flex; align-items:flex-start; justify-content:space-between; gap:8px; margin-bottom:8px; }
    .quiz-name { font-size:13px; font-weight:600; color:#1a2d3a; }
    .quiz-course { font-size:11px; color:#5a7a8a; margin-top:1px; }
    .quiz-badges { display:flex; gap:6px; flex-shrink:0; }
    .quiz-score-row { display:flex; align-items:center; gap:8px; }
    .score-label { font-size:11px; color:#5a7a8a; min-width:60px; }
    .score-value { font-size:12px; font-weight:700; min-width:36px; text-align:right; }

    /* Progress bars */
    .bar-track { height:6px; background:rgba(0,0,0,.06); border-radius:99px; overflow:hidden; }
    .bar-fill  { height:100%; border-radius:99px; transition:width .6s ease; }
    .prog-row  { display:flex; align-items:center; gap:8px; }
    .prog-pct  { font-size:12px; font-weight:700; min-width:32px; }

    /* Chips */
    .chip       { font-size:10px; padding:3px 9px; border-radius:999px; font-weight:600; }
    .chip-blue  { background:rgba(2,132,199,.1); color:#0284c7; }
    .chip-green { background:rgba(110,231,183,.15); color:#1f9d6f; }
    .chip-red   { background:rgba(242,92,120,.1); color:#f25c78; }

    /* Students table */
    .student-row:hover { background:rgba(0,180,198,.03); }
    .student-id  { display:flex; align-items:center; gap:10px; }
    .avatar      { width:32px; height:32px; border-radius:10px; display:flex; align-items:center; justify-content:center; font-size:13px; font-weight:800; color:white; flex-shrink:0; }
    .student-name  { font-size:13px; font-weight:600; color:#1a2d3a; }
    .student-email { font-size:11px; color:#5a7a8a; }
    .status-badge  { font-size:11px; padding:3px 10px; border-radius:999px; font-weight:600; }
    .show-more-row { padding:12px 16px; border-top:1px solid rgba(0,180,198,.08); text-align:center; }
    .show-more-btn { font-size:12px; color:#0099AE; font-weight:600; background:none; border:none; cursor:pointer; padding:4px 12px; border-radius:8px; }
    .show-more-btn:hover { background:rgba(0,180,198,.08); }

    /* Insights */
    .insights-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:12px; padding:16px 20px 20px; }
    .insight-tile  { border:1px solid; border-radius:14px; padding:14px; display:flex; align-items:flex-start; gap:12px; }
    .ins-icon      { width:32px; height:32px; border-radius:10px; display:flex; align-items:center; justify-content:center; flex-shrink:0; font-size:14px; }
    .ins-label     { font-size:11px; color:#5a7a8a; margin-bottom:2px; text-transform:uppercase; letter-spacing:.04em; }
    .ins-value     { font-size:20px; font-weight:700; line-height:1.1; }
    .ins-detail    { font-size:11px; color:#94a3b8; margin-top:2px; }

    /* Skeleton */
    .skeleton-list { display:flex; flex-direction:column; gap:10px; padding:4px 0; }
    .skeleton { background:linear-gradient(90deg,rgba(0,180,198,.06) 25%,rgba(0,180,198,.12) 50%,rgba(0,180,198,.06) 75%); background-size:200%; animation:shimmer 1.4s infinite; }
    @keyframes shimmer { 0%{background-position:200%} 100%{background-position:-200%} }
    .empty-state { text-align:center; color:#94a3b8; font-size:13px; padding:32px 0; }

    /* Reveal animations */
    .reveal       { animation:fadeUp .5s ease both; }
    .stagger-1    { animation-delay:.05s; }
    .stagger-2    { animation-delay:.1s; }
    .stagger-3    { animation-delay:.15s; }
    .stagger-4    { animation-delay:.2s; }
    @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
  `],
})
export class TrainerAnalytics implements OnInit {
  loading        = signal(true);
  loadingQuiz    = signal(true);
  loadingStudents= signal(true);
  analytics      = signal<AnalyticsData | null>(null);
  quizStats      = signal<QuizStat[]>([]);
  students       = signal<StudentData[]>([]);
  showAll        = signal(false);

  get role()     { return this.auth.user()?.role ?? 'TRAINER'; }
  get userName() { return this.auth.user()?.name ?? ''; }

  courseStats = computed(() => {
    const stats = this.analytics()?.courseStats ?? [];
    return [...stats].sort((a, b) => b.studentsCount - a.studentsCount);
  });

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

  topStudents = computed(() =>
    this.students().filter(s => s.avgProgress >= 60).slice(0, 5)
  );

  strugglingStudents = computed(() =>
    this.students().filter(s => s.avgProgress < 30)
  );

  displayedStudents = computed(() => {
    const all = [...this.students()].sort((a, b) => b.avgProgress - a.avgProgress);
    return this.showAll() ? all : all.slice(0, 6);
  });

  passRate(q: QuizStat): number {
    return q.attemptsCount > 0 ? Math.round((q.passedCount / q.attemptsCount) * 100) : 0;
  }

  statusLabel(progress: number): string {
    if (progress >= 60) return 'En bonne voie';
    if (progress >= 30) return 'En cours';
    return "Besoin d'aide";
  }

  avatarGradient(progress: number): string {
    if (progress >= 60) return 'linear-gradient(135deg,#6ee7b7,#1f9d6f)';
    if (progress >= 30) return 'linear-gradient(135deg,#fde68a,#f5a524)';
    return 'linear-gradient(135deg,#fda4af,#f25c78)';
  }

  insights = computed(() => {
    const totalStudents  = this.analytics()?.totalStudents ?? 0;
    const struggling     = this.strugglingStudents().length;
    const avgScore       = this.globalAvgScore();
    const completion     = this.globalCompletionRate();
    const bestQuiz       = [...this.quizStats()].sort((a, b) => this.passRate(b) - this.passRate(a))[0];
    return [
      {
        icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>',
        label: 'Taux d\'engagement',
        value: totalStudents > 0 ? Math.round(((totalStudents - struggling) / totalStudents) * 100) + '%' : '—',
        detail: `${totalStudents - struggling} sur ${totalStudents} stagiaires actifs`,
        color: '#0284c7',
      },
      {
        icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>',
        label: 'Complétion globale',
        value: completion + '%',
        detail: completion >= 60 ? 'Bon taux' : completion >= 30 ? 'À améliorer' : 'Faible — revoir les cours',
        color: completion >= 60 ? '#1f9d6f' : completion >= 30 ? '#e08a10' : '#f25c78',
      },
      {
        icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
        label: 'Score quiz moyen',
        value: avgScore + '%',
        detail: avgScore >= 70 ? 'Au-dessus du seuil (70%)' : 'En-dessous du seuil (70%)',
        color: avgScore >= 70 ? '#7c3aed' : '#f25c78',
      },
      {
        icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
        label: 'Meilleur quiz',
        value: bestQuiz ? this.passRate(bestQuiz) + '%' : '—',
        detail: bestQuiz ? bestQuiz.title : 'Aucun quiz tenté',
        color: '#e08a10',
      },
    ];
  });

  constructor(private auth: AuthService, private api: ApiService) {}

  ngOnInit() {
    this.api.get<AnalyticsData>('/trainer/analytics').subscribe({
      next: data => { this.analytics.set(data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
    this.api.get<QuizStat[]>('/trainer/quizzes').subscribe({
      next: data => { this.quizStats.set(data ?? []); this.loadingQuiz.set(false); },
      error: () => this.loadingQuiz.set(false),
    });
    this.api.get<StudentData[]>('/trainer/students').subscribe({
      next: data => { this.students.set(data ?? []); this.loadingStudents.set(false); },
      error: () => this.loadingStudents.set(false),
    });
  }
}
