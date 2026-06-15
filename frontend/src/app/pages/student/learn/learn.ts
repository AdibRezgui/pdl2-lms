import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { AuthService } from '../../../core/services/auth';
import { ApiService } from '../../../core/services/api';
import { Sidebar } from '../../../shared/sidebar/sidebar';

interface Lesson {
  id: string; title: string; type: 'VIDEO' | 'PDF' | 'TEXT' | 'QUIZ';
  content?: string; videoUrl?: string; pdfUrl?: string;
  durationMinutes: number; sortOrder: number; free: boolean;
}
interface Module { id: string; title: string; description?: string; sortOrder: number; lessons: Lesson[]; locked: boolean; }
interface Course { id: string; title: string; description: string; level: string; category: string; trainerName: string }
interface Enrollment { id: string; course: { id: string }; progress: number; completed: boolean }

interface QuizQuestion {
  id: string; text: string; options: string[];
  correctAnswer: number; correctAnswers?: number[];
  explanation?: string; points: number; sortOrder: number;
}
interface ModuleQuiz {
  id: string; title: string; timeLimit: number; passingScore: number;
  maxAttempts: number; questions: QuizQuestion[]; moduleId: string | null;
}
interface AttemptData {
  id: string; score: number; passed: boolean;
  quiz: { id: string; moduleId: string | null; title: string; passingScore: number };
}
interface ModuleStatus { status: 'VALIDATED' | 'TO_REDO' | 'LOCKED' | 'OPEN'; score: number; }

