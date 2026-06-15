import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth';
import { ApiService } from '../../../core/services/api';
import { ToastService } from '../../../core/services/toast';
import { Sidebar } from '../../../shared/sidebar/sidebar';

interface Course { id: string; title: string; category: string; }
interface QuizInfo {
  id: string; title: string; moduleId: string | null;
  questionsCount: number; timeLimit: number; passingScore: number;
  maxAttempts: number; createdAt: string;
  attemptsCount: number; passRate: number; avgScore: number;
}
interface CourseData { course: Course; quizzes: QuizInfo[]; loading: boolean; open: boolean; }
interface ManualQuestion { text: string; options: string[]; correct: number; correctAnswers: number[]; }

@Component({
  selector: 'app-trainer-evaluations',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, Sidebar],
  template: `
    <div class="flex h-screen overflow-hidden" style="background:linear-gradient(160deg,#f5fdfe 0%,#edf9fb 60%,#daf2f6 100%)">
      <app-sidebar [role]="role" [userName]="userName"></app-sidebar>

      <main class="flex-1 overflow-y-auto">
        <!-- Hero header -->
        <div class="page-hero">
          <div>
            <h1 class="font-display text-2xl font-bold" style="color:#1a2d3a">Évaluations</h1>
            <p class="text-sm mt-0.5" style="color:#5a7a8a">Quiz finaux de cours — les quiz de modules se gèrent dans le contenu du cours</p>
          </div>
          <div class="flex items-center gap-3 flex-wrap">
            <div class="stat-pill">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#007A8A" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              <span class="stat-num">{{ totalQuizzes() }}</span><span class="stat-lbl">quiz</span>
            </div>
            <div class="stat-pill">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#00A8BC" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
              <span class="stat-num">{{ totalQuestions() }}</span><span class="stat-lbl">questions</span>
            </div>
            <div class="stat-pill">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#1f9d6f" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
              <span class="stat-num">{{ totalAttempts() }}</span><span class="stat-lbl">tentatives</span>
            </div>
          </div>
        </div>

        <div class="page-body">
          <div *ngIf="loading()" class="space-y-4">
            <div *ngFor="let _ of [1,2,3]" class="skeleton h-20 rounded-2xl"></div>
          </div>

          <div *ngIf="!loading() && courseData().length === 0" class="empty-state">
            <div class="empty-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#c4bdd6" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/></svg>
            </div>
            <p class="text-base font-semibold" style="color:#1a2d3a">Aucun cours</p>
            <a routerLink="/trainer/courses" class="btn-primary mt-4">Mes cours</a>
          </div>

          <!-- Course sections -->
          <div *ngFor="let cd of courseData(); let ci = index" class="course-section">
            <!-- Course row -->
            <div class="course-row" (click)="toggleCourse(ci)">
              <div class="course-dot" [style.background]="courseGradient(ci)"></div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-bold" style="color:#1a2d3a">{{ cd.course.title }}</p>
                <p class="text-xs mt-0.5" style="color:#5a7a8a">
                  {{ cd.loading ? 'Chargement...' : (cd.quizzes.length === 0 ? 'Aucun quiz final' : cd.quizzes.length + ' quiz final') }}
                  <span *ngIf="cd.course.category">· {{ cd.course.category }}</span>
                </p>
              </div>
              <span *ngIf="!cd.loading && cd.quizzes.length > 0" class="course-q-badge">{{ cd.quizzes.length }}</span>
              <div *ngIf="cd.loading" class="spinner-xs"></div>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#5a7a8a" stroke-width="2.5"
                [style.transform]="cd.open ? 'rotate(180deg)' : 'none'"
                style="transition:transform .22s;flex-shrink:0"><polyline points="6 9 12 15 18 9"/></svg>
              <a [routerLink]="'/trainer/courses/' + cd.course.id + '/content'"
                (click)="$event.stopPropagation()"
                class="manage-link" title="Gérer les modules et quiz de module">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                Modules
              </a>
              <button (click)="$event.stopPropagation(); openQuizModal(ci)" class="create-quiz-btn">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Créer un quiz
              </button>
            </div>

            <!-- Quiz list -->
            <div *ngIf="cd.open && !cd.loading" class="quiz-list">
              <div *ngIf="cd.quizzes.length === 0" class="quiz-empty">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#c4bdd6" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/></svg>
                <span class="text-xs" style="color:#5a7a8a">Aucun quiz.
                  <button (click)="openQuizModal(ci)" style="color:#007A8A;font-weight:600;background:none;border:none;cursor:pointer;font-family:inherit;font-size:12px">+ Créer un quiz</button>
                </span>
              </div>
              <div *ngFor="let quiz of cd.quizzes" class="quiz-card">
                <div class="quiz-icon-wrap">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00B4C6" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                </div>
                <div class="quiz-main">
                  <div class="flex items-center gap-2 flex-wrap">
                    <p class="quiz-title">{{ quiz.title }}</p>
                    <span class="course-badge">Quiz Final</span>
                  </div>
                  <div class="quiz-meta">
                    <span class="meta-item">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/></svg>
                      {{ quiz.questionsCount }} questions
                    </span>
                    <span class="meta-sep">·</span>
                    <span class="meta-item">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                      {{ quiz.timeLimit }} min
                    </span>
                    <span class="meta-sep">·</span>
                    <span class="meta-item" style="color:#d97706">{{ quiz.passingScore }}% requis</span>
                  </div>
                </div>
                <div class="quiz-stats">
                  <div class="stat-col"><span class="stat-val">{{ quiz.attemptsCount ?? 0 }}</span><span class="stat-key">tentatives</span></div>
                  <div class="stat-col" *ngIf="(quiz.attemptsCount ?? 0) > 0">
                    <span class="stat-val" [style.color]="(quiz.passRate ?? 0) >= 70 ? '#1f9d6f' : '#ef4444'">{{ quiz.passRate ?? 0 }}%</span>
                    <span class="stat-key">réussite</span>
                  </div>
                  <div class="stat-col" *ngIf="(quiz.attemptsCount ?? 0) > 0">
                    <span class="stat-val">{{ quiz.avgScore ?? 0 }}%</span><span class="stat-key">moy.</span>
                  </div>
                </div>
                <div class="quiz-actions">
                  <button (click)="deleteQuiz(quiz.id, ci)" class="action-btn action-del" title="Supprimer">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <!-- ── QUIZ CREATION MODAL ──────────────────────────────── -->
      <div *ngIf="quizModalOpen()" class="modal-backdrop" (click)="closeQuizModal()">
        <div class="quiz-modal" (click)="$event.stopPropagation()">

          <div class="qm-header">
            <div class="qm-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00B4C6" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            </div>
            <div>
              <p class="font-display font-bold text-base" style="color:#1a2d3a">Créer un quiz de cours</p>
              <p class="text-xs mt-0.5" style="color:#5a7a8a">
                <span class="scope-chip">Cours</span>{{ modalCourseTitle() }}
              </p>
            </div>
            <button (click)="closeQuizModal()" class="close-btn ml-auto">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>

          <div *ngIf="!quizGenResult()" class="qm-tabs">
            <button class="qm-tab" [class.qm-tab-active]="quizMode()==='AI'" (click)="quizMode.set('AI')">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/></svg>
              Générer avec l'IA
            </button>
            <button class="qm-tab" [class.qm-tab-active]="quizMode()==='MANUAL'" (click)="quizMode.set('MANUAL')">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              Créer manuellement
            </button>
          </div>

          <!-- Success -->
          <div *ngIf="quizGenResult()" class="qm-success">
            <div class="success-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#1f9d6f" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <p class="font-bold text-sm" style="color:#1a2d3a">Quiz créé avec succès !</p>
            <p class="text-xs mt-1" style="color:#5a7a8a">{{ quizGenResult()!.questionsCount }} questions · {{ quizGenResult()!.title }}</p>
            <button (click)="closeQuizModal()" class="btn-primary mt-4 justify-center" style="width:100%">Fermer</button>
          </div>

          <!-- AI mode -->
          <div *ngIf="!quizGenResult() && quizMode()==='AI'" class="qm-body">
            <p class="qm-section-label">Nombre de questions</p>
            <div class="count-selector">
              <button *ngFor="let n of [10,20,40]" class="count-btn" [class.count-active]="quizGenCount()===n" (click)="quizGenCount.set(n)">
                {{ n }}<span class="count-sub">{{ n===10?'~15 min':n===20?'~25 min':'~45 min' }}</span>
              </button>
            </div>
            <p class="qm-section-label mt-4">Type de questions</p>
            <div class="type-selector">
              <button *ngFor="let t of questionTypes" class="qtype-btn" [class.qtype-active]="quizQuestionType()===t.value" (click)="quizQuestionType.set(t.value)">{{ t.label }}</button>
            </div>
            <div *ngIf="quizGenError()" class="err-banner mt-3">{{ quizGenError() }}</div>
            <button (click)="generateQuiz()" [disabled]="generatingQuiz()" class="btn-primary w-full justify-center mt-4" style="height:44px">
              <div *ngIf="generatingQuiz()" class="spinner-sm"></div>
              <svg *ngIf="!generatingQuiz()" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4"/></svg>
              {{ generatingQuiz() ? "Génération en cours..." : "Générer le quiz avec l'IA" }}
            </button>
          </div>

          <!-- Manual mode -->
          <div *ngIf="!quizGenResult() && quizMode()==='MANUAL'" class="qm-body">
            <div *ngIf="manualQuestions().length > 0" class="mb-3">
              <p class="qm-section-label">Questions ({{ manualQuestions().length }})</p>
              <div class="manual-q-list">
                <div *ngFor="let q of manualQuestions(); let i = index" class="manual-q-item">
                  <span class="manual-q-num">Q{{ i+1 }}</span>
                  <span class="manual-q-text">{{ q.text }}</span>
                  <span *ngIf="q.correctAnswers.length > 1" class="multi-badge">Multi</span>
                  <button (click)="removeManualQuestion(i)" class="close-btn" style="width:24px;height:24px;flex-shrink:0">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                </div>
              </div>
              <div class="qm-divider"></div>
            </div>
            <p class="qm-section-label">{{ manualQuestions().length===0 ? 'Première question' : 'Ajouter une question' }}</p>
            <div class="field">
              <label class="flabel">Énoncé *</label>
              <textarea [(ngModel)]="manualQText" rows="2" class="input-field resize-none" placeholder="Question..."></textarea>
            </div>
            <!-- Option count selector -->
            <div class="field">
              <label class="flabel">Nombre de choix</label>
              <div class="opt-count-row">
                <button *ngFor="let n of [2,3,4,5,6]"
                  class="opt-count-btn" [class.opt-count-active]="manualQOptionCount()===n"
                  (click)="setOptionCount(n)">{{ n }}</button>
              </div>
            </div>
            <div class="field">
              <label class="flabel">Options (cliquer = bonne réponse, plusieurs choix possibles)</label>
              <div class="manual-opts">
                <div *ngFor="let idx of optionIndices()" class="manual-opt-row">
                  <button class="opt-letter-btn" [class.opt-letter-correct]="manualQCorrects().has(idx)" (click)="toggleCorrect(idx)">{{ optLetter(idx) }}</button>
                  <input [ngModel]="manualQOptions[idx]" (ngModelChange)="manualQOptions[idx]=$event" class="input-field" style="height:34px;font-size:13px" [placeholder]="'Option '+optLetter(idx)+'...'" />
                </div>
              </div>
              <p class="text-xs mt-1" style="color:#5a7a8a">
                {{ manualQCorrects().size > 1 ? manualQCorrects().size + ' bonnes réponses sélectionnées' : '1 bonne réponse sélectionnée' }}
              </p>
            </div>
            <div *ngIf="manualAddError()" class="err-banner mb-3">{{ manualAddError() }}</div>
            <button (click)="addManualQuestion()" class="btn-secondary w-full justify-center mb-4" style="height:40px">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Ajouter cette question
            </button>
            <div *ngIf="manualQuestions().length > 0">
              <div *ngIf="manualQuizError()" class="err-banner mb-3">{{ manualQuizError() }}</div>
              <button (click)="createManualQuiz()" [disabled]="creatingManualQuiz()" class="btn-primary w-full justify-center" style="height:44px">
                <div *ngIf="creatingManualQuiz()" class="spinner-sm"></div>
                <svg *ngIf="!creatingManualQuiz()" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/></svg>
                {{ creatingManualQuiz() ? "Création..." : "Créer le quiz (" + manualQuestions().length + " question" + (manualQuestions().length > 1 ? "s" : "") + ")" }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page-hero { display:flex; align-items:center; justify-content:space-between; padding:28px 32px 20px; border-bottom:1px solid rgba(0,180,198,.1); gap:16px; flex-wrap:wrap; background:rgba(255,253,251,.7); }
    .page-body { padding:24px 32px; display:flex; flex-direction:column; gap:12px; }
    .stat-pill { display:flex; align-items:center; gap:6px; padding:7px 14px; border-radius:999px; background:rgba(255,255,255,.8); border:1px solid rgba(0,180,198,.15); box-shadow:0 2px 8px rgba(0,180,198,.07); }
    .stat-num { font-size:15px; font-weight:800; color:#1a2d3a; font-family:'Fraunces',Georgia,serif; line-height:1; }
    .stat-lbl { font-size:11px; color:#5a7a8a; font-weight:500; }
    .course-section { background:rgba(255,255,255,.72); border:1px solid rgba(0,180,198,.12); border-radius:20px; overflow:hidden; transition:box-shadow .22s; }
    .course-section:hover { box-shadow:0 4px 20px rgba(0,180,198,.1); }
    .course-row { display:flex; align-items:center; gap:12px; padding:16px 20px; cursor:pointer; transition:background .18s; }
    .course-row:hover { background:rgba(0,180,198,.04); }
    .course-dot { width:10px; height:10px; border-radius:50%; flex-shrink:0; }
    .course-q-badge { padding:2px 9px; border-radius:999px; background:rgba(0,180,198,.12); color:#007A8A; font-size:11px; font-weight:700; flex-shrink:0; }
    .manage-link { display:inline-flex; align-items:center; gap:5px; padding:6px 10px; border-radius:9px; background:rgba(148,141,163,.08); border:1px solid rgba(148,141,163,.18); color:#5a7a8a; font-size:11px; font-weight:600; text-decoration:none; white-space:nowrap; flex-shrink:0; transition:all .18s; }
    .manage-link:hover { background:rgba(148,141,163,.16); color:#5c5470; }
    .create-quiz-btn { display:inline-flex; align-items:center; gap:5px; padding:6px 12px; border-radius:10px; background:rgba(0,180,198,.1); border:1px solid rgba(0,180,198,.2); color:#007A8A; font-size:11px; font-weight:600; cursor:pointer; font-family:inherit; white-space:nowrap; flex-shrink:0; transition:all .18s; }
    .create-quiz-btn:hover { background:rgba(0,180,198,.2); }
    .spinner-xs { width:16px; height:16px; border:2px solid rgba(0,180,198,.2); border-top-color:#00B4C6; border-radius:50%; animation:spin .7s linear infinite; flex-shrink:0; }
    .quiz-list { border-top:1px solid rgba(0,180,198,.08); padding:8px 16px 12px; display:flex; flex-direction:column; gap:6px; }
    .quiz-empty { display:flex; align-items:center; gap:10px; padding:14px 8px; }
    .quiz-card { display:flex; align-items:center; gap:14px; padding:13px 12px; border-radius:14px; background:rgba(0,180,198,.035); border:1px solid rgba(0,180,198,.1); transition:all .2s; }
    .quiz-card:hover { background:rgba(0,180,198,.07); border-color:rgba(0,180,198,.2); }
    .quiz-icon-wrap { width:36px; height:36px; border-radius:12px; background:rgba(0,180,198,.1); display:flex; align-items:center; justify-content:center; flex-shrink:0; }
    .quiz-main { flex:1; min-width:0; }
    .quiz-title { font-size:13px; font-weight:700; color:#1a2d3a; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; max-width:100%; }
    .module-badge { font-size:10px; font-weight:700; padding:1px 7px; border-radius:999px; background:rgba(245,165,36,.1); color:#d97706; border:1px solid rgba(245,165,36,.2); flex-shrink:0; }
    .course-badge { font-size:10px; font-weight:700; padding:1px 7px; border-radius:999px; background:rgba(0,180,198,.1); color:#007A8A; border:1px solid rgba(0,180,198,.2); flex-shrink:0; }
    .quiz-meta { display:flex; align-items:center; gap:5px; margin-top:4px; flex-wrap:wrap; }
    .meta-item { display:flex; align-items:center; gap:3px; font-size:11px; color:#5a7a8a; }
    .meta-sep { font-size:11px; color:#c4bdd6; }
    .quiz-stats { display:flex; gap:16px; flex-shrink:0; }
    .stat-col { display:flex; flex-direction:column; align-items:center; min-width:44px; }
    .stat-val { font-size:14px; font-weight:800; color:#1a2d3a; font-family:'Fraunces',Georgia,serif; line-height:1; }
    .stat-key { font-size:10px; color:#5a7a8a; margin-top:2px; white-space:nowrap; }
    .quiz-actions { display:flex; gap:6px; flex-shrink:0; }
    .action-btn { width:30px; height:30px; border-radius:9px; border:none; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:all .18s; }
    .action-del { background:rgba(242,92,120,.07); color:#f25c78; }
    .action-del:hover { background:rgba(242,92,120,.18); }
    .empty-state { display:flex; flex-direction:column; align-items:center; gap:6px; padding:60px 20px; text-align:center; }
    .empty-icon { width:64px; height:64px; border-radius:22px; background:rgba(0,180,198,.07); display:flex; align-items:center; justify-content:center; margin-bottom:8px; }
    .skeleton { background:linear-gradient(90deg,rgba(0,180,198,.08) 25%,rgba(0,180,198,.16) 50%,rgba(0,180,198,.08) 75%); background-size:200% 100%; animation:shimmer 1.5s infinite; }
    @keyframes shimmer { to { background-position:-200% 0; } }
    @keyframes spin { to { transform:rotate(360deg); } }
    /* Modal */
    .modal-backdrop { position:fixed; inset:0; background:rgba(34,31,44,.45); backdrop-filter:blur(4px); z-index:100; display:flex; align-items:center; justify-content:center; animation:fadeIn .18s ease; }
    @keyframes fadeIn { from{opacity:0}to{opacity:1} }
    .quiz-modal { background:#f5fdfe; border-radius:24px; width:480px; max-width:calc(100vw - 32px); max-height:90vh; overflow-y:auto; box-shadow:0 32px 80px rgba(34,31,44,.22); border:1px solid rgba(0,180,198,.18); animation:slideUp .22s cubic-bezier(.16,1,.3,1); }
    @keyframes slideUp { from{transform:translateY(20px);opacity:0}to{transform:translateY(0);opacity:1} }
    .qm-header { display:flex; align-items:center; gap:12px; padding:20px 22px 16px; border-bottom:1px solid rgba(0,180,198,.1); position:sticky; top:0; background:#f5fdfe; z-index:1; }
    .qm-icon { width:40px; height:40px; border-radius:14px; background:rgba(0,180,198,.1); display:flex; align-items:center; justify-content:center; flex-shrink:0; }
    .scope-chip { font-size:10px; font-weight:700; padding:2px 8px; border-radius:999px; background:rgba(0,180,198,.14); color:#007A8A; margin-right:6px; }
    .close-btn { width:30px; height:30px; border-radius:9px; background:rgba(0,180,198,.08); border:none; color:#5a7a8a; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:all .2s; }
    .close-btn:hover { background:rgba(242,92,120,.12); color:#f25c78; }
    .qm-tabs { display:flex; border-bottom:1px solid rgba(0,180,198,.1); position:sticky; top:76px; background:#f5fdfe; z-index:1; }
    .qm-tab { flex:1; padding:11px 8px; border:none; background:transparent; cursor:pointer; font-family:inherit; font-size:12px; font-weight:600; color:#5a7a8a; display:flex; align-items:center; justify-content:center; gap:6px; border-bottom:2px solid transparent; transition:all .2s; }
    .qm-tab:hover { color:#007A8A; }
    .qm-tab-active { color:#007A8A !important; border-bottom-color:#00B4C6 !important; }
    .qm-body { padding:20px 22px 22px; }
    .qm-section-label { font-size:11px; font-weight:700; color:#5a7a8a; text-transform:uppercase; letter-spacing:.05em; margin-bottom:8px; display:block; }
    .count-selector { display:flex; gap:10px; }
    .count-btn { flex:1; display:flex; flex-direction:column; align-items:center; gap:3px; padding:12px 8px; border-radius:14px; border:2px solid rgba(0,180,198,.18); background:transparent; cursor:pointer; font-family:inherit; font-size:22px; font-weight:700; color:#1a2d3a; transition:all .22s; }
    .count-btn:hover { border-color:rgba(0,180,198,.4); }
    .count-active { border-color:#00B4C6 !important; background:rgba(0,180,198,.1) !important; color:#007A8A !important; }
    .count-sub { font-size:11px; font-weight:500; color:#5a7a8a; }
    .count-active .count-sub { color:#00B4C6; }
    .type-selector { display:flex; gap:8px; }
    .qtype-btn { flex:1; padding:9px 8px; border-radius:12px; border:1.5px solid rgba(0,180,198,.2); background:transparent; cursor:pointer; font-family:inherit; font-size:12px; font-weight:600; color:#5a7a8a; transition:all .2s; }
    .qtype-btn:hover { border-color:rgba(0,180,198,.4); }
    .qtype-active { border-color:#00B4C6 !important; background:rgba(0,180,198,.1) !important; color:#007A8A !important; }
    .qm-success { padding:28px 22px; display:flex; flex-direction:column; align-items:center; text-align:center; gap:4px; }
    .success-icon { width:56px; height:56px; border-radius:20px; background:rgba(110,231,183,.12); border:1px solid rgba(110,231,183,.3); display:flex; align-items:center; justify-content:center; margin-bottom:8px; }
    .qm-divider { height:1px; background:rgba(0,180,198,.12); margin:12px 0; }
    .manual-q-list { display:flex; flex-direction:column; gap:6px; }
    .manual-q-item { display:flex; align-items:center; gap:8px; padding:8px 10px; border-radius:10px; background:rgba(0,180,198,.05); border:1px solid rgba(0,180,198,.1); }
    .manual-q-num { width:22px; height:22px; border-radius:7px; background:rgba(0,180,198,.15); color:#007A8A; font-size:10px; font-weight:700; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
    .manual-q-text { font-size:12px; color:#2c3d4e; flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    .manual-opts { display:flex; flex-direction:column; gap:6px; }
    .manual-opt-row { display:flex; align-items:center; gap:8px; }
    .opt-letter-btn { width:30px; height:34px; border-radius:8px; background:rgba(0,180,198,.08); border:1.5px solid rgba(0,180,198,.18); color:#5a7a8a; font-size:12px; font-weight:700; cursor:pointer; display:flex; align-items:center; justify-content:center; flex-shrink:0; transition:all .18s; font-family:inherit; }
    .opt-letter-btn:hover { background:rgba(0,180,198,.15); }
    .opt-letter-correct { background:rgba(0,180,198,.18) !important; border-color:#00B4C6 !important; color:#007A8A !important; }
    .opt-count-row { display:flex; gap:6px; }
    .opt-count-btn { flex:1; padding:8px 4px; border-radius:10px; border:1.5px solid rgba(0,180,198,.18); background:transparent; cursor:pointer; font-family:inherit; font-size:13px; font-weight:700; color:#5a7a8a; transition:all .18s; }
    .opt-count-btn:hover { border-color:rgba(0,180,198,.35); color:#007A8A; }
    .opt-count-active { border-color:#00B4C6 !important; background:rgba(0,180,198,.1) !important; color:#007A8A !important; }
    .multi-badge { font-size:9px; font-weight:700; padding:1px 6px; border-radius:999px; background:rgba(245,165,36,.12); color:#d97706; border:1px solid rgba(245,165,36,.25); flex-shrink:0; }
    .spinner-sm { width:16px; height:16px; border:2px solid rgba(255,255,255,.3); border-top-color:#fff; border-radius:50%; animation:spin .7s linear infinite; }
    .field { margin-bottom:16px; }
    .flabel { display:block; font-size:11px; font-weight:700; color:#5a7a8a; text-transform:uppercase; letter-spacing:.04em; margin-bottom:6px; }
    .input-field { width:100%; padding:9px 12px; border-radius:12px; border:1px solid rgba(0,180,198,.2); background:rgba(255,255,255,.7); font-size:14px; color:#1a2d3a; font-family:inherit; outline:none; transition:border .2s; box-sizing:border-box; }
    .input-field:focus { border-color:#00B4C6; background:#fff; }
    .resize-none { resize:none; }
    .err-banner { padding:10px 14px; border-radius:12px; background:rgba(242,92,120,.08); border:1px solid rgba(242,92,120,.22); color:#f25c78; font-size:13px; }
    .btn-primary { display:inline-flex; align-items:center; gap:6px; padding:10px 18px; border-radius:14px; background:linear-gradient(135deg,#00B4C6,#00A8BC); border:none; color:white; font-size:13px; font-weight:700; cursor:pointer; font-family:inherit; transition:all .22s; box-shadow:0 4px 14px rgba(0,180,198,.3); white-space:nowrap; text-decoration:none; }
    .btn-primary:hover:not(:disabled) { transform:translateY(-1px); }
    .btn-primary:disabled { opacity:.45; cursor:default; transform:none; box-shadow:none; }
    .btn-secondary { display:inline-flex; align-items:center; gap:6px; padding:10px 18px; border-radius:14px; background:rgba(0,180,198,.1); border:1px solid rgba(0,180,198,.2); color:#007A8A; font-size:13px; font-weight:600; cursor:pointer; font-family:inherit; transition:all .22s; white-space:nowrap; }
    .btn-secondary:hover { background:rgba(0,180,198,.18); }
    .w-full { width:100%; }
    .ml-auto { margin-left:auto; }
  `],
})
export class TrainerEvaluations implements OnInit {
  courseData = signal<CourseData[]>([]);
  loading    = signal(true);

