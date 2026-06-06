import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth';
import { ApiService } from '../../../core/services/api';
import { Sidebar } from '../../../shared/sidebar/sidebar';

interface AnalyticsData {
  totalStudents: number; totalCourses: number; averageRating: number; totalQuizAttempts: number;
}
interface QuizStat { id: string; title: string; courseName: string; attempts: number; avgScore: number; passRate: number }

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
        <div class="card overflow-hidden reveal stagger-3">
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
                <td class="p-4 text-xs" style="color:#948da3">{{ q.courseName }}</td>
                <td class="p-4 text-sm" style="color:#221f2c">{{ q.attempts }}</td>
                <td class="p-4 text-sm font-semibold" style="color:#8b6ef2">{{ q.avgScore | number:'1.0-0' }}%</td>
                <td class="p-4">
                  <div class="flex items-center gap-2">
                    <div class="progress-track" style="width:64px">
                      <div class="progress-fill" [style.width.%]="q.passRate"
                        [style.background]="q.passRate >= 60 ? 'linear-gradient(90deg,#6ee7b7,#1f9d6f)' : 'linear-gradient(90deg,#fda4af,#f25c78)'"></div>
                    </div>
                    <span class="text-xs font-semibold" [style.color]="q.passRate >= 60 ? '#1f9d6f' : '#f25c78'">{{ q.passRate | number:'1.0-0' }}%</span>
                  </div>
                </td>
              </tr>
              <tr *ngIf="quizStats().length === 0">
                <td colspan="5" class="p-8 text-center text-sm" style="color:#948da3">Aucune donnée disponible</td>
              </tr>
            </tbody>
          </table>
        </div>
      </main>
    </div>
  `,
})
export class TrainerAnalytics implements OnInit {
  loading = signal(true);
  analytics = signal<AnalyticsData | null>(null);
  quizStats = signal<QuizStat[]>([]);

  get role() { return this.auth.user()?.role ?? 'TRAINER'; }
  get userName() { return this.auth.user()?.name ?? ''; }

  constructor(private auth: AuthService, private api: ApiService) {}

  ngOnInit() {
    this.api.get<AnalyticsData>('/trainer/analytics').subscribe({
      next: data => this.analytics.set(data),
    });
    this.api.get<QuizStat[]>('/trainer/quizzes').subscribe({
      next: data => { this.quizStats.set(data ?? []); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }
}