@Component({
  selector: 'app-student-learn',
  standalone: true,
  imports: [CommonModule, RouterLink, Sidebar],
  template: `
    <div class="flex h-screen overflow-hidden" style="background:linear-gradient(160deg,#f5fdfe 0%,#edf9fb 60%,#daf2f6 100%)">
      <app-sidebar [role]="role" [userName]="userName" />

      <div class="flex flex-1 overflow-hidden">

        <!-- LEFT: Module / Lesson navigator -->
        <aside class="lesson-nav">
          <div class="nav-header">
            <a routerLink="/student/courses" class="back-btn">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg>
              Retour
            </a>
            <p class="course-nav-title">{{ course()?.title ?? '...' }}</p>
            <div class="mt-3">
              <div class="flex items-center justify-between mb-1">
                <span class="text-xs" style="color:#5a7a8a">Progression</span>
                <span class="text-xs font-bold" style="color:#0099AE">{{ progress() }}%</span>
              </div>
              <div class="prog-track"><div class="prog-fill" [style.width.%]="progress()"></div></div>
            </div>
          </div>

          <div class="nav-scroll">
            <div *ngIf="loading()" class="p-4 space-y-3">
              <div *ngFor="let _ of [1,2,3]" class="skeleton h-8 rounded-xl"></div>
            </div>

            <div *ngFor="let mod of modules(); let mi = index" class="module-block">
              <button class="module-header"
                [class.module-open]="openModules.has(mod.id)"
                [class.module-locked]="moduleStatuses()[mod.id]?.status === 'LOCKED'"
                (click)="toggleModule(mod.id, mi)">
                <div class="flex items-center gap-2 flex-1 min-w-0">
                  <svg *ngIf="moduleStatuses()[mod.id]?.status === 'LOCKED'"
                    width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#5a7a8a" stroke-width="2.5" style="flex-shrink:0">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                  <svg *ngIf="moduleStatuses()[mod.id]?.status !== 'LOCKED'"
                    width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
                    [style.transform]="openModules.has(mod.id) ? 'rotate(90deg)' : 'none'"
                    style="transition:transform .25s;flex-shrink:0"><polyline points="9 18 15 12 9 6"/></svg>
                  <span class="text-xs font-bold mod-title" [class.text-locked]="moduleStatuses()[mod.id]?.status === 'LOCKED'">{{ mod.title }}</span>
                </div>
                <ng-container [ngSwitch]="moduleStatuses()[mod.id]?.status">
                  <span *ngSwitchCase="'VALIDATED'" class="mod-badge mod-badge-validated">
                    <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
                    {{ moduleStatuses()[mod.id]?.score }}%
                  </span>
                  <span *ngSwitchCase="'TO_REDO'" class="mod-badge mod-badge-redo">
                    <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.51"/></svg>
                    {{ moduleStatuses()[mod.id]?.score }}%
                  </span>
                  <span *ngSwitchCase="'LOCKED'" class="mod-badge mod-badge-locked">Verrouillé</span>
                  <span *ngSwitchDefault class="text-xs" style="color:#5a7a8a;white-space:nowrap">{{ completedInModule(mod) }}/{{ mod.lessons.length }}</span>
                </ng-container>
              </button>

              <div *ngIf="openModules.has(mod.id) && moduleStatuses()[mod.id]?.status !== 'LOCKED'" class="lessons-list">
                <button *ngFor="let lesson of mod.lessons" class="lesson-row"
                  (click)="selectLesson(lesson)"
                  [class.lesson-active]="activeLesson()?.id === lesson.id && !activeQuizModuleId() && !activeFinalQuiz()"
                  [class.lesson-done]="completedLessons.has(lesson.id)">
                  <div class="lesson-icon" [style.background]="typeColor(lesson.type)">
                    <svg *ngIf="lesson.type==='VIDEO'" width="9" height="9" viewBox="0 0 24 24" fill="white"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                    <svg *ngIf="lesson.type==='PDF'" width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/></svg>
                    <svg *ngIf="lesson.type==='TEXT'" width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><line x1="17" y1="10" x2="3" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="17" y1="18" x2="3" y2="18"/></svg>
                    <svg *ngIf="lesson.type==='QUIZ'" width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                  </div>
                  <span class="lesson-title">{{ lesson.title }}</span>
                  <div class="ml-auto flex items-center gap-1.5">
                    <span class="text-xs" style="color:#c4bdd6">{{ lesson.durationMinutes }}m</span>
                    <svg *ngIf="completedLessons.has(lesson.id)" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#1f9d6f" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                  </div>
                </button>

                <!-- Quiz du module -->
                <button *ngIf="moduleQuizMap()[mod.id]" class="lesson-row quiz-module-btn"
                  (click)="selectModuleQuiz(mod.id)"
                  [class.lesson-active]="activeQuizModuleId() === mod.id">
                  <div class="lesson-icon" style="background:linear-gradient(135deg,#f5a524,#00A8BC)">
                    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5">
                      <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
                    </svg>
                  </div>
                  <span class="lesson-title quiz-title">Quiz du module</span>
                  <div class="ml-auto flex items-center gap-1.5">
                    <span class="text-xs" style="color:#c4bdd6">{{ moduleQuizMap()[mod.id].timeLimit }}m</span>
                    <svg *ngIf="moduleStatuses()[mod.id]?.status === 'VALIDATED'" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#1f9d6f" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                  </div>
                </button>
              </div>
            </div>

            <!-- Quiz Final du cours -->
            <div *ngIf="!loading() && courseFinalQuiz()" class="final-quiz-nav"
              [class.final-quiz-locked-nav]="finalQuizLocked()">
              <button class="lesson-row final-quiz-btn"
                (click)="selectFinalQuiz()"
                [disabled]="finalQuizLocked()"
                [class.lesson-active]="activeFinalQuiz()">
                <div class="lesson-icon" [style.background]="finalQuizLocked() ? 'rgba(148,141,163,.25)' : 'linear-gradient(135deg,#00B4C6,#f5a524)'">
                  <svg *ngIf="finalQuizLocked()" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#5a7a8a" stroke-width="2.5"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  <svg *ngIf="!finalQuizLocked()" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                </div>
                <div class="flex flex-col flex-1 min-w-0">
                  <span class="lesson-title" [style.color]="finalQuizLocked() ? '#5a7a8a' : '#007A8A'" style="font-weight:700">Quiz Final</span>
                  <span *ngIf="finalQuizLocked()" class="text-xs" style="color:#c4bdd6;font-size:10px">Terminez tous les quiz modules ≥70%</span>
                </div>
                <div class="ml-auto flex items-center gap-1.5">
                  <span *ngIf="!finalQuizLocked()" class="text-xs" style="color:#c4bdd6">{{ courseFinalQuiz()!.timeLimit }}m</span>
                </div>
              </button>
            </div>

            <div *ngIf="!loading() && modules().length === 0" class="p-6 text-center">
              <p class="text-sm" style="color:#5a7a8a">Aucun module pour ce cours</p>
            </div>
          </div>
        </aside>

        <!-- RIGHT: Content viewer -->
        <main class="content-area">

          <div *ngIf="!activeLesson() && !activeQuizModuleId() && !activeFinalQuiz() && !loading()" class="flex flex-col items-center justify-center h-full gap-4">
            <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#c4bdd6" stroke-width="1.5"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
            <div class="text-center">
              <p class="font-bold font-display" style="color:#1a2d3a">{{ course()?.title }}</p>
              <p class="text-sm mt-1" style="color:#5a7a8a">Sélectionnez une leçon dans le menu pour commencer</p>
            </div>
          </div>

          <div *ngIf="loading()" class="p-8 space-y-4">
            <div class="skeleton h-8 w-64 rounded-xl"></div>
            <div class="skeleton h-80 rounded-2xl"></div>
          </div>

          <!-- Active lesson -->
          <div *ngIf="activeLesson() && !activeQuizModuleId() && !activeFinalQuiz() && !loading()" class="lesson-content">
            <div class="lesson-topbar">
              <div>
                <div class="flex items-center gap-2 mb-1">
                  <span class="type-badge" [style.background]="typeColor(activeLesson()!.type) + '22'" [style.color]="typeColor(activeLesson()!.type)">
                    {{ typeLabel(activeLesson()!.type) }}
                  </span>
                  <span *ngIf="activeLesson()!.durationMinutes" class="text-xs" style="color:#5a7a8a">{{ activeLesson()!.durationMinutes }} min</span>
                </div>
                <h1 class="lesson-main-title">{{ activeLesson()!.title }}</h1>
              </div>
              <button (click)="markComplete()" [disabled]="completedLessons.has(activeLesson()!.id) || updating()"
                class="complete-btn" [class.done]="completedLessons.has(activeLesson()!.id)">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" [attr.stroke]="completedLessons.has(activeLesson()!.id) ? '#1f9d6f' : 'currentColor'" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                {{ completedLessons.has(activeLesson()!.id) ? 'Terminé' : (updating() ? 'Mise à jour...' : 'Marquer comme terminé') }}
              </button>
            </div>

            <div *ngIf="activeLesson()!.type === 'VIDEO' && activeLesson()!.videoUrl" class="viewer-box">
              <iframe *ngIf="isEmbeddable(activeLesson()!.videoUrl!)"
                [src]="embedUrl(activeLesson()!.videoUrl!)" class="video-player" frameborder="0" allowfullscreen
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"></iframe>
              <video *ngIf="!isEmbeddable(activeLesson()!.videoUrl!)"
                [src]="fileUrl(activeLesson()!.videoUrl!)" controls class="video-player"></video>
            </div>
            <div *ngIf="activeLesson()!.type === 'VIDEO' && !activeLesson()!.videoUrl" class="empty-viewer">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#c4bdd6" stroke-width="1.5"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
              <p style="color:#5a7a8a">Aucune vidéo disponible</p>
            </div>

            <div *ngIf="activeLesson()!.type === 'PDF' && activeLesson()!.pdfUrl" class="viewer-box">
              <iframe [src]="safeUrl(activeLesson()!.pdfUrl!)" class="pdf-player" frameborder="0"></iframe>
            </div>
            <div *ngIf="activeLesson()!.type === 'PDF' && !activeLesson()!.pdfUrl" class="empty-viewer">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#c4bdd6" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/></svg>
              <p style="color:#5a7a8a">Aucun PDF disponible</p>
            </div>

            <div *ngIf="activeLesson()!.type === 'TEXT'" class="text-content card p-6">
              <pre class="lesson-text">{{ activeLesson()!.content || 'Contenu bientôt disponible.' }}</pre>
            </div>

            <div *ngIf="activeLesson()!.type === 'QUIZ'" class="empty-viewer">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#00B4C6" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              <p style="color:#1a2d3a" class="font-semibold">Quiz lié à cette leçon</p>
              <a routerLink="/student/evaluations" class="btn-primary mt-3">Accéder aux évaluations</a>
            </div>

            <div class="lesson-nav-bar">
              <button (click)="prevLesson()" [disabled]="!hasPrev()" class="nav-lesson-btn">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
                Précédent
              </button>
              <span class="text-xs" style="color:#5a7a8a">{{ currentLessonIndex() + 1 }} / {{ allLessons().length }}</span>
              <button (click)="nextLesson()" [disabled]="!hasNext()" class="nav-lesson-btn">
                Suivant
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
            </div>
          </div>

          <!-- MODULE / FINAL QUIZ VIEW -->
          <div *ngIf="(activeQuizModuleId() || activeFinalQuiz()) && !loading()" class="lesson-content">
            <div class="lesson-topbar">
              <div>
                <div class="flex items-center gap-2 mb-1">
                  <span class="type-badge" [style.background]="activeFinalQuiz() ? 'rgba(0,180,198,.14)' : '#f5a52422'"
                    [style.color]="activeFinalQuiz() ? '#007A8A' : '#d97706'" style="font-weight:700">
                    {{ activeFinalQuiz() ? 'Quiz Final du cours' : 'Quiz du module' }}
                  </span>
                  <span *ngIf="!activeFinalQuiz() && moduleStatuses()[activeQuizModuleId()!]?.status === 'VALIDATED'" class="mod-badge mod-badge-validated">
                    <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
                    Validé
                  </span>
                  <span *ngIf="!activeFinalQuiz() && moduleStatuses()[activeQuizModuleId()!]?.status === 'TO_REDO'" class="mod-badge mod-badge-redo">À refaire</span>
                </div>
                <h1 class="lesson-main-title mt-1">{{ activeModuleQuiz()?.title }}</h1>
                <div class="flex items-center gap-3 mt-1">
                  <span class="text-xs" style="color:#5a7a8a">{{ activeModuleQuiz()?.questions?.length }} questions</span>
                  <span class="text-xs" style="color:#5a7a8a">{{ activeModuleQuiz()?.timeLimit }} min</span>
                  <span class="text-xs font-semibold" style="color:#d97706">Score min : {{ activeModuleQuiz()?.passingScore }}%</span>
                </div>
              </div>
              <div *ngIf="quizSubmitted()" class="score-badge-header" [class.score-passed]="quizResult()?.passed">
                <span class="score-num">{{ quizResult()?.score }}%</span>
                <span class="score-lbl">{{ quizResult()?.passed ? 'Réussi' : 'Échoué' }}</span>
              </div>
            </div>

            <!-- Questions (before submit) -->
            <div *ngIf="!quizSubmitted()" class="quiz-questions-area">
              <div *ngFor="let q of activeModuleQuiz()?.questions; let qi = index" class="quiz-q-card">
                <div class="q-header">
                  <span class="q-num">Q{{ qi + 1 }}</span>
                  <div style="flex:1">
                    <p class="q-text">{{ q.text }}</p>
                    <span *ngIf="isMultiCorrect(q)" class="multi-hint">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
                      Sélectionnez toutes les bonnes réponses
                    </span>
                  </div>
                </div>
                <div class="q-options">
                  <button *ngFor="let opt of q.options; let oi = index"
                    class="q-opt"
                    [class.q-opt-selected]="isSelected(q.id, oi)"
                    [class.q-opt-multi]="isMultiCorrect(q)"
                    (click)="selectAnswer(q.id, oi, q)">
                    <span class="opt-letter" [class.opt-check]="isMultiCorrect(q)">
                      <svg *ngIf="isMultiCorrect(q) && isSelected(q.id, oi)" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
                      <span *ngIf="!isMultiCorrect(q) || !isSelected(q.id, oi)">{{ optLetter(oi) }}</span>
                    </span>
                    <span>{{ opt }}</span>
                  </button>
                </div>
              </div>

              <div class="quiz-action-bar">
                <span class="text-sm" style="color:#5a7a8a">
                  {{ answeredCount() }} / {{ activeModuleQuiz()?.questions?.length ?? 0 }} réponses
                </span>
                <button (click)="submitQuiz()"
                  [disabled]="submittingQuiz() || answeredCount() < (activeModuleQuiz()?.questions?.length ?? 0)"
                  class="btn-submit-quiz">
                  <svg *ngIf="submittingQuiz()" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="animation:spin 1s linear infinite"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                  {{ submittingQuiz() ? 'Envoi en cours...' : 'Soumettre le quiz' }}
                </button>
              </div>
            </div>

            <!-- Result + review -->
            <div *ngIf="quizSubmitted()" class="quiz-questions-area">
              <div class="score-card" [class.score-card-pass]="quizResult()?.passed">
                <div class="score-circle" [class.score-circle-pass]="quizResult()?.passed">
                  {{ quizResult()?.score }}%
                </div>
                <div>
                  <div class="score-title" [class.score-title-pass]="quizResult()?.passed">
                    {{ quizResult()?.passed ? 'Quiz réussi !' : 'Quiz non réussi' }}
                  </div>
                  <div class="text-sm mt-1" style="color:#5a7a8a">Score minimum : {{ activeModuleQuiz()?.passingScore }}%</div>
                  <div *ngIf="quizResult()?.passed && !activeFinalQuiz()" class="text-xs mt-2" style="color:#1f9d6f;font-weight:600">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="display:inline;margin-right:4px"><polyline points="20 6 9 17 4 12"/></svg>
                    Module validé — le suivant est déverrouillé
                  </div>
                  <div *ngIf="quizResult()?.passed && activeFinalQuiz()" class="text-xs mt-2" style="color:#007A8A;font-weight:600">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="display:inline;margin-right:4px"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                    Badge et certificat attribués automatiquement — consultez "Mes Badges" pour les retrouver.
                  </div>
                  <div *ngIf="!quizResult()?.passed" class="text-xs mt-2" style="color:#ef4444">
                    Recommencez pour améliorer votre score
                  </div>
                </div>
              </div>

              <div *ngFor="let q of activeModuleQuiz()?.questions; let qi = index" class="quiz-q-card">
                <div class="q-header">
                  <span class="q-num">Q{{ qi + 1 }}</span>
                  <p class="q-text" style="flex:1">{{ q.text }}</p>
                </div>
                <div class="q-options">
                  <div *ngFor="let opt of q.options; let oi = index"
                    class="q-opt q-opt-review"
                    [class.q-opt-correct]="isOptionCorrect(q, oi)"
                    [class.q-opt-wrong]="isOptionWrong(q.id, q, oi)">
                    <span class="opt-letter" [class.opt-check]="isMultiCorrect(q)">{{ optLetter(oi) }}</span>
                    <span style="flex:1">{{ opt }}</span>
                    <svg *ngIf="isOptionCorrect(q, oi)" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1f9d6f" stroke-width="2.5" style="flex-shrink:0"><polyline points="20 6 9 17 4 12"/></svg>
                    <svg *ngIf="isOptionWrong(q.id, q, oi)" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2.5" style="flex-shrink:0"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </div>
                </div>
                <div *ngIf="q.explanation" class="q-expl">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#0099AE" stroke-width="2" style="flex-shrink:0"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                  {{ q.explanation }}
                </div>
              </div>

              <div class="quiz-action-bar">
                <button (click)="retryQuiz()" class="nav-lesson-btn">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.51"/></svg>
                  Recommencer
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  `,
  styles: [`
    .lesson-nav { width:300px; flex-shrink:0; display:flex; flex-direction:column; border-right:1px solid rgba(0,180,198,.14); background:rgba(255,253,251,.92); }
    .nav-header { padding:20px 16px 14px; border-bottom:1px solid rgba(0,180,198,.1); }
    .back-btn { display:inline-flex; align-items:center; gap:5px; font-size:12px; color:#5a7a8a; text-decoration:none; margin-bottom:10px; transition:color .2s; }
    .back-btn:hover { color:#007A8A; }
    .course-nav-title { font-size:13px; font-weight:700; color:#1a2d3a; font-family:'Fraunces',Georgia,serif; line-height:1.35; }
    .prog-track { height:5px; border-radius:99px; background:rgba(0,180,198,.15); overflow:hidden; }
    .prog-fill { height:100%; border-radius:99px; background:linear-gradient(90deg,#00B4C6,#00A8BC); transition:width .5s cubic-bezier(.23,1,.32,1); }
    .nav-scroll { flex:1; overflow-y:auto; padding:8px 8px 20px; }
    .module-block { margin-bottom:2px; }
    .module-header { width:100%; display:flex; align-items:center; justify-content:space-between; padding:10px 12px; border-radius:12px; background:transparent; border:none; cursor:pointer; transition:background .2s; font-family:inherit; gap:8px; }
    .module-header:hover:not(.module-locked), .module-open:not(.module-locked) { background:rgba(0,180,198,.08); }
    .module-locked { cursor:default !important; opacity:.6; }
    .module-locked:hover { background:transparent !important; }
    .mod-title { color:#1a2d3a; }
    .text-locked { color:#5a7a8a !important; }
    .mod-badge { display:inline-flex; align-items:center; gap:3px; padding:2px 7px; border-radius:999px; font-size:10px; font-weight:700; white-space:nowrap; flex-shrink:0; }
    .mod-badge-validated { background:rgba(31,157,111,.1); color:#1f9d6f; border:1px solid rgba(31,157,111,.22); }
    .mod-badge-redo { background:rgba(239,68,68,.08); color:#ef4444; border:1px solid rgba(239,68,68,.2); }
    .mod-badge-locked { background:rgba(148,141,163,.1); color:#5a7a8a; border:1px solid rgba(148,141,163,.18); }
    .lessons-list { padding:0 4px 4px 16px; display:flex; flex-direction:column; gap:2px; }
    .lesson-row { width:100%; display:flex; align-items:center; gap:8px; padding:9px 10px; border-radius:11px; background:transparent; border:none; cursor:pointer; text-align:left; transition:all .22s; font-family:inherit; }
    .lesson-row:hover { background:rgba(0,180,198,.07); }
    .lesson-active { background:rgba(0,180,198,.14) !important; border:1px solid rgba(0,180,198,.28); }
    .lesson-done .lesson-title { color:#1f9d6f !important; }
    .lesson-icon { width:22px; height:22px; border-radius:7px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
    .lesson-title { font-size:12px; color:#2c3d4e; font-weight:500; flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    .quiz-title { color:#d97706 !important; font-weight:600 !important; }
    .quiz-module-btn:hover { background:rgba(245,165,36,.08) !important; }
    /* Quiz Final */
    .final-quiz-nav { padding:8px 4px 4px; border-top:1px solid rgba(0,180,198,.1); margin-top:4px; }
    .final-quiz-locked-nav { opacity:.7; }
    .final-quiz-btn:hover:not(:disabled) { background:rgba(0,180,198,.1) !important; }
    .final-quiz-btn:disabled { cursor:default; }
    /* Content */
    .content-area { flex:1; overflow-y:auto; display:flex; flex-direction:column; }
    .lesson-content { display:flex; flex-direction:column; flex:1; }
    .lesson-topbar { display:flex; align-items:flex-start; justify-content:space-between; padding:24px 30px 16px; gap:16px; }
    .lesson-main-title { font-family:'Fraunces',Georgia,serif; font-size:22px; font-weight:700; color:#1a2d3a; margin:0; }
    .type-badge { font-size:11px; font-weight:700; padding:3px 10px; border-radius:999px; letter-spacing:.03em; }
    .complete-btn { display:flex; align-items:center; gap:6px; padding:10px 18px; border-radius:14px; border:1px solid rgba(110,231,183,.3); cursor:pointer; font-size:13px; font-weight:600; font-family:inherit; background:rgba(110,231,183,.12); color:#1f9d6f; transition:all .25s; flex-shrink:0; }
    .complete-btn:hover:not(:disabled) { background:rgba(110,231,183,.22); }
    .complete-btn:disabled { opacity:.7; cursor:default; }
    .complete-btn.done { background:rgba(110,231,183,.18); border-color:rgba(110,231,183,.4); }
    .viewer-box { padding:0 30px 16px; flex:1; }
    .video-player { width:100%; height:480px; border-radius:20px; background:#000; display:block; }
    .pdf-player { width:100%; height:520px; border-radius:20px; border:1px solid rgba(0,180,198,.12); display:block; }
    .empty-viewer { display:flex; flex-direction:column; align-items:center; justify-content:center; flex:1; gap:12px; padding:30px; }
    .text-content { margin:0 30px 20px; }
    .lesson-text { font-size:14px; line-height:1.8; color:#2c3d4e; white-space:pre-wrap; font-family:'Inter',system-ui,sans-serif; }
    .lesson-nav-bar { display:flex; align-items:center; justify-content:space-between; padding:16px 30px; border-top:1px solid rgba(0,180,198,.1); margin-top:auto; }
    .nav-lesson-btn { display:flex; align-items:center; gap:6px; padding:10px 18px; border-radius:14px; background:rgba(0,180,198,.08); border:1px solid rgba(0,180,198,.16); color:#007A8A; font-size:13px; font-weight:600; cursor:pointer; font-family:inherit; transition:all .22s; }
    .nav-lesson-btn:hover:not(:disabled) { background:rgba(0,180,198,.18); }
    .nav-lesson-btn:disabled { opacity:.35; cursor:default; }
    .score-badge-header { display:flex; flex-direction:column; align-items:center; padding:12px 20px; border-radius:18px; background:rgba(239,68,68,.07); border:1px solid rgba(239,68,68,.2); min-width:100px; flex-shrink:0; }
    .score-badge-header.score-passed { background:rgba(31,157,111,.07); border-color:rgba(31,157,111,.25); }
    .score-num { font-size:26px; font-weight:800; color:#ef4444; font-family:'Fraunces',Georgia,serif; line-height:1; }
    .score-passed .score-num { color:#1f9d6f; }
    .score-lbl { font-size:11px; color:#ef4444; font-weight:600; margin-top:3px; }
    .score-passed .score-lbl { color:#1f9d6f; }
    .quiz-questions-area { padding:0 30px 30px; display:flex; flex-direction:column; gap:16px; }
    .quiz-q-card { background:rgba(255,255,255,.82); border:1px solid rgba(0,180,198,.14); border-radius:18px; padding:20px; }
    .q-header { display:flex; gap:12px; align-items:flex-start; margin-bottom:14px; }
    .q-num { flex-shrink:0; width:28px; height:28px; border-radius:9px; background:linear-gradient(135deg,rgba(0,180,198,.18),rgba(0,168,188,.18)); border:1px solid rgba(0,180,198,.22); display:flex; align-items:center; justify-content:center; font-size:11px; font-weight:700; color:#007A8A; }
    .q-text { font-size:14px; color:#1a2d3a; font-weight:600; line-height:1.5; margin:0; }
    .multi-hint { display:inline-flex; align-items:center; gap:5px; font-size:11px; color:#d97706; font-weight:600; margin-top:4px; }
    .q-options { display:flex; flex-direction:column; gap:8px; }
    .q-opt { display:flex; align-items:center; gap:10px; padding:11px 14px; border-radius:12px; background:rgba(0,180,198,.04); border:1px solid rgba(0,180,198,.12); cursor:pointer; font-size:13px; color:#2c3d4e; font-family:inherit; text-align:left; transition:all .18s; }
    .q-opt:hover { background:rgba(0,180,198,.1); border-color:rgba(0,180,198,.3); }
    .q-opt-selected { background:rgba(0,180,198,.12) !important; border-color:rgba(0,180,198,.45) !important; color:#007A8A !important; font-weight:600; }
    .q-opt-multi:hover { background:rgba(245,165,36,.07) !important; border-color:rgba(245,165,36,.25) !important; }
    .q-opt-multi.q-opt-selected { background:rgba(245,165,36,.1) !important; border-color:rgba(245,165,36,.4) !important; color:#d97706 !important; }
    .q-opt-review { cursor:default; pointer-events:none; }
    .q-opt-correct { background:rgba(31,157,111,.09) !important; border-color:rgba(31,157,111,.35) !important; color:#1f9d6f !important; font-weight:600; }
    .q-opt-wrong { background:rgba(239,68,68,.07) !important; border-color:rgba(239,68,68,.3) !important; color:#ef4444 !important; }
    .opt-letter { flex-shrink:0; width:22px; height:22px; border-radius:7px; background:rgba(0,180,198,.12); display:flex; align-items:center; justify-content:center; font-size:10px; font-weight:700; color:#0099AE; }
    .opt-check { border-radius:5px; border:1.5px solid rgba(0,180,198,.3); background:rgba(0,180,198,.06); }
    .q-opt-selected .opt-letter { background:rgba(0,180,198,.2); color:#007A8A; }
    .q-opt-multi.q-opt-selected .opt-letter { background:rgba(245,165,36,.2); color:#d97706; border-color:rgba(245,165,36,.4); }
    .q-opt-correct .opt-letter { background:rgba(31,157,111,.15); color:#1f9d6f; }
    .q-opt-wrong .opt-letter { background:rgba(239,68,68,.12); color:#ef4444; }
    .q-expl { display:flex; align-items:flex-start; gap:7px; margin-top:10px; padding:10px 12px; border-radius:10px; background:rgba(0,180,198,.05); border-left:3px solid #0099AE; font-size:12px; color:#5a7a8a; line-height:1.5; }
    .quiz-action-bar { display:flex; align-items:center; justify-content:space-between; padding:16px 0 0; border-top:1px solid rgba(0,180,198,.1); }
    .btn-submit-quiz { display:flex; align-items:center; gap:8px; padding:12px 24px; border-radius:16px; background:linear-gradient(135deg,#00B4C6,#00A8BC); border:none; color:white; font-size:14px; font-weight:700; cursor:pointer; font-family:inherit; transition:all .22s; box-shadow:0 4px 16px rgba(0,180,198,.3); }
    .btn-submit-quiz:hover:not(:disabled) { transform:translateY(-1px); box-shadow:0 6px 22px rgba(0,180,198,.42); }
    .btn-submit-quiz:disabled { opacity:.45; cursor:default; transform:none; box-shadow:none; }
    .score-card { display:flex; align-items:center; gap:18px; padding:20px 24px; border-radius:20px; background:rgba(239,68,68,.05); border:1px solid rgba(239,68,68,.18); }
    .score-card-pass { background:rgba(31,157,111,.05); border-color:rgba(31,157,111,.2); }
    .score-circle { width:66px; height:66px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:17px; font-weight:800; font-family:'Fraunces',Georgia,serif; background:rgba(239,68,68,.09); border:2px solid rgba(239,68,68,.3); color:#ef4444; flex-shrink:0; }
    .score-circle-pass { background:rgba(31,157,111,.09); border-color:rgba(31,157,111,.3); color:#1f9d6f; }
    .score-title { font-size:16px; font-weight:700; color:#ef4444; font-family:'Fraunces',Georgia,serif; }
    .score-title-pass { color:#1f9d6f; }
    .btn-primary { display:inline-flex; align-items:center; gap:6px; padding:10px 18px; border-radius:14px; background:linear-gradient(135deg,#00B4C6,#00A8BC); border:none; color:white; font-size:13px; font-weight:700; cursor:pointer; font-family:inherit; transition:all .22s; box-shadow:0 4px 14px rgba(0,180,198,.3); text-decoration:none; }
    .btn-primary:hover { transform:translateY(-1px); }
    @keyframes spin { to { transform:rotate(360deg); } }
    .skeleton { background:linear-gradient(90deg,rgba(0,180,198,.08) 25%,rgba(0,180,198,.15) 50%,rgba(0,180,198,.08) 75%); background-size:200% 100%; animation:shimmer 1.5s infinite; }
    @keyframes shimmer { to { background-position:-200% 0; } }
  `],
})
export class StudentLearn implements OnInit {
  private route = inject(ActivatedRoute);
  private sanitizer = inject(DomSanitizer);
  auth = inject(AuthService);
  private api = inject(ApiService);