  totalQuizzes   = computed(() => this.courseData().reduce((s, c) => s + c.quizzes.length, 0));
  totalQuestions = computed(() => this.courseData().reduce((s, c) => s + c.quizzes.reduce((qs, q) => qs + (q.questionsCount ?? 0), 0), 0));
  totalAttempts  = computed(() => this.courseData().reduce((s, c) => s + c.quizzes.reduce((qs, q) => qs + (q.attemptsCount ?? 0), 0), 0));

  quizModalOpen      = signal(false);
  quizModalCourseIdx = signal(-1);
  quizMode           = signal<'AI' | 'MANUAL'>('AI');
  quizGenCount       = signal<number>(10);
  quizQuestionType   = signal<'SINGLE' | 'MIXED'>('SINGLE');
  generatingQuiz     = signal(false);
  quizGenError       = signal('');
  quizGenResult      = signal<{ title: string; questionsCount: number } | null>(null);
  manualQuestions    = signal<ManualQuestion[]>([]);
  manualQText        = '';
  manualQOptions     = ['', '', '', '', '', ''];
  manualQOptionCount = signal(4);
  manualQCorrects    = signal<Set<number>>(new Set([0]));
  optionIndices      = computed(() => Array.from({ length: this.manualQOptionCount() }, (_, i) => i));
  creatingManualQuiz = signal(false);
  manualQuizError    = signal('');
  manualAddError     = signal('');

