import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth';
import { ApiService } from '../../../core/services/api';
import { Sidebar } from '../../../shared/sidebar/sidebar';

interface AnalyticsData {
  totalStudents: number; totalCourses: number; averageRating: number; totalQuizAttempts: number;
  avgCompletionRate?: number; totalQuizzes?: number; courseStats?: CourseStatItem[];
}
interface CourseStatItem { id: string; title: string; studentsCount: number; avgProgress: number; completedCount: number; published: boolean }
interface QuizStat { id: string; title: string; courseTitle: string; attemptsCount: number; avgScore: number; passedCount: number; questionsCount: number }
interface StudentData { id: string; name: string; email: string; avgProgress: number; enrollments: {courseTitle: string; progress: number; completed: boolean}[] }

interface DifficultyInsight { type: 'danger' | 'warning' | 'ok'; title: string; detail: string; count: number }

@Component({
  selector: 'app-trainer-analytics',
  standalone: true,
  imports: [CommonModule, Sidebar],
  template: `
    <div class="flex h-screen overflow-hidden" style="background:linear-gradient(160deg,#fffdfb 0%,#fdf2f8 60%,#f6f0ff 100%)">
      <app-sidebar [role]="role" [userName]="userName"></app-sidebar>
      <main class="flex-1 overflow-y-auto p-7">
        <div class="mb-6 reveal">
          <h1 class="font-display text-2xl font-bold" style="color:#221f2c">Analytics</h1>
          <p class="text-sm mt-0.5" style="color:#948da3">Performance de vos formations</p>
        </div>

        <!-- Stats -->
        <div class="grid grid-cols-4 gap-4 mb-6 reveal stagger-1">
          <div class="card p-5 lift-on-hover">
            <p class="text-xs mb-1" style="color:#948da3">Total stagiaires</p>
            <p class="text-3xl font-bold font-display" style="color:#221f2c">{{ analytics()?.totalStudents ?? '—' }}</p>
          </div>
          <div class="card p-5 lift-on-hover">
            <p class="text-xs mb-1" style="color:#948da3">Cours publiés</p>
            <p class="text-3xl font-bold font-display" style="color:#8b6ef2">{{ analytics()?.totalCourses ?? '—' }}</p>
          </div>
          <div class="card p-5 lift-on-hover">
            <p class="text-xs mb-1" style="color:#948da3">Note moyenne</p>
            <p class="text-3xl font-bold font-display" style="color:#f5a524">{{ (analytics()?.averageRating ?? 0) | number:'1.1-1' }}</p>
          </div>
          <div class="card p-5 lift-on-hover">
            <p class="text-xs mb-1" style="color:#948da3">Tentatives quiz</p>
            <p class="text-3xl font-bold font-display" style="color:#1f9d6f">{{ analytics()?.totalQuizAttempts ?? '—' }}</p>
          </div>
        </div>

        <!-- Rating bar -->
        <div class="card p-6 mb-6 reveal stagger-2">
          <h2 class="text-sm font-bold font-display mb-4" style="color:#221f2c">Note globale</h2>
          <div class="flex items-center gap-4">
            <p class="text-5xl font-bold font-display" style="color:#f5a524">{{ (analytics()?.averageRating ?? 0) | number:'1.1-1' }}</p>
            <div class="flex-1">
              <div class="flex gap-1 mb-2">
                <svg *ngFor="let _ of [1,2,3,4,5]; let i = index" width="20" height="20" viewBox="0 0 24 24"
                  [attr.fill]="(analytics()?.averageRating ?? 0) > i ? '#f5a524' : 'none'"
                  [attr.stroke]="(analytics()?.averageRating ?? 0) > i ? '#f5a524' : '#e3dcf0'" stroke-width="1.5">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                </svg>
              </div>
              <p class="text-xs" style="color:#948da3">Basé sur les évaluations des stagiaires</p>
            </div>
          </div>
        </div>

        <!-- Quiz stats table -->
        <div class="card overflow-hidden reveal stagger-3 mb-6">
          <div class="p-4" style="border-bottom:1px solid rgba(167,139,250,.1)">
            <h2 class="text-sm font-bold font-display" style="color:#221f2c">Performance des quiz</h2>
          </div>
          <div *ngIf="loading()" class="p-8 text-center text-sm" style="color:#948da3">Chargement...</div>
          <table *ngIf="!loading()" class="data-table w-full">
            <thead>
              <tr>
                <th class="text-left font-medium p-4">Quiz</th>
                <th class="text-left font-medium p-4">Cours</th>
                <th class="text-left font-medium p-4">Tentatives</th>
                <th class="text-left font-medium p-4">Score moy.</th>
                <th class="text-left font-medium p-4">Taux réussite</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let q of quizStats()">
                <td class="p-4 text-sm font-semibold" style="color:#221f2c">{{ q.title }}</td>
                <td class="p-4 text-xs" style="color:#948da3">{{ q.courseTitle }}</td>
                <td class="p-4 text-sm" style="color:#221f2c">{{ q.attemptsCount }}</td>
                <td class="p-4 text-sm font-semibold" style="color:#8b6ef2">{{ q.avgScore | number:'1.0-0' }}%</td>
                <td class="p-4">
                  <div class="flex items-center gap-2">
                    <div class="progress-track" style="width:64px">
                      <div class="progress-fill" [style.width.%]="passRate(q)"
                        [style.background]="passRate(q) >= 60 ? 'linear-gradient(90deg,#6ee7b7,#1f9d6f)' : 'linear-gradient(90deg,#fda4af,#f25c78)'"></div>
                    </div>
                    <span class="text-xs font-semibold" [style.color]="passRate(q) >= 60 ? '#1f9d6f' : '#f25c78'">{{ passRate(q) | number:'1.0-0' }}%</span>
                  </div>
                </td>
              </tr>
              <tr *ngIf="quizStats().length === 0">
                <td colspan="5" class="p-8 text-center text-sm" style="color:#948da3">Aucune donnée disponible</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- AI Difficulty Analysis -->
        <div class="reveal stagger-3">
          <div class="flex items-center gap-3 mb-4">
            <div style="width:32px;height:32px;border-radius:10px;background:linear-gradient(135deg,#a78bfa,#fb7299);display:flex;align-items:center;justify-content:center">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            </div>
            <h2 class="font-display font-bold text-lg" style="color:#221f2c">Analyse IA des difficultés</h2>
          </div>

          <div *ngIf="loadingStudents()" class="grid grid-cols-3 gap-4 mb-6">
            <div *ngFor="let _ of [1,2,3]" class="skeleton h-24 rounded-2xl"></div>
          </div>

          <div *ngIf="!loadingStudents()" class="grid grid-cols-3 gap-4 mb-6">
            <div *ngFor="let insight of difficultyInsights()" class="insight-card"
              [style.border-color]="insight.type === 'danger' ? 'rgba(242,92,120,.3)' : insight.type === 'warning' ? 'rgba(245,165,36,.3)' : 'rgba(110,231,183,.3)'"
              [style.background]="insight.type === 'danger' ? 'rgba(242,92,120,.06)' : insight.type === 'warning' ? 'rgba(245,165,36,.06)' : 'rgba(110,231,183,.06)'">
              <div class="flex items-start gap-3">
                <div class="insight-dot"
                  [style.background]="insight.type === 'danger' ? '#f25c78' : insight.type === 'warning' ? '#f5a524' : '#1f9d6f'">
                </div>
                <div>
                  <p class="text-sm font-bold mb-0.5" style="color:#221f2c">{{ insight.title }}</p>
                  <p class="text-xs" style="color:#948da3">{{ insight.detail }}</p>
                  <p class="text-xl font-bold font-display mt-2"
                    [style.color]="insight.type === 'danger' ? '#f25c78' : insight.type === 'warning' ? '#f5a524' : '#1f9d6f'">
                    {{ insight.count }}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- Struggling students table -->
          <div *ngIf="!loadingStudents() && strugglingStudents().length > 0" class="card overflow-hidden">
            <div class="p-4" style="border-bottom:1px solid rgba(167,139,250,.1)">
              <p class="text-sm font-bold font-display" style="color:#221f2c">Stagiaires en difficulté</p>
              <p class="text-xs mt-0.5" style="color:#948da3">Progression moyenne inférieure à 30%</p>
            </div>
            <table class="data-table w-full">
              <thead>
                <tr>
                  <th class="text-left font-medium p-3">Stagiaire</th>
                  <th class="text-left font-medium p-3">Cours</th>
                  <th class="text-left font-medium p-3">Progression</th>
                  <th class="text-left font-medium p-3">Statut</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let s of strugglingStudents()">
                  <td class="p-3">
                    <div class="flex items-center gap-2">
                      <div style="width:28px;height:28px;border-radius:9px;background:linear-gradient(135deg,#fda4af,#f25c78);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;color:white">{{ s.name.charAt(0) }}</div>
                      <div>
                        <p class="text-sm font-semibold" style="color:#221f2c">{{ s.name }}</p>
                        <p class="text-xs" style="color:#948da3">{{ s.email }}</p>
                      </div>
                    </div>
                  </td>
                  <td class="p-3 text-xs" style="color:#948da3">{{ s.enrollments.length }} cours</td>
                  <td class="p-3">
                    <div class="flex items-center gap-2">
                      <div class="progress-track" style="width:72px">
                        <div class="progress-fill" [style.width.%]="s.avgProgress" style="background:linear-gradient(90deg,#fda4af,#f25c78)"></div>
                      </div>
                      <span class="text-xs font-semibold" style="color:#f25c78">{{ s.avgProgress }}%</span>
                    </div>
                  </td>
                  <td class="p-3">
                    <span style="font-size:11px;padding:3px 10px;border-radius:999px;background:rgba(242,92,120,.1);color:#f25c78;font-weight:600">Besoin d'aide</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Course difficulty stats -->
          <div *ngIf="!loadingStudents() && hardCourses().length > 0" class="card overflow-hidden mt-4">
            <div class="p-4" style="border-bottom:1px solid rgba(167,139,250,.1)">
              <p class="text-sm font-bold font-display" style="color:#221f2c">Cours difficiles à compléter</p>
              <p class="text-xs mt-0.5" style="color:#948da3">Progression moyenne des inscrits inférieure à 40%</p>
            </div>
            <div class="p-4 space-y-3">
              <div *ngFor="let c of hardCourses()" class="flex items-center gap-3">
                <div style="width:36px;height:36px;border-radius:12px;background:rgba(245,165,36,.14);display:flex;align-items:center;justify-content:center;flex-shrink:0">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f5a524" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-semibold" style="color:#221f2c">{{ c.title }}</p>
                  <p class="text-xs" style="color:#948da3">{{ c.studentsCount }} stagiaires · {{ c.completedCount }} terminé(s)</p>
                </div>
                <div class="flex items-center gap-2">
                  <div class="progress-track" style="width:80px">
                    <div class="progress-fill" [style.width.%]="c.avgProgress" style="background:linear-gradient(90deg,#fda4af,#f5a524)"></div>
                  </div>
                  <span class="text-xs font-bold" style="color:#e2940f;min-width:32px">{{ c.avgProgress }}%</span>
                </div>
              </div>
            </div>
          </div>

          <div *ngIf="!loadingStudents() && students().length === 0" class="card p-8 text-center">
            <p class="text-sm" style="color:#948da3">Aucun stagiaire inscrit pour le moment</p>
          </div>
        </div>
      </main>
    </div>
  `,
  styles: [`
    .insight-card { padding:16px; border-radius:18px; border:1px solid; }
    .insight-dot { width:10px; height:10px; border-radius:50%; flex-shrink:0; margin-top:4px; }
  `],
})
export class TrainerAnalytics implements OnInit {
  loading = signal(true);
  loadingStudents = signal(true);
  analytics = signal<AnalyticsData | null>(null);
  quizStats = signal<QuizStat[]>([]);
  students = signal<StudentData[]>([]);