  loading = signal(true);
  updating = signal(false);
  course = signal<Course | null>(null);
  modules = signal<Module[]>([]);
  enrollment = signal<Enrollment | null>(null);
  activeLesson = signal<Lesson | null>(null);
  openModules = new Set<string>();
  completedLessons = new Set<string>();

  // Module quizzes
  moduleQuizMap = signal<Record<string, ModuleQuiz>>({});
  activeQuizModuleId = signal<string | null>(null);

  // Course final quiz
  courseFinalQuiz = signal<ModuleQuiz | null>(null);
  activeFinalQuiz = signal(false);

  // Quiz-taking state (shared between module and final quiz)
  quizAnswers = signal<Record<string, number>>({});
  quizSubmitted = signal(false);
  quizResult = signal<{ score: number; passed: boolean } | null>(null);
  submittingQuiz = signal(false);

  attempts = signal<AttemptData[]>([]);

  moduleStatuses = computed<Record<string, ModuleStatus>>(() => {
    const mods = this.modules();
    const quizMap = this.moduleQuizMap();
    const attemptsList = this.attempts();
    const statuses: Record<string, ModuleStatus> = {};
    let prevPassed = true;

    for (const mod of mods) {
      // Trainer-locked modules are always locked
      if (mod.locked) {
        statuses[mod.id] = { status: 'LOCKED', score: -1 };
        prevPassed = false;
        continue;
      }
      const quiz = quizMap[mod.id];
      if (!prevPassed) {
        statuses[mod.id] = { status: 'LOCKED', score: -1 };
      } else if (!quiz) {
        statuses[mod.id] = { status: 'OPEN', score: -1 };
      } else {
        const modAttempts = attemptsList.filter(a => a.quiz?.id === quiz.id);
        if (modAttempts.length === 0) {
          statuses[mod.id] = { status: 'OPEN', score: -1 };
          prevPassed = false;
        } else {
          const bestScore = Math.max(...modAttempts.map(a => a.score));
          const everPassed = modAttempts.some(a => a.score >= 70);
          if (everPassed) {
            statuses[mod.id] = { status: 'VALIDATED', score: bestScore };
            prevPassed = true;
          } else {
            statuses[mod.id] = { status: 'TO_REDO', score: bestScore };
            prevPassed = false;
          }
        }
      }
    }
    return statuses;
  });