  questionTypes = [
    { value: 'SINGLE' as const, label: 'Choix unique' },
    { value: 'MIXED'  as const, label: 'Mixte' },
  ];

  private gradients = [
    'linear-gradient(135deg,#00B4C6,#00A8BC)',
    'linear-gradient(135deg,#60a5fa,#00B4C6)',
    'linear-gradient(135deg,#34d399,#60a5fa)',
    'linear-gradient(135deg,#fbbf24,#00A8BC)',
    'linear-gradient(135deg,#f472b6,#00B4C6)',
  ];

  get role()     { return this.auth.user()?.role ?? 'TRAINER'; }
  get userName() { return this.auth.user()?.name ?? ''; }

  modalCourseTitle() {
    const idx = this.quizModalCourseIdx();
    return idx >= 0 ? (this.courseData()[idx]?.course?.title ?? '') : '';
  }

  constructor(private auth: AuthService, private api: ApiService, private toast: ToastService) {}

  ngOnInit() {
    this.api.get<Course[]>('/courses/my').subscribe({
      next: courses => {
        const list: CourseData[] = (courses ?? []).map(c => ({ course: c, quizzes: [], loading: true, open: true }));
        this.courseData.set(list);
        this.loading.set(false);
        list.forEach((_, ci) => {
          this.api.get<QuizInfo[]>(`/quizzes/course/${list[ci].course.id}`).subscribe({
            next: quizzes => this.courseData.update(arr => arr.map((cd, i) => i === ci ? { ...cd, quizzes: (quizzes ?? []).filter(q => !q.moduleId), loading: false } : cd)),
            error:         () => this.courseData.update(arr => arr.map((cd, i) => i === ci ? { ...cd, loading: false } : cd)),
          });
        });
      },
      error: () => this.loading.set(false),
    });
  }

