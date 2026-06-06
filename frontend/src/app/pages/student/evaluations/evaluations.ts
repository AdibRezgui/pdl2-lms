import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth';
import { ApiService } from '../../../core/services/api';
import { Sidebar } from '../../../shared/sidebar/sidebar';

interface Question { id?: string; text: string; options: string[]; correctAnswer: number }
interface Quiz { id: string; title: string; course: { title: string } }
interface QuizResult { score: number; maxScore: number; passed: boolean; feedback?: string }

@Component({
  selector: 'app-student-evaluations',
  standalone: true,
  imports: [CommonModule, Sidebar],
  template: `
    <div class="flex h-screen overflow-hidden" style="background:linear-gradient(160deg,#fffdfb 0%,#fdf2f8 60%,#f6f0ff 100%)">
      <app-sidebar [role]="role" [userName]="userName"></app-sidebar>
      <main class="flex-1 overflow-y-auto p-7">
        <div class="mb-7 reveal">
          <h1 class="font-display text-2xl font-bold" style="color:#221f2c">Évaluations</h1>
          <p class="text-sm mt-0.5" style="color:#948da3">Quiz disponibles dans vos cours</p>
        </div>

        <!-- Result banner -->
        <div *ngIf="result()" class="result-banner mb-6 bounce-in" [class.ok]="result()!.passed" [class.bad]="!result()!.passed">
          <div class="flex items-center gap-3">
            <div class="result-icon" [style.background]="result()!.passed ? 'linear-gradient(135deg,#6ee7b7,#34d399)' : 'linear-gradient(135deg,#fb92ae,#f25c78)'">
              <svg *ngIf="result()!.passed" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              <svg *ngIf="!result()!.passed" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            </div>
            <div>
              <p class="font-bold font-display" style="color:#221f2c">{{ result()!.passed ? 'Félicitations !' : 'Continuez vos efforts !' }}</p>
              <p class="text-sm" style="color:#948da3">Score: {{ result()!.score }}/{{ result()!.maxScore }} — {{ result()!.passed ? 'Réussi' : 'Échoué' }}</p>
            </div>
          </div>
        </div>

        <!-- Quiz in progress -->
        <div *ngIf="activeQuiz() && !result()" class="card p-6 mb-6 reveal">
          <div class="flex items-center justify-between mb-6">
            <h2 class="font-bold font-display" style="color:#221f2c">{{ activeQuiz()!.title }}</h2>
            <button (click)="activeQuiz.set(null)" class="text-xs cancel-btn">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              Annuler
            </button>
          </div>
          <div class="space-y-6">
            <div *ngFor="let q of questions(); let i = index" class="question-card">
              <p class="text-sm font-semibold mb-3" style="color:#221f2c">{{ i+1 }}. {{ q.text }}</p>
              <div class="space-y-2">
                <button *ngFor="let opt of q.options; let j = index"
                  (click)="answers[i] = j"
                  class="option-btn"
                  [class.selected]="answers[i] === j">
                  {{ opt }}
                </button>
              </div>
            </div>
          </div>
          <button (click)="submitQuiz()" [disabled]="submitting()" class="btn-primary w-full justify-center mt-6">
            {{ submitting() ? 'Envoi...' : 'Soumettre le quiz' }}
          </button>
        </div>

        <!-- Quiz list -->
        <div *ngIf="!activeQuiz()" class="space-y-3 reveal stagger-1">
          <div *ngIf="loading()" class="space-y-3">
            <div *ngFor="let _ of [1,2,3]" class="card p-4 h-16 skeleton"></div>
          </div>
          <div *ngFor="let q of quizzes()" class="card lift-on-hover p-4 flex items-center justify-between">
            <div>
              <p class="text-sm font-semibold" style="color:#221f2c">{{ q.title }}</p>
              <p class="text-xs" style="color:#948da3">{{ q.course.title }}</p>
            </div>
            <button (click)="startQuiz(q)" class="btn-primary text-xs" style="height:38px;padding:0 20px">
              Commencer
            </button>
          </div>
          <div *ngIf="!loading() && quizzes().length === 0" class="card p-12 text-center bounce-in">
            <svg class="mx-auto mb-3" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#c4bdd6" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
            <p class="font-semibold" style="color:#221f2c">Aucun quiz disponible</p>
            <p class="text-xs mt-1" style="color:#948da3">Inscrivez-vous à des cours pour accéder aux évaluations</p>
          </div>
        </div>
      </main>
    </div>
  `,
  styles: [`
    .result-banner { padding:16px; border-radius:18px; border:1px solid; }
    .result-banner.ok { background:rgba(110,231,183,.12); border-color:rgba(110,231,183,.32); }
    .result-banner.bad { background:rgba(242,92,120,.08); border-color:rgba(242,92,120,.24); }
    .result-icon { width:42px; height:42px; border-radius:14px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
    .cancel-btn { display:flex; align-items:center; gap:5px; color:#948da3; background:none; border:none; cursor:pointer; transition:color .2s; font-family:inherit; }
    .cancel-btn:hover { color:#f25c78; }
    .question-card { padding:16px; border-radius:18px; background:rgba(167,139,250,.04); border:1px solid rgba(167,139,250,.12); }
    .option-btn { display:block; width:100%; text-align:left; padding:11px 16px; border-radius:14px; border:1px solid rgba(167,139,250,.16); font-size:13px; color:#4a4458; background:#fff; cursor:pointer; transition:all .22s cubic-bezier(.16,1,.3,1); font-family:inherit; }
    .option-btn:hover { border-color:rgba(167,139,250,.4); background:rgba(167,139,250,.05); }
    .option-btn.selected { border-color:#a78bfa; background:rgba(167,139,250,.14); color:#221f2c; font-weight:600; box-shadow:0 4px 16px rgba(167,139,250,.18); }
  `],
})
export class StudentEvaluations implements OnInit {
  loading = signal(true);
  quizzes = signal<Quiz[]>([]);
  activeQuiz = signal<Quiz | null>(null);
  questions = signal<Question[]>([]);
  result = signal<QuizResult | null>(null);
  submitting = signal(false);
  answers: Record<number, number> = {};

  get role() { return this.auth.user()?.role ?? 'STUDENT'; }
  get userName() { return this.auth.user()?.name ?? ''; }

  constructor(private auth: AuthService, private api: ApiService) {}

  ngOnInit() {
    this.api.get<Quiz[]>('/quizzes/my-courses').subscribe({
      next: data => { this.quizzes.set(data ?? []); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  startQuiz(quiz: Quiz) {
    this.result.set(null);
    this.answers = {};
    this.api.get<Question[]>(`/quizzes/${quiz.id}/questions`).subscribe({
      next: data => {
        this.questions.set(data ?? []);
        this.activeQuiz.set(quiz);
      },
    });
  }

  submitQuiz() {
    const quiz = this.activeQuiz();
    if (!quiz) return;
    this.submitting.set(true);
    const payload = { answers: this.answers };
    this.api.post<QuizResult>(`/quizzes/${quiz.id}/submit`, payload).subscribe({
      next: res => {
        this.result.set(res);
        this.activeQuiz.set(null);
        this.submitting.set(false);
      },
      error: () => this.submitting.set(false),
    });
  }
}