  // Final quiz is locked until ALL module quizzes are passed with >= 70%
  finalQuizLocked = computed(() => {
    const mods = this.modules();
    const quizMap = this.moduleQuizMap();
    const attemptsList = this.attempts();
    for (const mod of mods) {
      const quiz = quizMap[mod.id];
      if (!quiz) continue;
      const passed = attemptsList.some(a => a.quiz?.id === quiz.id && a.score >= 70);
      if (!passed) return true;
    }
    return false;
  });

  activeModuleQuiz = computed<ModuleQuiz | null>(() => {
    if (this.activeFinalQuiz()) return this.courseFinalQuiz();
    const id = this.activeQuizModuleId();
    return id ? (this.moduleQuizMap()[id] ?? null) : null;
  });

  answeredCount = computed(() => {
    const quiz = this.activeModuleQuiz();
    if (!quiz) return Object.keys(this.quizAnswers()).length;
    return quiz.questions.filter(q => this.isAnswered(q.id, q)).length;
  });

  get role() { return this.auth.user()?.role ?? 'STUDENT'; }
  get userName() { return this.auth.user()?.name ?? ''; }

  progress = computed(() => {
    const enr = this.enrollment();
    if (!enr) return 0;
    return enr.completed ? 100 : enr.progress;
  });
  allLessons = computed(() => this.modules().flatMap(m => m.lessons));
  currentLessonIndex = computed(() => this.allLessons().findIndex(l => l.id === this.activeLesson()?.id));
  hasPrev = computed(() => this.currentLessonIndex() > 0);
  hasNext = computed(() => this.currentLessonIndex() < this.allLessons().length - 1);