  toggleCourse(idx: number) {
    this.courseData.update(arr => arr.map((cd, i) => i === idx ? { ...cd, open: !cd.open } : cd));
  }

  courseGradient(idx: number) { return this.gradients[idx % this.gradients.length]; }

  deleteQuiz(quizId: string, courseIdx: number) {
    this.toast.confirm('Supprimer ce quiz et toutes ses tentatives ?').then(ok => {
      if (!ok) return;
      this.api.delete(`/quizzes/${quizId}`).subscribe({
        next: () => {
          this.courseData.update(arr => arr.map((cd, i) =>
            i === courseIdx ? { ...cd, quizzes: cd.quizzes.filter(q => q.id !== quizId) } : cd
          ));
          this.toast.success('Quiz supprimé.');
        },
        error: () => this.toast.error('Impossible de supprimer ce quiz.'),
      });
    });
  }

  openQuizModal(courseIdx: number) {
    this.quizModalCourseIdx.set(courseIdx);
    this.quizMode.set('AI');
    this.quizGenCount.set(10);
    this.quizQuestionType.set('SINGLE');
    this.quizGenResult.set(null);
    this.quizGenError.set('');
    this.manualQuestions.set([]);
    this.manualQText = '';
    this.manualQOptions = ['', '', '', '', '', ''];
    this.manualQOptionCount.set(4);
    this.manualQCorrects.set(new Set([0]));
    this.manualQuizError.set('');
    this.manualAddError.set('');
    this.quizModalOpen.set(true);
  }

