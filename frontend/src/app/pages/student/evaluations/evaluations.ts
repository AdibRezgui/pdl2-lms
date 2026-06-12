import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth';
import { ApiService } from '../../../core/services/api';
import { Sidebar } from '../../../shared/sidebar/sidebar';

interface Enrollment {
  id: string;
  progress: number;
  completed: boolean;
  badgeEarned: boolean;
  enrolledAt: string;
  course: { id: string; title: string; category: string; level: string; thumbnail?: string; };
}
interface QuizRef {
  id: string; moduleId: string | null; title: string;
  questionsCount: number; timeLimit: number; passingScore: number;
}
interface Attempt {
  id: string; score: number; passed: boolean;
  quiz: { id: string };
}
interface CourseState {
  enrollment: Enrollment;
  quizzes: QuizRef[];
  attempts: Attempt[];
  loading: boolean;
}

@Component({
  selector: 'app-student-evaluations',
  standalone: true,
  imports: [CommonModule, RouterLink, Sidebar],
  template: `
    <div class="flex h-screen overflow-hidden" style="background:linear-gradient(160deg,#fffdfb 0%,#fdf2f8 60%,#f6f0ff 100%)">
      <app-sidebar [role]="role" [userName]="userName"></app-sidebar>

      <main class="flex-1 overflow-y-auto">
        <!-- Header -->
        <div class="page-hero">
          <div>
            <h1 class="font-display text-2xl font-bold" style="color:#221f2c">Badges & Certifications</h1>
            <p class="text-sm mt-0.5" style="color:#948da3">Complétez tous les quiz d'un cours pour réclamer votre badge</p>
          </div>
          <div class="flex items-center gap-3 flex-wrap">
            <div class="stat-pill">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#7c5ce0" stroke-width="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
              <span class="stat-num">{{ earnedCount() }}</span><span class="stat-lbl">badges obtenus</span>
            </div>
            <div class="stat-pill">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#f5a524" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              <span class="stat-num">{{ readyCount() }}</span><span class="stat-lbl">à réclamer</span>
            </div>
          </div>
        </div>

        <div class="page-body">
          <!-- Skeletons -->
          <div *ngIf="loading()" class="space-y-4">
            <div *ngFor="let _ of [1,2,3]" class="skeleton h-36 rounded-2xl"></div>
          </div>

          <!-- Empty -->
          <div *ngIf="!loading() && states().length === 0" class="empty-state">
            <div class="empty-icon">
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#c4bdd6" stroke-width="1.5"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
            </div>
            <p class="font-semibold" style="color:#221f2c">Aucune formation</p>
            <p class="text-xs mt-1" style="color:#948da3">Inscrivez-vous à un cours pour commencer</p>
            <a routerLink="/student/courses" class="btn-primary mt-4">Explorer les cours</a>
          </div>

          <!-- Course badge cards -->
          <div *ngFor="let s of states()" class="badge-card" [class.badge-card-earned]="s.enrollment.badgeEarned">

            <!-- Left accent -->
            <div class="badge-accent" [class.accent-earned]="s.enrollment.badgeEarned" [class.accent-ready]="isReady(s) && !s.enrollment.badgeEarned"></div>

            <!-- Badge icon -->
            <div class="badge-icon-wrap" [class.badge-icon-earned]="s.enrollment.badgeEarned" [class.badge-icon-ready]="isReady(s) && !s.enrollment.badgeEarned">
              <svg *ngIf="s.enrollment.badgeEarned" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
              <svg *ngIf="!s.enrollment.badgeEarned && isReady(s)" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
              <svg *ngIf="!s.enrollment.badgeEarned && !isReady(s)" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            </div>

            <!-- Main content -->
            <div class="badge-content">
              <div class="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <div class="flex items-center gap-2 mb-1 flex-wrap">
                    <p class="badge-course-title">{{ s.enrollment.course.title }}</p>
                    <span *ngIf="s.enrollment.badgeEarned" class="pill-earned">
                      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
                      Badge obtenu
                    </span>
                    <span *ngIf="!s.enrollment.badgeEarned && isReady(s)" class="pill-ready">
                      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                      Prêt à réclamer
                    </span>
                  </div>
                  <p class="text-xs" style="color:#948da3">{{ s.enrollment.course.category }}</p>
                </div>

                <!-- Claim / earned button -->
                <button *ngIf="isReady(s) && !s.enrollment.badgeEarned"
                  (click)="claimBadge(s)"
                  [disabled]="claiming === s.enrollment.id"
                  class="btn-claim">
                  <svg *ngIf="claiming !== s.enrollment.id" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                  <div *ngIf="claiming === s.enrollment.id" class="spinner-sm"></div>
                  {{ claiming === s.enrollment.id ? 'En cours...' : 'Réclamer le badge' }}
                </button>

                <div *ngIf="s.enrollment.badgeEarned" class="earned-badge">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f5a524" stroke-width="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                  <span>Badge obtenu !</span>
                </div>
              </div>

              <!-- Progress bar -->
              <div class="mt-3 mb-3">
                <div class="flex justify-between items-center mb-1">
                  <span class="text-xs" style="color:#948da3">Progression du cours</span>
                  <span class="text-xs font-bold" style="color:#7c5ce0">{{ s.enrollment.progress }}%</span>
                </div>
                <div class="prog-track"><div class="prog-fill" [style.width.%]="s.enrollment.progress"></div></div>
              </div>

              <!-- Loading state -->
              <div *ngIf="s.loading" class="conditions-loading">
                <div *ngFor="let _ of [1,2,3]" class="skeleton h-7 rounded-xl flex-1"></div>
              </div>

              <!-- Conditions checklist -->
              <div *ngIf="!s.loading" class="conditions-row">
                <!-- Module quizzes -->
                <ng-container *ngFor="let mq of moduleQuizzes(s)">
                  <div class="cond-chip" [class.cond-pass]="isPassed(s, mq.id)" [class.cond-fail]="!isPassed(s, mq.id)">
                    <svg *ngIf="isPassed(s, mq.id)" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
                    <svg *ngIf="!isPassed(s, mq.id)" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    <span>{{ mq.title }}</span>
                    <span *ngIf="isPassed(s, mq.id)" class="cond-score">{{ bestScore(s, mq.id) }}%</span>
                  </div>
                </ng-container>

                <!-- Final quiz -->
                <ng-container *ngIf="finalQuiz(s) as fq">
                  <div class="cond-chip cond-final" [class.cond-pass]="isPassed(s, fq.id)" [class.cond-fail]="!isPassed(s, fq.id)">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                    <span>Quiz Final</span>
                    <svg *ngIf="isPassed(s, fq.id)" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" style="flex-shrink:0"><polyline points="20 6 9 17 4 12"/></svg>
                    <svg *ngIf="!isPassed(s, fq.id)" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="flex-shrink:0"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    <span *ngIf="isPassed(s, fq.id)" class="cond-score">{{ bestScore(s, fq.id) }}%</span>
                  </div>
                </ng-container>

                <!-- No quizzes yet -->
                <div *ngIf="s.quizzes.length === 0" class="cond-chip cond-none">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  Aucun quiz disponible pour ce cours
                </div>

                <!-- Go to course -->
                <a [routerLink]="'/student/courses/' + s.enrollment.course.id + '/learn'" class="cond-learn-btn" *ngIf="!s.enrollment.badgeEarned">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
                  Continuer
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  `,
  styles: [`
    .page-hero { display:flex; align-items:center; justify-content:space-between; padding:28px 32px 20px; border-bottom:1px solid rgba(167,139,250,.1); gap:16px; flex-wrap:wrap; background:rgba(255,253,251,.7); }
    .page-body { padding:24px 32px; display:flex; flex-direction:column; gap:14px; }
    .stat-pill { display:flex; align-items:center; gap:6px; padding:7px 14px; border-radius:999px; background:rgba(255,255,255,.8); border:1px solid rgba(167,139,250,.15); box-shadow:0 2px 8px rgba(167,139,250,.07); }
    .stat-num { font-size:15px; font-weight:800; color:#221f2c; font-family:'Fraunces',Georgia,serif; line-height:1; }
    .stat-lbl { font-size:11px; color:#948da3; font-weight:500; }

    /* Badge card */
    .badge-card { display:flex; align-items:flex-start; gap:16px; padding:20px 22px; border-radius:22px; background:rgba(255,255,255,.82); border:1px solid rgba(167,139,250,.12); transition:all .22s; position:relative; overflow:hidden; }
    .badge-card:hover { box-shadow:0 6px 28px rgba(167,139,250,.13); border-color:rgba(167,139,250,.25); }
    .badge-card-earned { background:rgba(245,165,36,.03); border-color:rgba(245,165,36,.22); }
    .badge-accent { width:4px; height:100%; position:absolute; left:0; top:0; bottom:0; border-radius:4px 0 0 4px; background:rgba(167,139,250,.25); }
    .accent-earned { background:linear-gradient(180deg,#f5a524,#fb7299); }
    .accent-ready { background:linear-gradient(180deg,#a78bfa,#fb7299); }

    /* Badge icon */
    .badge-icon-wrap { width:52px; height:52px; border-radius:16px; background:rgba(167,139,250,.08); border:1px solid rgba(167,139,250,.15); display:flex; align-items:center; justify-content:center; flex-shrink:0; color:#c4bdd6; }
    .badge-icon-earned { background:linear-gradient(135deg,rgba(245,165,36,.15),rgba(251,114,153,.1)); border-color:rgba(245,165,36,.3); color:#f5a524; }
    .badge-icon-ready { background:rgba(167,139,250,.12); border-color:rgba(167,139,250,.3); color:#a78bfa; }

    /* Content */
    .badge-content { flex:1; min-width:0; }
    .badge-course-title { font-size:15px; font-weight:700; color:#221f2c; font-family:'Fraunces',Georgia,serif; }
    .pill-earned { display:inline-flex; align-items:center; gap:4px; font-size:10px; font-weight:700; padding:2px 9px; border-radius:999px; background:rgba(245,165,36,.12); color:#d97706; border:1px solid rgba(245,165,36,.25); }
    .pill-ready { display:inline-flex; align-items:center; gap:4px; font-size:10px; font-weight:700; padding:2px 9px; border-radius:999px; background:rgba(167,139,250,.14); color:#7c5ce0; border:1px solid rgba(167,139,250,.28); }

    /* Progress */
    .prog-track { height:5px; border-radius:99px; background:rgba(167,139,250,.12); overflow:hidden; }
    .prog-fill { height:100%; border-radius:99px; background:linear-gradient(90deg,#a78bfa,#fb7299); transition:width .5s cubic-bezier(.23,1,.32,1); }

    /* Conditions */
    .conditions-row { display:flex; flex-wrap:wrap; gap:7px; align-items:center; }
    .conditions-loading { display:flex; gap:7px; }
    .cond-chip { display:inline-flex; align-items:center; gap:5px; padding:5px 10px; border-radius:10px; font-size:11px; font-weight:600; border:1px solid transparent; max-width:220px; }
    .cond-chip span { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    .cond-pass { background:rgba(31,157,111,.07); border-color:rgba(31,157,111,.22); color:#1f9d6f; }
    .cond-fail { background:rgba(239,68,68,.06); border-color:rgba(239,68,68,.18); color:#ef4444; }
    .cond-final { font-weight:700; }
    .cond-none { background:rgba(148,141,163,.07); border-color:rgba(148,141,163,.18); color:#948da3; max-width:none; }
    .cond-score { font-size:10px; font-weight:800; margin-left:2px; flex-shrink:0; }
    .cond-learn-btn { display:inline-flex; align-items:center; gap:4px; padding:5px 11px; border-radius:10px; background:rgba(167,139,250,.1); border:1px solid rgba(167,139,250,.2); color:#7c5ce0; font-size:11px; font-weight:700; text-decoration:none; transition:all .18s; white-space:nowrap; margin-left:auto; }
    .cond-learn-btn:hover { background:rgba(167,139,250,.2); }

    /* Claim */
    .btn-claim { display:inline-flex; align-items:center; gap:7px; padding:10px 20px; border-radius:14px; background:linear-gradient(135deg,#f5a524,#fb7299); border:none; color:#fff; font-size:13px; font-weight:700; cursor:pointer; font-family:inherit; transition:all .22s; box-shadow:0 4px 16px rgba(245,165,36,.32); white-space:nowrap; flex-shrink:0; }
    .btn-claim:hover:not(:disabled) { transform:translateY(-1px); box-shadow:0 6px 22px rgba(245,165,36,.45); }
    .btn-claim:disabled { opacity:.55; cursor:default; transform:none; box-shadow:none; }
    .earned-badge { display:inline-flex; align-items:center; gap:7px; padding:10px 18px; border-radius:14px; background:rgba(245,165,36,.1); border:1px solid rgba(245,165,36,.28); color:#d97706; font-size:13px; font-weight:700; flex-shrink:0; }

    /* Misc */
    .empty-state { display:flex; flex-direction:column; align-items:center; gap:6px; padding:60px 20px; text-align:center; }
    .empty-icon { width:64px; height:64px; border-radius:22px; background:rgba(167,139,250,.07); display:flex; align-items:center; justify-content:center; margin-bottom:8px; }
    .btn-primary { display:inline-flex; align-items:center; gap:6px; padding:10px 20px; border-radius:14px; background:linear-gradient(135deg,#a78bfa,#fb7299); border:none; color:#fff; font-size:13px; font-weight:700; cursor:pointer; font-family:inherit; transition:all .22s; box-shadow:0 4px 14px rgba(167,139,250,.3); text-decoration:none; }
    .btn-primary:hover { transform:translateY(-1px); }
    .spinner-sm { width:14px; height:14px; border:2px solid rgba(255,255,255,.3); border-top-color:#fff; border-radius:50%; animation:spin .7s linear infinite; }
    .skeleton { background:linear-gradient(90deg,rgba(167,139,250,.08) 25%,rgba(167,139,250,.16) 50%,rgba(167,139,250,.08) 75%); background-size:200% 100%; animation:shimmer 1.5s infinite; }
    @keyframes shimmer { to { background-position:-200% 0; } }
    @keyframes spin { to { transform:rotate(360deg); } }
  `],
})
export class StudentEvaluations implements OnInit {
  loading  = signal(true);
  states   = signal<CourseState[]>([]);
  claiming = '';