  ngOnInit() {
    const courseId = this.route.snapshot.paramMap.get('courseId')!;
    this.loadData(courseId);
  }

  private loadData(courseId: string) {
    this.api.get<Course>(`/courses/${courseId}`).subscribe({ next: c => this.course.set(c) });

    this.api.get<Enrollment[]>('/enrollments/me').subscribe({
      next: list => {
        const enr = (list ?? []).find(e => e.course.id === courseId);
        if (enr) {
          this.enrollment.set(enr);
          // Load completed lessons from backend, fall back to localStorage for offline resilience
          this.api.get<string[]>(`/enrollments/${enr.id}/completed-lessons`).subscribe({
            next: ids => {
              (ids ?? []).forEach(id => this.completedLessons.add(id));
              // Merge any locally-cached completions not yet synced
              const saved = localStorage.getItem(`completed_${enr.id}`);
              if (saved) (JSON.parse(saved) as string[]).forEach(id => this.completedLessons.add(id));
            },
            error: () => {
              const saved = localStorage.getItem(`completed_${enr.id}`);
              if (saved) (JSON.parse(saved) as string[]).forEach(id => this.completedLessons.add(id));
            },
          });
        }
      },
    });

    this.api.get<AttemptData[]>('/quizzes/attempts/me').subscribe({
      next: list => this.attempts.set(list ?? []),
    });

    this.api.get<Module[]>(`/courses/${courseId}/modules`).subscribe({
      next: mods => {
        const sorted = (mods ?? []).sort((a, b) => a.sortOrder - b.sortOrder);
        sorted.forEach(m => { m.lessons = (m.lessons ?? []).sort((a, b) => a.sortOrder - b.sortOrder); });
        this.modules.set(sorted);
        if (sorted.length > 0) {
          this.openModules.add(sorted[0].id);
          if (sorted[0].lessons.length > 0) this.selectLesson(sorted[0].lessons[0]);
        }
        this.loading.set(false);
        this.loadModuleQuizzes(sorted);
        this.loadCourseFinalQuiz(courseId);
      },
      error: () => this.loading.set(false),
    });
  }