  closeQuizModal() {
    this.quizModalOpen.set(false);
    this.generatingQuiz.set(false);
    this.creatingManualQuiz.set(false);
  }

  generateQuiz() {
    const idx = this.quizModalCourseIdx();
    const cd  = this.courseData()[idx];
    if (!cd) return;
    this.generatingQuiz.set(true);
    this.quizGenError.set('');
    this.api.post<any>('/ai/generate-quiz-for', {
      scope: 'COURSE', scopeId: cd.course.id, courseId: cd.course.id,
      count: this.quizGenCount(), questionType: this.quizQuestionType(),
    }).subscribe({
      next: res => {
        this.generatingQuiz.set(false);
        if (res?.quizId) {
          this.quizGenResult.set({ title: res.title, questionsCount: res.questionsCount });
          const newQuiz: QuizInfo = {
            id: res.quizId, title: res.title, moduleId: null,
            questionsCount: res.questionsCount, timeLimit: res.timeLimit ?? 15,
            passingScore: 70, maxAttempts: 3, createdAt: new Date().toISOString(),
            attemptsCount: 0, passRate: 0, avgScore: 0,
          };
          this.courseData.update(arr => arr.map((c, i) => i === idx ? { ...c, quizzes: [...c.quizzes, newQuiz] } : c));
        } else {
          this.quizGenError.set(res?.error ?? 'Erreur lors de la génération.');
        }
      },
      error: () => { this.generatingQuiz.set(false); this.quizGenError.set('Service IA indisponible.'); },
    });
  }