  earnedCount = computed(() => this.states().filter(s => s.enrollment.badgeEarned).length);
  readyCount  = computed(() => this.states().filter(s => this.isReady(s) && !s.enrollment.badgeEarned).length);

  get role()     { return this.auth.user()?.role ?? 'STUDENT'; }
  get userName() { return this.auth.user()?.name ?? ''; }

  constructor(private auth: AuthService, private api: ApiService) {}

  ngOnInit() {
    this.api.get<Enrollment[]>('/enrollments/me').subscribe({
      next: enrollments => {
        const list = (enrollments ?? []).map(e => ({
          enrollment: e, quizzes: [], attempts: [], loading: true,
        }));
        this.states.set(list);
        this.loading.set(false);
        list.forEach((s, i) => this.loadCourseQuizzes(s, i));
      },
      error: () => this.loading.set(false),
    });
  }

  private loadCourseQuizzes(s: CourseState, index: number) {
    this.api.get<QuizRef[]>(`/quizzes/course/${s.enrollment.course.id}`).subscribe({
      next: quizzes => {
        this.api.get<Attempt[]>('/quizzes/attempts/me').subscribe({
          next: attempts => {
            this.states.update(list => list.map((item, i) =>
              i === index ? { ...item, quizzes: quizzes ?? [], attempts: attempts ?? [], loading: false } : item
            ));
          },
          error: () => this.patchState(index, { quizzes: quizzes ?? [], loading: false }),
        });
      },
      error: () => this.patchState(index, { loading: false }),
    });
  }