  get role() { return this.auth.user()?.role ?? 'TRAINER'; }
  get userName() { return this.auth.user()?.name ?? ''; }

  strugglingStudents = computed(() =>
    this.students().filter(s => s.avgProgress < 30).slice(0, 8)
  );

  hardCourses = computed(() =>
    (this.analytics()?.courseStats ?? [])
      .filter(c => c.studentsCount > 0 && c.avgProgress < 40)
      .sort((a, b) => a.avgProgress - b.avgProgress)
      .slice(0, 5)
  );

  difficultyInsights = computed((): DifficultyInsight[] => {
    const struggling = this.strugglingStudents().length;
    const hard = this.hardCourses().length;
    const total = this.students().length;
    const avgCompletion = this.analytics()?.avgCompletionRate ?? 0;
    return [
      {
        type: struggling > 0 ? (struggling >= total / 2 ? 'danger' : 'warning') : 'ok',
        title: 'Stagiaires en difficulté',
        detail: 'Progression moyenne < 30%',
        count: struggling,
      },
      {
        type: hard > 2 ? 'warning' : hard > 0 ? 'warning' : 'ok',
        title: 'Cours difficiles',
        detail: 'Taux de complétion faible',
        count: hard,
      },
      {
        type: avgCompletion < 30 ? 'danger' : avgCompletion < 60 ? 'warning' : 'ok',
        title: 'Taux de complétion global',
        detail: 'Tous cours confondus',
        count: Math.round(avgCompletion),
      },
    ];
  });

  passRate(q: QuizStat): number {
    return q.attemptsCount > 0 ? Math.round((q.passedCount / q.attemptsCount) * 100) : 0;
  }

  constructor(private auth: AuthService, private api: ApiService) {}

  ngOnInit() {
    this.api.get<any>('/trainer/analytics').subscribe({
      next: (data: any) => this.analytics.set(data),
    });
    this.api.get<any[]>('/trainer/quizzes').subscribe({
      next: data => { this.quizStats.set(data ?? []); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
    this.api.get<StudentData[]>('/trainer/students').subscribe({
      next: data => { this.students.set(data ?? []); this.loadingStudents.set(false); },
      error: () => this.loadingStudents.set(false),
    });
  }
}