  private loadModuleQuizzes(mods: Module[]) {
    mods.forEach(mod => {
      this.api.get<ModuleQuiz | null>(`/quizzes/module/${mod.id}`).subscribe({
        next: quiz => { if (quiz) this.moduleQuizMap.set({ ...this.moduleQuizMap(), [mod.id]: quiz }); },
      });
    });
  }

  private loadCourseFinalQuiz(courseId: string) {
    this.api.get<any[]>(`/quizzes/course/${courseId}`).subscribe({
      next: quizzes => {
        const ref = (quizzes ?? []).find((q: any) => !q.moduleId);
        if (ref?.id) {
          this.api.get<ModuleQuiz>(`/quizzes/${ref.id}`).subscribe({
            next: full => this.courseFinalQuiz.set(full),
          });
        }
      },
    });
  }

  toggleModule(moduleId: string, _modIndex: number) {
    if (this.moduleStatuses()[moduleId]?.status === 'LOCKED') return;
    if (this.openModules.has(moduleId)) this.openModules.delete(moduleId);
    else this.openModules.add(moduleId);
  }

  selectLesson(lesson: Lesson) {
    this.activeLesson.set(lesson);
    this.activeQuizModuleId.set(null);
    this.activeFinalQuiz.set(false);
    const mod = this.modules().find(m => m.lessons.some(l => l.id === lesson.id));
    if (mod) this.openModules.add(mod.id);
  }

