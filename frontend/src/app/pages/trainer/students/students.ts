import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth';
import { ApiService } from '../../../core/services/api';
import { Sidebar } from '../../../shared/sidebar/sidebar';

interface QuizStatus {
  exists: boolean; quizId?: string; quizTitle?: string;
  attempted: boolean; passed: boolean; bestScore: number; attempts: number;
}
interface ModuleDetail {
  moduleId: string; moduleTitle: string;
  lessonTotal: number; lessonDone: number;
  quiz: QuizStatus; done: boolean;
}
interface CourseEnrollment {
  courseId: string; courseTitle: string;
  progress: number; completed: boolean; badgeEarned: boolean;
  lastAccessedAt?: string;
  modules: ModuleDetail[];
  finalQuiz: QuizStatus;
  expanded: boolean;
}
interface StudentRow {
  id: string; name: string; email: string;
  avgProgress: number; coursesCount: number;
  enrollments: CourseEnrollment[];
  expanded: boolean;
}

@Component({
  selector: 'app-trainer-students',
  standalone: true,
  imports: [CommonModule, FormsModule, Sidebar],
  template: `
    <div class="flex h-screen overflow-hidden" style="background:linear-gradient(160deg,#fffdfb 0%,#fdf2f8 60%,#f6f0ff 100%)">
      <app-sidebar [role]="role" [userName]="userName"></app-sidebar>
      <main class="flex-1 overflow-y-auto">

        <div class="page-hero">
          <div>
            <h1 class="font-display text-2xl font-bold" style="color:#221f2c">Mes stagiaires</h1>
            <p class="text-sm mt-0.5" style="color:#948da3">{{ students().length }} stagiaire(s) inscrit(s)</p>
          </div>
          <div class="search-wrap">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#948da3" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input [(ngModel)]="search" placeholder="Rechercher un stagiaire..." class="search-input" />
          </div>
        </div>

        <div *ngIf="loading()" class="page-body">
          <div *ngFor="let _ of [1,2,3]" class="skeleton h-24 rounded-2xl"></div>
        </div>

        <div *ngIf="!loading() && filtered().length === 0" class="empty-state">
          <div class="empty-icon">
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#c4bdd6" stroke-width="1.5">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
            </svg>
          </div>
          <p class="font-bold text-base font-display" style="color:#221f2c">Aucun stagiaire</p>
          <p class="text-sm mt-1" style="color:#948da3">Personne n'est encore inscrit à vos cours</p>
        </div>

        <div *ngIf="!loading()" class="page-body">
          <div *ngFor="let s of filtered()" class="student-card">

            <!-- ── Student header ── -->
            <div class="student-header" (click)="s.expanded = !s.expanded">
              <div class="avatar">{{ initials(s.name) }}</div>
              <div class="student-meta">
                <p class="student-name">{{ s.name }}</p>
                <p class="student-email">{{ s.email }}</p>
              </div>
              <div class="header-stats">
                <div class="mini-pill purple">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
                  {{ s.avgProgress }}% moy.
                </div>
                <div class="mini-pill pink">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
                  {{ s.coursesCount }} cours
                </div>
                <div class="mini-pill green" *ngIf="completedCount(s) > 0">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                  {{ completedCount(s) }} complété(s)
                </div>
              </div>
              <div class="header-bar">
                <div class="bar-track">
                  <div class="bar-fill" [style.width.%]="s.avgProgress"
                    [style.background]="s.avgProgress >= 70 ? 'linear-gradient(90deg,#1f9d6f,#34d399)' : 'linear-gradient(90deg,#a78bfa,#fb7299)'"></div>
                </div>
              </div>
              <div class="chevron" [class.open]="s.expanded">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#948da3" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
              </div>
            </div>

            <!-- ── Per-course + per-module breakdown ── -->
            <div class="expand-body" [class.open]="s.expanded">
              <div class="expand-inner">
                <div *ngFor="let e of s.enrollments" class="course-block">

                  <!-- Course header -->
                  <div class="course-header" (click)="e.expanded = !e.expanded">
                    <div class="course-icon">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
                    </div>
                    <div class="course-name-wrap">
                      <p class="course-name">{{ e.courseTitle }}</p>
                      <div class="course-badges">
                        <span *ngIf="e.badgeEarned" class="badge-gold">
                          <svg width="9" height="9" viewBox="0 0 24 24" fill="#d97706" stroke="none"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                          Badge obtenu
                        </span>
                        <span *ngIf="e.completed && !e.badgeEarned" class="badge-green">Complété</span>
                        <span *ngIf="!e.completed && e.progress > 0" class="badge-purple">En cours</span>
                        <span *ngIf="!e.completed && e.progress === 0" class="badge-grey">Non commencé</span>
                      </div>
                    </div>
                    <div class="course-prog">
                      <div class="bar-track" style="width:120px">
                        <div class="bar-fill" [style.width.%]="e.progress"
                          [style.background]="e.progress >= 70 ? 'linear-gradient(90deg,#1f9d6f,#34d399)' : 'linear-gradient(90deg,#a78bfa,#fb7299)'"></div>
                      </div>
                      <span class="prog-pct">{{ e.progress }}%</span>
                    </div>
                    <div class="chevron-sm" [class.open]="e.expanded">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#948da3" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
                    </div>
                  </div>

                  <!-- Module + final quiz breakdown -->
                  <div class="module-list" [class.open]="e.expanded">
                    <div class="module-list-inner">

                      <!-- Each module -->
                      <div *ngFor="let mod of e.modules; let i = index" class="module-row">
                        <div class="module-status-col">
                          <div class="mod-status-icon"
                            [style.background]="mod.done ? 'rgba(31,157,111,.12)' : mod.lessonDone > 0 || mod.quiz.attempted ? 'rgba(167,139,250,.12)' : 'rgba(196,189,214,.1)'"
                            [style.border]="mod.done ? '1.5px solid rgba(31,157,111,.3)' : mod.lessonDone > 0 ? '1.5px solid rgba(167,139,250,.25)' : '1.5px solid rgba(196,189,214,.2)'">
                            <!-- Done -->
                            <svg *ngIf="mod.done" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#1f9d6f" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                            <!-- In progress -->
                            <svg *ngIf="!mod.done && (mod.lessonDone > 0 || mod.quiz.attempted)" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                            <!-- Not started -->
                            <svg *ngIf="!mod.done && mod.lessonDone === 0 && !mod.quiz.attempted" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#c4bdd6" stroke-width="2"><circle cx="12" cy="12" r="10"/></svg>
                          </div>
                          <div *ngIf="i < e.modules.length - 1 || e.finalQuiz.exists" class="mod-connector"
                            [style.background]="mod.done ? '#1f9d6f' : 'rgba(196,189,214,.25)'"></div>
                        </div>

                        <div class="module-detail">
                          <div class="module-top-row">
                            <p class="module-title">{{ mod.moduleTitle }}</p>
                            <span class="mod-done-chip" *ngIf="mod.done">Terminé</span>
                            <span class="mod-prog-chip" *ngIf="!mod.done && (mod.lessonDone > 0 || mod.quiz.attempted)">En cours</span>
                          </div>

                          <!-- Lessons progress -->
                          <div class="detail-row" *ngIf="mod.lessonTotal > 0">
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#948da3" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/></svg>
                            <span class="detail-label">Leçons</span>
                            <div class="lesson-dots">
                              <div *ngFor="let li of lessonRange(mod.lessonTotal)" class="lesson-dot"
                                [style.background]="li < mod.lessonDone ? '#1f9d6f' : 'rgba(196,189,214,.4)'"></div>
                            </div>
                            <span class="detail-count" [style.color]="mod.lessonDone === mod.lessonTotal ? '#1f9d6f' : '#948da3'">
                              {{ mod.lessonDone }}/{{ mod.lessonTotal }}
                            </span>
                          </div>

                          <!-- Module quiz status -->
                          <div class="detail-row" *ngIf="mod.quiz.exists">
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
                              [attr.stroke]="mod.quiz.passed ? '#1f9d6f' : mod.quiz.attempted ? '#f5a524' : '#c4bdd6'"
                              stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                            <span class="detail-label">Quiz du module</span>
                            <span class="quiz-status-badge"
                              [style.background]="mod.quiz.passed ? 'rgba(31,157,111,.1)' : mod.quiz.attempted ? 'rgba(245,165,36,.1)' : 'rgba(196,189,214,.1)'"
                              [style.color]="mod.quiz.passed ? '#1f9d6f' : mod.quiz.attempted ? '#d97706' : '#948da3'"
                              [style.border]="mod.quiz.passed ? '1px solid rgba(31,157,111,.25)' : mod.quiz.attempted ? '1px solid rgba(245,165,36,.25)' : '1px solid rgba(196,189,214,.2)'">
                              {{ mod.quiz.passed ? 'Réussi' : mod.quiz.attempted ? 'En attente' : 'Non tenté' }}
                              <span *ngIf="mod.quiz.attempted"> · {{ mod.quiz.bestScore }}%</span>
                            </span>
                            <span class="attempts-count" *ngIf="mod.quiz.attempts > 0">{{ mod.quiz.attempts }} tentative(s)</span>
                          </div>
                        </div>
                      </div>

                      <!-- Final quiz -->
                      <div *ngIf="e.finalQuiz.exists" class="module-row final-row">
                        <div class="module-status-col">
                          <div class="mod-status-icon"
                            [style.background]="e.finalQuiz.passed ? 'rgba(245,165,36,.15)' : e.finalQuiz.attempted ? 'rgba(245,165,36,.08)' : 'rgba(196,189,214,.1)'"
                            [style.border]="e.finalQuiz.passed ? '1.5px solid rgba(245,165,36,.4)' : '1.5px solid rgba(245,165,36,.15)'">
                            <svg *ngIf="e.finalQuiz.passed" width="12" height="12" viewBox="0 0 24 24" fill="#d97706" stroke="none"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                            <svg *ngIf="!e.finalQuiz.passed && e.finalQuiz.attempted" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#f5a524" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                            <svg *ngIf="!e.finalQuiz.attempted" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#c4bdd6" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                          </div>
                        </div>
                        <div class="module-detail">
                          <div class="module-top-row">
                            <p class="module-title" style="color:#d97706">Quiz Final du cours</p>
                            <span class="quiz-status-badge"
                              [style.background]="e.finalQuiz.passed ? 'rgba(245,165,36,.12)' : e.finalQuiz.attempted ? 'rgba(245,165,36,.07)' : 'rgba(196,189,214,.1)'"
                              [style.color]="e.finalQuiz.passed ? '#d97706' : e.finalQuiz.attempted ? '#b45309' : '#948da3'"
                              [style.border]="e.finalQuiz.passed ? '1px solid rgba(245,165,36,.35)' : e.finalQuiz.attempted ? '1px solid rgba(245,165,36,.2)' : '1px solid rgba(196,189,214,.2)'">
                              {{ e.finalQuiz.passed ? 'Réussi' : e.finalQuiz.attempted ? 'En attente' : 'Non tenté' }}
                              <span *ngIf="e.finalQuiz.attempted"> · {{ e.finalQuiz.bestScore }}%</span>
                            </span>
                            <span class="attempts-count" *ngIf="e.finalQuiz.attempts > 0">{{ e.finalQuiz.attempts }} tentative(s)</span>
                          </div>
                        </div>
                      </div>

                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  `,
  styles: [`
    .page-hero { display:flex; align-items:center; justify-content:space-between; padding:28px 32px 20px; border-bottom:1px solid rgba(167,139,250,.1); background:rgba(255,253,251,.7); gap:16px; flex-wrap:wrap; }
    .page-body { padding:20px 32px 32px; display:flex; flex-direction:column; gap:14px; }
    .search-wrap { display:flex; align-items:center; gap:8px; padding:8px 14px; border-radius:14px; border:1px solid rgba(167,139,250,.2); background:rgba(255,255,255,.8); }
    .search-input { border:none; outline:none; background:transparent; font-size:13px; color:#221f2c; font-family:inherit; width:200px; }

    /* Student card */
    .student-card { background:rgba(255,255,255,.9); border:1px solid rgba(167,139,250,.15); border-radius:22px; overflow:hidden; box-shadow:0 2px 12px rgba(167,139,250,.07); }

    /* Student header */
    .student-header { display:flex; align-items:center; gap:14px; padding:18px 22px; cursor:pointer; transition:background .18s; }
    .student-header:hover { background:rgba(167,139,250,.03); }
    .avatar { width:42px; height:42px; border-radius:14px; background:linear-gradient(135deg,#a78bfa,#fb7299); display:flex; align-items:center; justify-content:center; font-size:14px; font-weight:800; color:#fff; flex-shrink:0; }
    .student-meta { flex:0 0 200px; min-width:0; }
    .student-name { font-size:14px; font-weight:700; color:#221f2c; font-family:'Fraunces',Georgia,serif; }
    .student-email { font-size:12px; color:#948da3; margin-top:1px; }
    .header-stats { display:flex; gap:6px; flex-wrap:wrap; }
    .mini-pill { display:inline-flex; align-items:center; gap:4px; padding:4px 9px; border-radius:999px; font-size:11px; font-weight:700; }
    .mini-pill.purple { background:rgba(167,139,250,.1); color:#7c5ce0; border:1px solid rgba(167,139,250,.2); }
    .mini-pill.pink   { background:rgba(251,114,153,.08); color:#fb7299; border:1px solid rgba(251,114,153,.18); }
    .mini-pill.green  { background:rgba(31,157,111,.08); color:#1f9d6f; border:1px solid rgba(31,157,111,.18); }
    .header-bar { flex:1; min-width:60px; max-width:120px; }
    .bar-track { height:6px; background:rgba(167,139,250,.1); border-radius:999px; overflow:hidden; width:100%; }
    .bar-fill { height:100%; border-radius:999px; transition:width .5s cubic-bezier(.16,1,.3,1); }
    .chevron { width:30px; height:30px; border-radius:10px; background:rgba(167,139,250,.06); display:flex; align-items:center; justify-content:center; flex-shrink:0; }
    .chevron svg, .chevron-sm svg { transition:transform .25s cubic-bezier(.16,1,.3,1); }
    .chevron.open svg, .chevron-sm.open svg { transform:rotate(180deg); }

    /* Expand body */
    .expand-body { max-height:0; overflow:hidden; transition:max-height .4s cubic-bezier(.16,1,.3,1); }
    .expand-body.open { max-height:2000px; }
    .expand-inner { padding:0 22px 18px; border-top:1px solid rgba(167,139,250,.08); }

    /* Course block */
    .course-block { margin-top:14px; border:1px solid rgba(167,139,250,.12); border-radius:18px; overflow:hidden; background:rgba(167,139,250,.02); }
    .course-header { display:flex; align-items:center; gap:10px; padding:12px 16px; cursor:pointer; transition:background .18s; }
    .course-header:hover { background:rgba(167,139,250,.04); }
    .course-icon { width:28px; height:28px; border-radius:9px; background:rgba(167,139,250,.1); display:flex; align-items:center; justify-content:center; flex-shrink:0; }
    .course-name-wrap { flex:1; min-width:0; display:flex; align-items:center; gap:8px; flex-wrap:wrap; }
    .course-name { font-size:13px; font-weight:700; color:#221f2c; }
    .course-badges { display:flex; gap:5px; align-items:center; }
    .badge-gold    { display:inline-flex;align-items:center;gap:4px;font-size:10px;font-weight:700;padding:2px 7px;border-radius:999px;background:rgba(245,165,36,.12);color:#d97706;border:1px solid rgba(245,165,36,.25); }
    .badge-green   { font-size:10px;font-weight:700;padding:2px 7px;border-radius:999px;background:rgba(31,157,111,.1);color:#1f9d6f;border:1px solid rgba(31,157,111,.2); }
    .badge-purple  { font-size:10px;font-weight:700;padding:2px 7px;border-radius:999px;background:rgba(167,139,250,.12);color:#7c5ce0;border:1px solid rgba(167,139,250,.2); }
    .badge-grey    { font-size:10px;font-weight:700;padding:2px 7px;border-radius:999px;background:rgba(148,141,163,.08);color:#948da3;border:1px solid rgba(148,141,163,.15); }
    .course-prog { display:flex; align-items:center; gap:6px; flex-shrink:0; }
    .prog-pct { font-size:12px; font-weight:700; color:#4a4458; min-width:30px; }
    .chevron-sm { width:24px; height:24px; border-radius:8px; background:rgba(167,139,250,.06); display:flex; align-items:center; justify-content:center; flex-shrink:0; }

    /* Module list */
    .module-list { max-height:0; overflow:hidden; transition:max-height .35s cubic-bezier(.16,1,.3,1); }
    .module-list.open { max-height:1200px; }
    .module-list-inner { padding:10px 16px 14px; border-top:1px solid rgba(167,139,250,.08); display:flex; flex-direction:column; gap:0; }

    /* Module row with connector */
    .module-row { display:flex; gap:12px; position:relative; }
    .module-status-col { display:flex; flex-direction:column; align-items:center; flex-shrink:0; width:28px; }
    .mod-status-icon { width:28px; height:28px; border-radius:9px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
    .mod-connector { width:2px; flex:1; min-height:12px; border-radius:2px; margin:2px 0; }
    .module-detail { flex:1; min-width:0; padding-bottom:14px; }
    .module-top-row { display:flex; align-items:center; gap:8px; margin-bottom:6px; flex-wrap:wrap; padding-top:4px; }
    .module-title { font-size:13px; font-weight:700; color:#221f2c; }
    .mod-done-chip { font-size:10px; font-weight:700; padding:2px 7px; border-radius:999px; background:rgba(31,157,111,.1); color:#1f9d6f; border:1px solid rgba(31,157,111,.2); }
    .mod-prog-chip { font-size:10px; font-weight:700; padding:2px 7px; border-radius:999px; background:rgba(167,139,250,.1); color:#7c5ce0; border:1px solid rgba(167,139,250,.2); }
    .detail-row { display:flex; align-items:center; gap:7px; margin-bottom:5px; }
    .detail-label { font-size:11px; color:#948da3; min-width:70px; }
    .lesson-dots { display:flex; gap:3px; }
    .lesson-dot { width:8px; height:8px; border-radius:50%; transition:background .3s; }
    .detail-count { font-size:11px; font-weight:700; color:#948da3; margin-left:2px; }
    .quiz-status-badge { font-size:10px; font-weight:700; padding:2px 8px; border-radius:999px; white-space:nowrap; }
    .attempts-count { font-size:10px; color:#c4bdd6; }
    .final-row .module-detail { padding-bottom:0; }

    /* Empty */
    .empty-state { display:flex; flex-direction:column; align-items:center; gap:6px; padding:80px 20px; text-align:center; }
    .empty-icon { width:72px; height:72px; border-radius:24px; background:rgba(167,139,250,.07); display:flex; align-items:center; justify-content:center; margin-bottom:10px; }
    .skeleton { background:linear-gradient(90deg,rgba(167,139,250,.07) 25%,rgba(167,139,250,.14) 50%,rgba(167,139,250,.07) 75%); background-size:200% 100%; animation:shimmer 1.5s infinite; }
    @keyframes shimmer { to { background-position:-200% 0; } }
  `],
})
export class TrainerStudents implements OnInit {
  loading = signal(true);
  students = signal<StudentRow[]>([]);
  search = '';

