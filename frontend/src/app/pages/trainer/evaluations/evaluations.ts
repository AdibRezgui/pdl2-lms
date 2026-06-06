import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth';
import { ApiService } from '../../../core/services/api';
import { Sidebar } from '../../../shared/sidebar/sidebar';

interface Course { id: string; title: string }
interface Question { text: string; options: string[]; correctAnswer: number }
interface GeneratedQuiz { title: string; questions: Question[] }

@Component({
  selector: 'app-trainer-evaluations',
  standalone: true,
  imports: [CommonModule, FormsModule, Sidebar],
  template: `
    <div class="flex h-screen overflow-hidden" style="background:linear-gradient(160deg,#fffdfb 0%,#fdf2f8 60%,#f6f0ff 100%)">
      <app-sidebar [role]="role" [userName]="userName"></app-sidebar>
      <main class="flex-1 overflow-y-auto p-7">
        <div class="mb-6 reveal">
          <h1 class="font-display text-2xl font-bold" style="color:#221f2c">Évaluations</h1>
          <p class="text-sm mt-0.5" style="color:#948da3">Générez et gérez vos quiz</p>
        </div>

        <!-- Generator -->
        <div class="card p-6 mb-6 reveal stagger-1">
          <h2 class="text-sm font-bold mb-4 flex items-center gap-2" style="color:#221f2c">
            <span class="ai-chip">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4"/><line x1="8" y1="16" x2="8" y2="16"/><line x1="16" y1="16" x2="16" y2="16"/></svg>
            </span>
            Générateur de quiz IA
          </h2>
          <div class="grid grid-cols-3 gap-4 mb-4">
            <div>
              <label class="form-label">Cours *</label>
              <select [(ngModel)]="selectedCourse" class="input-field text-sm">
                <option value="">Sélectionner un cours</option>
                <option *ngFor="let c of courses()" [value]="c.id">{{ c.title }}</option>
              </select>
            </div>
            <div>
              <label class="form-label">Sujet / Thème</label>
              <input [(ngModel)]="topic" type="text" class="input-field text-sm" placeholder="Ex : Variables en Python" />
            </div>
            <div>
              <label class="form-label">Nombre de questions</label>
              <select [(ngModel)]="numQuestions" class="input-field text-sm">
                <option [value]="3">3</option>
                <option [value]="5">5</option>
                <option [value]="10">10</option>
              </select>
            </div>
          </div>
          <button (click)="generate()" [disabled]="generating() || !selectedCourse" class="btn-primary">
            <svg *ngIf="!generating()" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l1.6 5.3L19 9l-5.4 1.7L12 16l-1.6-5.3L5 9l5.4-1.7z"/></svg>
            <svg *ngIf="generating()" class="spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
            {{ generating() ? 'Génération...' : 'Générer le quiz' }}
          </button>
        </div>

        <!-- Preview & Save -->
        <div *ngIf="generated()" class="card p-6 mb-6 bounce-in">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-sm font-bold flex items-center gap-2" style="color:#221f2c">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" stroke-width="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
              {{ generated()!.title }}
            </h2>
            <div class="flex gap-2">
              <button (click)="generated.set(null)" class="btn-secondary text-xs">Annuler</button>
              <button (click)="saveQuiz()" [disabled]="saving()" class="btn-primary text-xs">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                {{ saving() ? 'Enregistrement...' : 'Enregistrer' }}
              </button>
            </div>
          </div>
          <div class="space-y-4">
            <div *ngFor="let q of generated()!.questions; let i = index" class="question-card">
              <p class="text-sm font-semibold mb-2" style="color:#221f2c">{{ i+1 }}. {{ q.text }}</p>
              <ul class="space-y-1.5">
                <li *ngFor="let opt of q.options; let j = index" class="option-row" [class.option-correct]="j === q.correctAnswer">
                  {{ opt }}
                  <svg *ngIf="j === q.correctAnswer" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#1f9d6f" stroke-width="2.5" style="margin-left:8px"><polyline points="20 6 9 17 4 12"/></svg>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div *ngIf="saved()" class="ok-banner bounce-in">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
          Quiz enregistré avec succès
        </div>
      </main>
    </div>
  `,
  styles: [`
    .ai-chip { width:26px; height:26px; border-radius:9px; background:linear-gradient(135deg,#a78bfa,#fb7299); display:flex; align-items:center; justify-content:center; }
    .form-label { display:block; font-size:12px; font-weight:600; color:#948da3; letter-spacing:.04em; text-transform:uppercase; margin-bottom:6px; }
    .question-card { padding:16px; border-radius:18px; background:rgba(167,139,250,.045); border:1px solid rgba(167,139,250,.12); }
    .option-row { display:flex; align-items:center; font-size:12.5px; padding:9px 13px; border-radius:12px; background:rgba(167,139,250,.06); color:#948da3; }
    .option-correct { background:rgba(110,231,183,.16); color:#1f9d6f; font-weight:600; }
    .ok-banner { display:flex; align-items:center; gap:8px; padding:11px 16px; border-radius:14px; background:rgba(110,231,183,.12); border:1px solid rgba(110,231,183,.3); color:#1f9d6f; font-size:13px; }
    .spin { animation:spin 1s linear infinite; }
    @keyframes spin { to { transform:rotate(360deg); } }
  `],
})
export class TrainerEvaluations implements OnInit {
  courses = signal<Course[]>([]);
  generated = signal<GeneratedQuiz | null>(null);
  generating = signal(false);
  saving = signal(false);
  saved = signal(false);
  selectedCourse = '';
  topic = '';
  numQuestions = 5;

  get role() { return this.auth.user()?.role ?? 'TRAINER'; }
  get userName() { return this.auth.user()?.name ?? ''; }

  constructor(private auth: AuthService, private api: ApiService) {}

  ngOnInit() {
    this.api.get<Course[]>('/courses/my').subscribe({
      next: data => this.courses.set(data ?? []),
    });
  }

  generate() {
    if (!this.selectedCourse) return;
    this.generating.set(true);
    this.saved.set(false);
    this.api.post<GeneratedQuiz>('/ai/generate-quiz', { courseId: this.selectedCourse, topic: this.topic, numQuestions: this.numQuestions }).subscribe({
      next: data => { this.generated.set(data); this.generating.set(false); },
      error: () => this.generating.set(false),
    });
  }

  saveQuiz() {
    const q = this.generated();
    if (!q) return;
    this.saving.set(true);
    const payload = { title: q.title, courseId: this.selectedCourse, questions: q.questions };
    this.api.post('/quizzes', payload).subscribe({
      next: () => { this.saved.set(true); this.generated.set(null); this.saving.set(false); },
      error: () => this.saving.set(false),
    });
  }
}