  selectModuleQuiz(moduleId: string) {
    if (this.moduleStatuses()[moduleId]?.status === 'LOCKED') return;
    this.activeQuizModuleId.set(moduleId);
    this.activeLesson.set(null);
    this.activeFinalQuiz.set(false);
    this.resetQuiz();
    this.openModules.add(moduleId);
  }

  selectFinalQuiz() {
    if (this.finalQuizLocked()) return;
    this.activeFinalQuiz.set(true);
    this.activeLesson.set(null);
    this.activeQuizModuleId.set(null);
    this.resetQuiz();
  }

  private resetQuiz() {
    this.quizAnswers.set({});
    this.quizSubmitted.set(false);
    this.quizResult.set(null);
  }

  // Multi-correct helpers
  isMultiCorrect(q: QuizQuestion): boolean {
    return (q.correctAnswers?.length ?? 0) > 1;
  }

  isSelected(questionId: string, optionIndex: number): boolean {
    const answer = this.quizAnswers()[questionId];
    if (answer === undefined) return false;
    const quiz = this.activeModuleQuiz();
    const q = quiz?.questions.find(qq => qq.id === questionId);
    if (this.isMultiCorrect(q!)) {
      return (answer & (1 << optionIndex)) !== 0;
    }
    return answer === optionIndex;
  }