  filtered = computed(() => {
    if (!this.search.trim()) return this.students();
    const s = this.search.toLowerCase();
    return this.students().filter(st =>
      st.name.toLowerCase().includes(s) || st.email.toLowerCase().includes(s)
    );
  });

  get role()     { return this.auth.user()?.role ?? 'TRAINER'; }
  get userName() { return this.auth.user()?.name ?? ''; }
  initials = (name: string) => name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  completedCount = (s: StudentRow) => s.enrollments.filter(e => e.completed).length;
  lessonRange = (n: number) => Array.from({ length: Math.min(n, 12) }, (_, i) => i);

  constructor(private auth: AuthService, private api: ApiService) {}

  ngOnInit() {
    this.api.get<any[]>('/trainer/students').subscribe({
      next: data => {
        const rows: StudentRow[] = (data ?? []).map(s => ({
          id: s.id, name: s.name, email: s.email,
          avgProgress: s.avgProgress ?? 0,
          coursesCount: s.coursesCount ?? 0,
          expanded: true,
          enrollments: (s.enrollments ?? []).map((e: any) => ({
            courseId: e.courseId, courseTitle: e.courseTitle,
            progress: e.progress ?? 0,
            completed: e.completed ?? false,
            badgeEarned: e.badgeEarned ?? false,
            lastAccessedAt: e.lastAccessedAt,
            modules: (e.modules ?? []) as ModuleDetail[],
            finalQuiz: (e.finalQuiz ?? { exists: false }) as QuizStatus,
            expanded: true,
          })),
        }));
        this.students.set(rows);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