  setOptionCount(n: number) {
    this.manualQOptionCount.set(n);
    // Remove correct answers that are out of range
    const current = new Set([...this.manualQCorrects()].filter(i => i < n));
    if (current.size === 0) current.add(0);
    this.manualQCorrects.set(current);
  }

  toggleCorrect(idx: number) {
    const s = new Set(this.manualQCorrects());
    if (s.has(idx)) {
      if (s.size > 1) s.delete(idx); // keep at least 1
    } else {
      s.add(idx);
    }
    this.manualQCorrects.set(s);
  }

  addManualQuestion() {
    this.manualAddError.set('');
    const count = this.manualQOptionCount();
    const usedOpts = this.manualQOptions.slice(0, count);
    if (!this.manualQText.trim()) { this.manualAddError.set("L'énoncé est obligatoire."); return; }
    if (usedOpts.some(o => !o.trim())) { this.manualAddError.set('Remplissez toutes les options.'); return; }
    const correctAnswers = [...this.manualQCorrects()].sort((a, b) => a - b);
    this.manualQuestions.update(list => [...list, {
      text: this.manualQText.trim(), options: [...usedOpts],
      correct: correctAnswers[0], correctAnswers,
    }]);
    this.manualQText = '';
    this.manualQOptions = ['', '', '', '', '', ''];
    this.manualQOptionCount.set(4);
    this.manualQCorrects.set(new Set([0]));
  }