  isAnswered(questionId: string, q: QuizQuestion): boolean {
    const answer = this.quizAnswers()[questionId];
    if (answer === undefined) return false;
    if (this.isMultiCorrect(q)) return answer > 0;
    return true;
  }

  isOptionCorrect(q: QuizQuestion, oi: number): boolean {
    if ((q.correctAnswers?.length ?? 0) > 0) return q.correctAnswers!.includes(oi);
    return oi === q.correctAnswer;
  }

  isOptionWrong(questionId: string, q: QuizQuestion, oi: number): boolean {
    return this.isSelected(questionId, oi) && !this.isOptionCorrect(q, oi);
  }

  selectAnswer(questionId: string, optionIndex: number, q: QuizQuestion) {
    if (this.quizSubmitted()) return;
    if (this.isMultiCorrect(q)) {
      const current = this.quizAnswers()[questionId] ?? 0;
      this.quizAnswers.set({ ...this.quizAnswers(), [questionId]: current ^ (1 << optionIndex) });
    } else {
      this.quizAnswers.set({ ...this.quizAnswers(), [questionId]: optionIndex });
    }
  }

  submitQuiz() {
    const quiz = this.activeModuleQuiz();
    if (!quiz) return;
    this.submittingQuiz.set(true);
    this.api.post<{ score: number; passed: boolean }>('/quizzes/attempts', {
      quizId: quiz.id, answers: this.quizAnswers(), timeTakenSeconds: 0,
    }).subscribe({
      next: result => {
        this.quizResult.set(result);
        this.quizSubmitted.set(true);
        this.submittingQuiz.set(false);
        this.api.get<AttemptData[]>('/quizzes/attempts/me').subscribe({
          next: list => { this.attempts.set(list ?? []); this.updateEnrollmentProgress(); },
        });
      },
      error: () => this.submittingQuiz.set(false),
    });
  }

  retryQuiz() { this.resetQuiz(); }

  prevLesson() {
    const i = this.currentLessonIndex();
    if (i > 0) this.selectLesson(this.allLessons()[i - 1]);
  }

  nextLesson() {
    const i = this.currentLessonIndex();
    if (i < this.allLessons().length - 1) this.selectLesson(this.allLessons()[i + 1]);
  }

  markComplete() {
    const lesson = this.activeLesson();
    const enr = this.enrollment();
    if (!lesson || !enr || this.completedLessons.has(lesson.id)) return;
    this.completedLessons.add(lesson.id);
    localStorage.setItem(`completed_${enr.id}`, JSON.stringify([...this.completedLessons]));
    this.updating.set(true);
    // Persist to backend so trainers can see per-lesson completion
    this.api.post(`/lessons/${lesson.id}/complete`, {}).subscribe();
    this.updateEnrollmentProgress(true);
  }

  private updateEnrollmentProgress(setUpdating = false) {
    const enr = this.enrollment();
    if (!enr) return;

    const totalLessons = this.allLessons().length;
    const moduleQuizList = Object.values(this.moduleQuizMap());
    const hasFinal = this.courseFinalQuiz() ? 1 : 0;
    const total = totalLessons + moduleQuizList.length + hasFinal;
    if (total === 0) return;

    const passedModuleCount = moduleQuizList.filter(q =>
      this.attempts().some(a => a.quiz.id === q.id && a.passed)
    ).length;
    const passedFinal = hasFinal && this.attempts().some(a =>
      a.quiz.id === this.courseFinalQuiz()!.id && a.passed
    ) ? 1 : 0;

    // Badge eligibility: ALL module quizzes ≥70% AND final quiz ≥70%
    const allModulesPassed = moduleQuizList.every(q =>
      this.attempts().some(a => a.quiz.id === q.id && a.score >= 70)
    );
    const finalPassed70 = !!(hasFinal && this.attempts().some(a =>
      a.quiz.id === this.courseFinalQuiz()!.id && a.score >= 70
    ));
    const badgeEligible = allModulesPassed && finalPassed70;

    const completedCount = this.completedLessons.size + passedModuleCount + passedFinal;
    const newProgress = badgeEligible ? 100 : Math.min(100, Math.round((completedCount / total) * 100));

    this.api.put<Enrollment>(`/enrollments/${enr.id}/progress`, { progress: newProgress }).subscribe({
      next: updated => { this.enrollment.set(updated); if (setUpdating) this.updating.set(false); },
      error: () => { if (setUpdating) this.updating.set(false); },
    });
  }

  completedInModule(mod: Module): number {
    return mod.lessons.filter(l => this.completedLessons.has(l.id)).length;
  }

  isEmbeddable(url: string): boolean {
    return url.includes('youtube.com') || url.includes('youtu.be') || url.includes('vimeo.com');
  }

  embedUrl(url: string): SafeResourceUrl {
    let embed = url;
    const ytMatch = url.match(/[?&]v=([^&]+)/) || url.match(/youtu\.be\/([^?]+)/);
    if (ytMatch) embed = `https://www.youtube.com/embed/${ytMatch[1]}`;
    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch) embed = `https://player.vimeo.com/video/${vimeoMatch[1]}`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(embed);
  }

  safeUrl(url: string): SafeResourceUrl {
    const full = url.startsWith('/uploads') ? '/api' + url : url;
    return this.sanitizer.bypassSecurityTrustResourceUrl(full);
  }

  fileUrl(url: string): string { return url.startsWith('/uploads') ? '/api' + url : url; }
  typeColor(type: string): string { return ({ VIDEO: '#00B4C6', PDF: '#00A8BC', TEXT: '#1f9d6f', QUIZ: '#f5a524' } as any)[type] ?? '#5a7a8a'; }
  typeLabel(type: string): string { return ({ VIDEO: 'Vidéo', PDF: 'PDF', TEXT: 'Texte', QUIZ: 'Quiz' } as any)[type] ?? type; }
  optLetter(i: number): string { return 'ABCDEFGHIJ'[i] ?? String(i + 1); }
}
