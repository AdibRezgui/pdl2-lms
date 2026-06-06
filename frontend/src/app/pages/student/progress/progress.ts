import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth';
import { ApiService } from '../../../core/services/api';
import { Sidebar } from '../../../shared/sidebar/sidebar';

interface Attempt {
  id: string; score: number; maxScore: number; passed: boolean;
  quiz: { title: string; course: { title: string; category: string } };
  attemptedAt: string;
}
interface Enrollment {
  course: { title: string; category: string };
  progressPercentage: number; completed: boolean;
}

@Component({
  selector: 'app-student-progress',
  standalone: true,
  imports: [CommonModule, Sidebar],
  template: `
    <div class="flex h-screen overflow-hidden" style="background:linear-gradient(160deg,#fffdfb 0%,#fdf2f8 60%,#f6f0ff 100%)">
      <app-sidebar [role]="role" [userName]="userName"></app-sidebar>
      <main class="flex-1 overflow-y-auto p-7">
        <div class="mb-7 reveal">
          <h1 class="font-display text-2xl font-bold" style="color:#221f2c">Ma progression</h1>
          <p class="text-sm mt-0.5" style="color:#948da3">Suivez vos performances et avancement</p>
        </div>

        <!-- Global stats -->
        <div class="grid grid-cols-4 gap-4 mb-7 reveal stagger-1">
          <div class="card p-5">
            <p class="text-xs mb-1" style="color:#948da3">Cours inscrits</p>
            <p class="text-3xl font-bold font-display" style="color:#221f2c">{{ enrollments().length }}</p>
          </div>
          <div class="card p-5">
            <p class="text-xs mb-1" style="color:#948da3">Cours terminés</p>
            <p class="text-3xl font-bold font-display" style="color:#1f9d6f">{{ completedCount() }}</p>
          </div>
          <div class="card p-5">
            <p class="text-xs mb-1" style="color:#948da3">Quiz passés</p>
            <p class="text-3xl font-bold font-display" style="color:#8b6ef2">{{ attempts().length }}</p>
          </div>
          <div class="card p-5">
            <p class="text-xs mb-1" style="color:#948da3">Score moyen</p>
            <p class="text-3xl font-bold font-display" style="color:#f5a524">{{ avgScore() }}%</p>
          </div>
        </div>

        <!-- Course progress -->
        <div class="card p-6 mb-6 reveal stagger-2">
          <h2 class="text-sm font-bold mb-4 font-display" style="color:#221f2c">Progression par cours</h2>
          <div *ngIf="loading()" class="space-y-4">
            <div *ngFor="let _ of [1,2,3]" class="h-10 rounded-xl skeleton"></div>
          </div>
          <div *ngIf="!loading()" class="space-y-4">
            <div *ngFor="let e of enrollments()">
              <div class="flex items-center justify-between mb-1.5">
                <div>
                  <span class="text-sm font-medium" style="color:#221f2c">{{ e.course.title }}</span>
                  <span class="ml-2 badge-cat">{{ e.course.category }}</span>
                </div>
                <span class="text-sm font-bold" [style.color]="e.completed ? '#1f9d6f' : '#8b6ef2'">
                  {{ e.progressPercentage }}%
                </span>
              </div>
              <div class="progress-track">
                <div class="progress-fill" [style.background]="e.completed ? 'linear-gradient(90deg,#6ee7b7,#34d399)' : ''" [style.width.%]="e.progressPercentage"></div>
              </div>
            </div>
            <div *ngIf="enrollments().length === 0" class="text-center py-8 text-sm" style="color:#948da3">
              Aucun cours inscrit
            </div>
          </div>
        </div>

        <!-- Quiz attempts -->
        <div class="card p-6 reveal stagger-3">
          <h2 class="text-sm font-bold mb-4 font-display" style="color:#221f2c">Historique des quiz</h2>
          <div *ngIf="attempts().length === 0" class="text-center py-8 text-sm" style="color:#948da3">
            Aucun quiz passé
          </div>
          <div class="space-y-3">
            <div *ngFor="let a of attempts()" class="quiz-row">
              <div class="quiz-badge" [style.background]="a.passed ? 'linear-gradient(135deg,#6ee7b7,#34d399)' : 'linear-gradient(135deg,#fb92ae,#f25c78)'">
                <svg *ngIf="a.passed" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                <svg *ngIf="!a.passed" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </div>
              <div class="flex-1">
                <p class="text-sm font-semibold" style="color:#221f2c">{{ a.quiz.title }}</p>
                <p class="text-xs" style="color:#948da3">{{ a.quiz.course.title }}</p>
              </div>
              <div class="text-right">
                <p class="text-sm font-bold" [style.color]="a.passed ? '#1f9d6f' : '#f25c78'">
                  {{ a.score }}/{{ a.maxScore }}
                </p>
                <p class="text-xs" style="color:#948da3">{{ a.attemptedAt | date:'dd/MM/yy' }}</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  `,
  styles: [`
    .badge-cat { font-size:11px; padding:2px 9px; border-radius:999px; background:rgba(167,139,250,.14); color:#7c5ce0; font-weight:600; }
    .quiz-row { display:flex; align-items:center; gap:14px; padding:13px; border-radius:16px; background:rgba(167,139,250,.04); border:1px solid rgba(167,139,250,.1); transition:all .2s; }
    .quiz-row:hover { border-color:rgba(167,139,250,.26); background:rgba(167,139,250,.07); }
    .quiz-badge { width:38px; height:38px; border-radius:13px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
  `],
})
export class StudentProgress implements OnInit {
  loading = signal(true);
  enrollments = signal<Enrollment[]>([]);
  attempts = signal<Attempt[]>([]);

  get role() { return this.auth.user()?.role ?? 'STUDENT'; }
  get userName() { return this.auth.user()?.name ?? ''; }
  completedCount = () => this.enrollments().filter(e => e.completed).length;
  avgScore = () => {
    const a = this.attempts();
    if (!a.length) return 0;
    return Math.round(a.reduce((s, x) => s + (x.score / x.maxScore) * 100, 0) / a.length);
  };

  constructor(private auth: AuthService, private api: ApiService) {}

  ngOnInit() {
    this.api.get<Enrollment[]>('/enrollments/my').subscribe({
      next: data => { this.enrollments.set(data ?? []); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
    this.api.get<Attempt[]>('/quiz-attempts/my').subscribe({
      next: data => this.attempts.set(data ?? []),
      error: () => {},
    });
  }
}