  removeManualQuestion(i: number) {
    this.manualQuestions.update(list => list.filter((_, idx) => idx !== i));
  }

  createManualQuiz() {
    const qs  = this.manualQuestions();
    if (qs.length === 0) return;
    const idx = this.quizModalCourseIdx();
    const cd  = this.courseData()[idx];
    if (!cd) return;
    const timeLimit = Math.max(10, Math.ceil(qs.length * 1.5));
    this.creatingManualQuiz.set(true);
    this.manualQuizError.set('');
    this.api.post<any>('/quizzes', {
      courseId: cd.course.id, title: 'Quiz — ' + cd.course.title,
      timeLimit, passingScore: 70,
      questions: qs.map(q => ({ text: q.text, options: q.options, correct: q.correct, correctAnswers: q.correctAnswers })),
    }).subscribe({
      next: quiz => {
        this.creatingManualQuiz.set(false);
        if (quiz?.id) {
          this.quizGenResult.set({ title: quiz.title, questionsCount: qs.length });
          const newQuiz: QuizInfo = {
            id: quiz.id, title: quiz.title, moduleId: null,
            questionsCount: qs.length, timeLimit, passingScore: 70,
            maxAttempts: 3, createdAt: new Date().toISOString(),
            attemptsCount: 0, passRate: 0, avgScore: 0,
          };
          this.courseData.update(arr => arr.map((c, i) => i === idx ? { ...c, quizzes: [...c.quizzes, newQuiz] } : c));
        } else {
          this.manualQuizError.set('Erreur lors de la création.');
        }
      },
      error: () => { this.creatingManualQuiz.set(false); this.manualQuizError.set('Erreur lors de la création.'); },
    });
  }

  optLetter(i: number) { return 'ABCDEF'[i] ?? String(i + 1); }
}