  private patchState(index: number, patch: Partial<CourseState>) {
    this.states.update(list => list.map((item, i) => i === index ? { ...item, ...patch } : item));
  }

  moduleQuizzes(s: CourseState): QuizRef[] {
    return s.quizzes.filter(q => q.moduleId !== null);
  }

  finalQuiz(s: CourseState): QuizRef | null {
    return s.quizzes.find(q => q.moduleId === null) ?? null;
  }

  isPassed(s: CourseState, quizId: string): boolean {
    return s.attempts.some(a => a.quiz.id === quizId && a.passed && a.score >= 70);
  }

  bestScore(s: CourseState, quizId: string): number {
    const relevant = s.attempts.filter(a => a.quiz.id === quizId);
    return relevant.length > 0 ? Math.max(...relevant.map(a => a.score)) : 0;
  }

  isReady(s: CourseState): boolean {
    if (s.loading || s.quizzes.length === 0) return false;
    const fq = this.finalQuiz(s);
    if (!fq || !this.isPassed(s, fq.id)) return false;
    return this.moduleQuizzes(s).every(q => this.isPassed(s, q.id));
  }

  claimBadge(s: CourseState) {
    this.claiming = s.enrollment.id;
    this.api.post<any>(`/enrollments/${s.enrollment.id}/claim-badge`, {}).subscribe({
      next: res => {
        this.claiming = '';
        this.states.update(list => list.map(item =>
          item.enrollment.id === s.enrollment.id
            ? { ...item, enrollment: { ...item.enrollment, badgeEarned: true } }
            : item
        ));
      },
      error: () => { this.claiming = ''; },
    });
  }
}
