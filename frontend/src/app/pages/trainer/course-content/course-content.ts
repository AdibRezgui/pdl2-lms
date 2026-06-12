import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../core/services/auth';
import { ApiService } from '../../../core/services/api';
import { ToastService } from '../../../core/services/toast';
import { Sidebar } from '../../../shared/sidebar/sidebar';

interface Lesson {
  id: string; title: string; type: string;
  content?: string; videoUrl?: string; pdfUrl?: string;
  durationMinutes: number; sortOrder: number; free: boolean;
}
interface Module { id: string; title: string; description?: string; sortOrder: number; lessons: Lesson[]; locked: boolean; }
interface ManualQuestion { text: string; options: string[]; correct: number; correctAnswers: number[]; }
interface QuizRef { id: string; title: string; questionsCount: number; }

const EMPTY_LESSON = (): Partial<Lesson> => ({
  title: '', type: 'VIDEO', content: '', videoUrl: '', pdfUrl: '',
  durationMinutes: 0, sortOrder: 0, free: false,
});

@Component({
  selector: 'app-course-content',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="flex h-screen overflow-hidden" style="background:linear-gradient(160deg,#fffdfb 0%,#fdf2f8 60%,#f6f0ff 100%)">
      <!-- Slim left nav -->
      <nav class="slim-nav">
        <a [routerLink]="'/trainer/courses'" class="nav-logo">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
        </a>
        <a [routerLink]="'/trainer/dashboard'" class="slim-link" title="Dashboard">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
        </a>
        <a [routerLink]="'/trainer/courses'" class="slim-link active" title="Mes cours">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
        </a>
      </nav>

      <div class="flex flex-1 overflow-hidden">
        <!-- MODULE LIST -->
        <aside class="module-panel">
          <div class="panel-header">
            <a [routerLink]="'/trainer/courses'" class="back-link">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg>
              Retour
            </a>
            <p class="panel-title">{{ courseTitle() || 'Chargement...' }}</p>
            <p class="panel-sub">Gestion du contenu</p>
          </div>

          <div class="panel-scroll">
            <div *ngIf="loading()" class="p-4 space-y-2">
              <div *ngFor="let _ of [1,2,3]" class="skeleton h-12 rounded-xl"></div>
            </div>

            <!-- Module items -->
            <div *ngFor="let mod of modules()" class="module-item"
              [class.module-active]="activeModule()?.id === mod.id"
              [class.module-locked-row]="mod.locked"
              (click)="selectModule(mod)">
              <div class="flex items-center gap-2 flex-1 min-w-0">
                <div class="mod-dot" [style.background]="mod.locked ? 'rgba(148,141,163,.3)' : activeModule()?.id === mod.id ? 'linear-gradient(135deg,#a78bfa,#fb7299)' : 'rgba(167,139,250,.25)'"></div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-1.5">
                    <p class="text-sm font-semibold truncate" [style.color]="mod.locked ? '#948da3' : '#221f2c'">{{ mod.title }}</p>
                    <svg *ngIf="mod.locked" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#948da3" stroke-width="2.5" style="flex-shrink:0"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  </div>
                  <div class="flex items-center gap-2 mt-0.5">
                    <p class="text-xs" style="color:#948da3">{{ mod.lessons.length }} leçon(s)</p>
                    <span *ngIf="moduleQuizMap()[mod.id]" class="quiz-exists-badge">
                      <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                      Quiz
                    </span>
                  </div>
                </div>
              </div>
              <div class="mod-actions">
                <button (click)="$event.stopPropagation(); toggleModuleLock(mod)" class="lock-btn"
                  [class.lock-btn-locked]="mod.locked"
                  [title]="mod.locked ? 'Déverrouiller' : 'Verrouiller'">
                  <svg *ngIf="!mod.locked" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  <svg *ngIf="mod.locked" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg>
                </button>
                <button (click)="$event.stopPropagation(); deleteModule(mod.id)" class="del-btn" title="Supprimer">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
            </div>

            <div *ngIf="!loading() && modules().length === 0" class="p-4 text-center">
              <p class="text-xs" style="color:#948da3">Aucun module. Ajoutez-en un ci-dessous.</p>
            </div>

            <!-- Quiz Final du cours -->
            <div *ngIf="!loading()" class="final-quiz-section">
              <div class="fq-label">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#d97706" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                Quiz Final du cours
              </div>
              <div *ngIf="courseFinalQuiz()" class="fq-card">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#1f9d6f" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                <div class="flex-1 min-w-0">
                  <p class="text-xs font-semibold truncate" style="color:#221f2c">{{ courseFinalQuiz()!.title }}</p>
                  <p class="text-xs" style="color:#948da3">{{ courseFinalQuiz()!.questionsCount }} questions</p>
                </div>
              </div>
              <div *ngIf="!courseFinalQuiz()" class="fq-empty">
                <p class="text-xs" style="color:#c4bdd6">Aucun quiz final</p>
              </div>
              <button (click)="openQuizModal('COURSE', courseId(), courseTitle())" class="fq-btn">
                <svg *ngIf="!courseFinalQuiz()" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                {{ courseFinalQuiz() ? 'Remplacer' : 'Créer le quiz final' }}
              </button>
            </div>
          </div>

          <div class="add-module-form">
            <p class="text-xs font-semibold mb-2" style="color:#221f2c">Nouveau module</p>
            <input [(ngModel)]="newModuleTitle" placeholder="Titre du module..."
              class="input-field text-sm mb-2" style="height:36px" (keydown.enter)="addModule()" />
            <button (click)="addModule()" [disabled]="!newModuleTitle.trim() || savingModule()"
              class="btn-primary w-full justify-center text-xs" style="height:34px">
              {{ savingModule() ? 'Ajout...' : '+ Ajouter' }}
            </button>
          </div>
        </aside>

        <!-- LESSON LIST + FORM -->
        <main class="main-panel">
          <div *ngIf="!activeModule()" class="flex flex-col items-center justify-center h-full gap-4">
            <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#c4bdd6" stroke-width="1.5"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
            <p class="text-sm font-semibold" style="color:#948da3">Sélectionnez un module pour gérer ses leçons</p>
          </div>

          <div *ngIf="activeModule()" class="module-content">
            <div class="content-header">
              <div>
                <h2 class="font-display font-bold text-xl" style="color:#221f2c">{{ activeModule()!.title }}</h2>
                <p class="text-sm" style="color:#948da3">{{ activeModule()!.lessons.length }} leçon(s)</p>
              </div>
              <div class="flex gap-2">
                <button (click)="openQuizModal('MODULE', activeModule()!.id, activeModule()!.title)" class="quiz-ai-btn">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                  {{ moduleQuizMap()[activeModule()!.id] ? 'Remplacer' : 'Créer un quiz' }}
                </button>
                <button (click)="openNewLesson()" class="btn-primary">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  Ajouter une leçon
                </button>
              </div>
            </div>

            <div class="lessons-area">
              <div *ngFor="let lesson of activeModule()!.lessons" class="lesson-card">
                <div class="lesson-type-badge" [style.background]="typeColor(lesson.type) + '20'" [style.color]="typeColor(lesson.type)">
                  {{ typeLabel(lesson.type) }}
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-semibold" style="color:#221f2c">{{ lesson.title }}</p>
                  <p *ngIf="lesson.durationMinutes" class="text-xs mt-0.5" style="color:#948da3">{{ lesson.durationMinutes }} min</p>
                  <p *ngIf="lesson.videoUrl" class="text-xs mt-0.5 truncate" style="color:#a78bfa">{{ lesson.videoUrl }}</p>
                  <p *ngIf="lesson.pdfUrl" class="text-xs mt-0.5 truncate" style="color:#fb7299">{{ lesson.pdfUrl }}</p>
                </div>
                <div class="flex gap-2 items-center">
                  <button (click)="editLesson(lesson)" class="edit-btn">Modifier</button>
                  <button (click)="deleteLesson(lesson.id)" class="del-btn">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                </div>
              </div>
              <div *ngIf="activeModule()!.lessons.length === 0" class="empty-lessons">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#c4bdd6" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/></svg>
                <p class="text-sm" style="color:#948da3">Aucune leçon. Cliquez sur "Ajouter une leçon".</p>
              </div>
            </div>
          </div>
        </main>

        <!-- LESSON FORM PANEL -->
        <aside *ngIf="lessonFormOpen()" class="form-panel">
          <div class="form-header">
            <h3 class="font-display font-bold" style="color:#221f2c">{{ editingLesson() ? 'Modifier la leçon' : 'Nouvelle leçon' }}</h3>
            <button (click)="closeForm()" class="close-btn">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          <div class="form-scroll">
            <div *ngIf="formError()" class="err-banner mb-4">{{ formError() }}</div>
            <div class="field">
              <label class="flabel">Titre *</label>
              <input [(ngModel)]="lessonForm.title" class="input-field" placeholder="Ex : Introduction aux variables" />
            </div>
            <div class="field">
              <label class="flabel">Type de contenu</label>
              <div class="type-tabs">
                <button *ngFor="let t of lessonTypes" (click)="lessonForm.type = t.value"
                  class="type-tab" [class.type-active]="lessonForm.type === t.value">
                  <span [innerHTML]="t.icon"></span>{{ t.label }}
                </button>
              </div>
            </div>
            <div *ngIf="lessonForm.type === 'VIDEO'" class="field">
              <label class="flabel">Fichier vidéo (MP4, WebM — max 50 Mo)</label>
              <div class="upload-zone" (click)="videoInput.click()" [class.uploading]="uploadingVideo()">
                <input #videoInput type="file" accept="video/mp4,video/webm" class="hidden" (change)="onVideoFile($event)" />
                <div *ngIf="!uploadingVideo() && !lessonForm.videoUrl" class="upload-placeholder">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#c4bdd6" stroke-width="1.5"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
                  <p class="text-sm" style="color:#948da3">Cliquez pour choisir une vidéo</p>
                </div>
                <div *ngIf="uploadingVideo()" class="upload-loading"><div class="spinner"></div><p class="text-sm" style="color:#a78bfa">Upload en cours...</p></div>
                <div *ngIf="!uploadingVideo() && lessonForm.videoUrl" class="upload-done">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1f9d6f" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                  <p class="text-sm font-semibold truncate max-w-48" style="color:#1f9d6f">Vidéo uploadée</p>
                  <button (click)="$event.stopPropagation(); lessonForm.videoUrl = ''" class="clear-btn">×</button>
                </div>
              </div>
              <div class="or-divider">ou</div>
              <label class="flabel">Lien vidéo (YouTube, Vimeo...)</label>
              <input [(ngModel)]="lessonForm.videoUrl" class="input-field" placeholder="https://youtube.com/watch?v=..." />
            </div>
            <div *ngIf="lessonForm.type === 'PDF'" class="field">
              <label class="flabel">Fichier PDF (max 50 Mo)</label>
              <div class="upload-zone" (click)="pdfInput.click()" [class.uploading]="uploadingPdf()">
                <input #pdfInput type="file" accept="application/pdf" class="hidden" (change)="onPdfFile($event)" />
                <div *ngIf="!uploadingPdf() && !lessonForm.pdfUrl" class="upload-placeholder">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#c4bdd6" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/></svg>
                  <p class="text-sm" style="color:#948da3">Cliquez pour choisir un PDF</p>
                </div>
                <div *ngIf="uploadingPdf()" class="upload-loading"><div class="spinner"></div><p class="text-sm" style="color:#fb7299">Upload en cours...</p></div>
                <div *ngIf="!uploadingPdf() && lessonForm.pdfUrl" class="upload-done">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1f9d6f" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                  <p class="text-sm font-semibold" style="color:#1f9d6f">PDF uploadé</p>
                  <button (click)="$event.stopPropagation(); lessonForm.pdfUrl = ''" class="clear-btn">×</button>
                </div>
              </div>
              <div class="or-divider">ou</div>
              <label class="flabel">Lien PDF direct</label>
              <input [(ngModel)]="lessonForm.pdfUrl" class="input-field" placeholder="https://example.com/doc.pdf" />
            </div>
            <div *ngIf="lessonForm.type === 'TEXT'" class="field">
              <label class="flabel">Contenu texte</label>
              <textarea [(ngModel)]="lessonForm.content" rows="8" class="input-field resize-none" placeholder="Rédigez le contenu..."></textarea>
            </div>
            <div *ngIf="lessonForm.type === 'QUIZ'" class="info-box">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              <p class="text-xs" style="color:#4a4458">Le quiz lié sera créé depuis l'espace Évaluations.</p>
            </div>
            <div class="field">
              <label class="flabel">Durée estimée (minutes)</label>
              <input type="number" [(ngModel)]="lessonForm.durationMinutes" min="0" class="input-field" />
            </div>
          </div>
          <div class="form-footer">
            <button (click)="closeForm()" class="btn-secondary flex-1 justify-center">Annuler</button>
            <button (click)="saveLesson()" [disabled]="savingLesson() || uploadingVideo() || uploadingPdf()"
              class="btn-primary flex-1 justify-center">
              {{ savingLesson() ? 'Enregistrement...' : (editingLesson() ? 'Mettre à jour' : 'Créer la leçon') }}
            </button>
          </div>
        </aside>
      </div>

      <!-- ── QUIZ MODAL ─────────────────────────────────────────────────────── -->
      <div *ngIf="quizModalOpen()" class="modal-backdrop" (click)="closeQuizModal()">
        <div class="quiz-modal" (click)="$event.stopPropagation()">

          <div class="qm-header">
            <div class="qm-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            </div>
            <div>
              <p class="font-display font-bold text-base" style="color:#221f2c">
                {{ quizModalTarget()?.scope === 'COURSE' ? 'Quiz Final du cours' : 'Créer un quiz de module' }}
              </p>
              <p class="text-xs mt-0.5" style="color:#948da3">
                <span class="scope-chip">{{ quizModalTarget()?.scope === 'COURSE' ? 'Cours' : 'Module' }}</span>
                {{ quizModalTarget()?.label }}
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

          <!-- SUCCESS -->
          <div *ngIf="quizGenResult()" class="qm-success">
            <div class="success-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#1f9d6f" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <p class="font-bold text-sm" style="color:#221f2c">Quiz créé avec succès !</p>
            <p class="text-xs mt-1" style="color:#948da3">{{ quizGenResult()!.questionsCount }} question(s) · {{ quizGenResult()!.title }}</p>
            <button (click)="closeQuizModal()" class="btn-primary mt-4 justify-center" style="width:100%">Fermer</button>
          </div>

          <!-- AI MODE -->
          <div *ngIf="!quizGenResult() && quizMode()==='AI'" class="qm-body">
            <!-- MODULE scope: lesson picker -->
            <div *ngIf="quizModalTarget()?.scope === 'MODULE' && activeModule()?.lessons?.length" class="mb-4">
              <p class="qm-section-label">Leçons à inclure</p>
              <div class="lesson-select-list">
                <label *ngFor="let l of activeModule()!.lessons" class="lesson-select-item">
                  <input type="checkbox" [checked]="quizSelectedLessons().has(l.id)"
                    (change)="toggleLessonSelection(l.id)"
                    style="accent-color:#a78bfa;width:14px;height:14px;flex-shrink:0;cursor:pointer" />
                  <span class="text-xs" style="color:#4a4458;cursor:pointer">{{ l.title }}</span>
                </label>
              </div>
              <p *ngIf="quizSelectedLessons().size === 0" class="text-xs mt-1" style="color:#ef4444">Sélectionnez au moins une leçon</p>
            </div>
            <!-- COURSE scope: show all modules + lessons (all pre-selected) -->
            <div *ngIf="quizModalTarget()?.scope === 'COURSE'" class="mb-4">
              <p class="qm-section-label">Contenu couvert par le quiz final</p>
              <div class="course-lesson-tree">
                <div *ngFor="let mod of modules()" class="tree-module">
                  <div class="tree-mod-header">
                    <label class="lesson-select-item" style="gap:6px">
                      <input type="checkbox" [checked]="moduleFullySelected(mod)"
                        (change)="toggleModuleSelection(mod)"
                        style="accent-color:#a78bfa;width:14px;height:14px;flex-shrink:0;cursor:pointer" />
                      <span class="text-xs font-bold" style="color:#221f2c">{{ mod.title }}</span>
                      <span class="text-xs" style="color:#948da3">({{ selectedInModule(mod) }}/{{ mod.lessons.length }})</span>
                    </label>
                  </div>
                  <div *ngFor="let l of mod.lessons" class="tree-lesson">
                    <label class="lesson-select-item" style="padding-left:18px">
                      <input type="checkbox" [checked]="quizSelectedLessons().has(l.id)"
                        (change)="toggleLessonSelection(l.id)"
                        style="accent-color:#a78bfa;width:13px;height:13px;flex-shrink:0;cursor:pointer" />
                      <span class="text-xs" style="color:#4a4458;cursor:pointer">{{ l.title }}</span>
                    </label>
                  </div>
                </div>
              </div>
              <p *ngIf="quizSelectedLessons().size === 0" class="text-xs mt-1" style="color:#ef4444">Sélectionnez au moins une leçon</p>
              <p *ngIf="quizSelectedLessons().size > 0" class="text-xs mt-1" style="color:#1f9d6f;font-weight:600">
                {{ quizSelectedLessons().size }} leçon(s) sélectionnée(s)
              </p>
            </div>
            <p class="qm-section-label">Nombre de questions</p>
            <div class="count-selector">
              <button *ngFor="let n of [10,20,40]" (click)="quizGenCount.set(n)"
                class="count-btn" [class.count-active]="quizGenCount()===n">
                {{ n }}<span class="count-sub">{{ n===10?'~15 min':n===20?'~25 min':'~45 min' }}</span>
              </button>
            </div>
            <p class="qm-section-label mt-4">Type de questions</p>
            <div class="type-selector">
              <button *ngFor="let t of questionTypes" class="qtype-btn"
                [class.qtype-active]="quizQuestionType()===t.value"
                (click)="quizQuestionType.set(t.value)">{{ t.label }}</button>
            </div>
            <div *ngIf="quizGenError()" class="err-banner mt-3">{{ quizGenError() }}</div>
            <button (click)="generateQuiz()"
              [disabled]="generatingQuiz() || quizSelectedLessons().size===0"
              class="btn-primary w-full justify-center mt-4" style="height:44px">
              <div *ngIf="generatingQuiz()" class="spinner-sm"></div>
              <svg *ngIf="!generatingQuiz()" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4"/></svg>
              {{ generatingQuiz() ? "Génération en cours..." : "Générer le quiz avec l'IA" }}
            </button>
          </div>

          <!-- MANUAL MODE -->
          <div *ngIf="!quizGenResult() && quizMode()==='MANUAL'" class="qm-body qm-manual-body">

            <!-- Questions list -->
            <div *ngIf="manualQuestions().length > 0" class="mb-3">
              <p class="qm-section-label">Questions ajoutées ({{ manualQuestions().length }})</p>
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
              <textarea [(ngModel)]="manualQText" rows="2" class="input-field resize-none" placeholder="Ex : Quel est le rôle d'un pare-feu ?"></textarea>
            </div>

            <!-- Option count + correct count row -->
            <div class="flex gap-4 mb-3">
              <div class="flex-1">
                <label class="flabel">Nombre de choix</label>
                <div class="mini-count-row">
                  <button *ngFor="let n of [2,3,4,5,6]"
                    class="mini-count-btn" [class.mini-count-active]="manualQOptionCount()===n"
                    (click)="setOptionCount(n)">{{ n }}</button>
                </div>
              </div>
              <div class="flex-1">
                <label class="flabel">Mode</label>
                <div class="flex gap-1 mt-1">
                  <div class="mode-hint">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#948da3" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/></svg>
                    <span class="text-xs" style="color:#948da3">Cliquer la lettre pour la bonne réponse</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Options -->
            <div class="field">
              <label class="flabel">Options & bonnes réponses</label>
              <div class="manual-opts">
                <div *ngFor="let idx of optionIndices()" class="manual-opt-row">
                  <button class="opt-letter-btn"
                    [class.opt-letter-correct]="manualQCorrects().has(idx)"
                    (click)="toggleCorrect(idx)"
                    [title]="manualQCorrects().has(idx) ? 'Retirer comme bonne réponse' : 'Marquer comme bonne réponse'">
                    {{ optLetter(idx) }}
                  </button>
                  <input [ngModel]="manualQOptions[idx]" (ngModelChange)="manualQOptions[idx]=$event"
                    class="input-field" style="height:34px;font-size:13px"
                    [placeholder]="'Option ' + optLetter(idx) + '...'" />
                </div>
              </div>
              <p class="text-xs mt-1" style="color:#948da3">
                Lettre <span style="color:#7c5ce0;font-weight:700">violette</span> = bonne réponse.
                <span *ngIf="manualQCorrects().size > 1" style="color:#d97706;font-weight:600"> Multiple sélections → QCM multi-réponses.</span>
              </p>
            </div>

            <div *ngIf="manualAddError()" class="err-banner mb-3">{{ manualAddError() }}</div>
            <button (click)="addManualQuestion()" class="btn-secondary w-full justify-center mb-4" style="height:40px">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Ajouter cette question
            </button>

            <div *ngIf="manualQuestions().length > 0">
              <div *ngIf="manualQuizError()" class="err-banner mb-3">{{ manualQuizError() }}</div>
              <button (click)="createManualQuiz()" [disabled]="creatingManualQuiz()"
                class="btn-primary w-full justify-center" style="height:44px">
                <div *ngIf="creatingManualQuiz()" class="spinner-sm"></div>
                <svg *ngIf="!creatingManualQuiz()" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/></svg>
                {{ creatingManualQuiz() ? 'Création...' : 'Créer le quiz (' + manualQuestions().length + ' question' + (manualQuestions().length>1?'s':'') + ')' }}
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  `,
  styles: [`
    .slim-nav { width:56px; display:flex; flex-direction:column; align-items:center; padding:16px 0; gap:8px; background:rgba(255,253,251,.95); border-right:1px solid rgba(167,139,250,.1); }
    .nav-logo { padding:8px; border-radius:12px; background:rgba(167,139,250,.1); margin-bottom:8px; display:flex; }
    .slim-link { width:38px; height:38px; border-radius:11px; display:flex; align-items:center; justify-content:center; color:#948da3; text-decoration:none; transition:all .2s; }
    .slim-link:hover, .slim-link.active { background:rgba(167,139,250,.14); color:#7c5ce0; }
    .module-panel { width:264px; flex-shrink:0; display:flex; flex-direction:column; border-right:1px solid rgba(167,139,250,.12); background:rgba(255,253,251,.88); }
    .panel-header { padding:20px 16px 14px; border-bottom:1px solid rgba(167,139,250,.1); }
    .back-link { display:inline-flex; align-items:center; gap:5px; font-size:12px; color:#948da3; text-decoration:none; margin-bottom:10px; transition:color .2s; }
    .back-link:hover { color:#7c5ce0; }
    .panel-title { font-family:'Fraunces',Georgia,serif; font-size:14px; font-weight:700; color:#221f2c; line-height:1.3; }
    .panel-sub { font-size:11px; color:#948da3; margin-top:2px; }
    .panel-scroll { flex:1; overflow-y:auto; padding:8px 8px 0; }
    .module-item { display:flex; align-items:center; gap:8px; padding:10px 10px; border-radius:12px; cursor:pointer; transition:all .22s; margin-bottom:4px; }
    .module-item:hover { background:rgba(167,139,250,.07); }
    .module-active { background:rgba(167,139,250,.12) !important; border:1px solid rgba(167,139,250,.22); }
    .mod-dot { width:8px; height:8px; border-radius:50%; flex-shrink:0; }
    .quiz-exists-badge { display:inline-flex; align-items:center; gap:3px; font-size:10px; font-weight:700; padding:1px 7px; border-radius:999px; background:rgba(31,157,111,.1); color:#1f9d6f; border:1px solid rgba(31,157,111,.22); white-space:nowrap; }
    /* Quiz Final section */
    .final-quiz-section { margin:8px 4px 4px; padding:10px 12px; border-radius:14px; background:rgba(245,165,36,.06); border:1px solid rgba(245,165,36,.18); }
    .fq-label { display:flex; align-items:center; gap:6px; font-size:11px; font-weight:700; color:#d97706; text-transform:uppercase; letter-spacing:.04em; margin-bottom:8px; }
    .fq-card { display:flex; align-items:center; gap:8px; padding:7px 9px; border-radius:10px; background:rgba(31,157,111,.06); border:1px solid rgba(31,157,111,.18); margin-bottom:7px; }
    .fq-empty { font-size:11px; color:#c4bdd6; margin-bottom:7px; padding:4px 0; }
    .fq-btn { width:100%; padding:7px 10px; border-radius:10px; background:rgba(245,165,36,.12); border:1px solid rgba(245,165,36,.25); color:#d97706; font-size:11px; font-weight:700; cursor:pointer; font-family:inherit; display:flex; align-items:center; justify-content:center; gap:5px; transition:all .18s; }
    .fq-btn:hover { background:rgba(245,165,36,.22); }
    .add-module-form { padding:10px 12px 16px; border-top:1px solid rgba(167,139,250,.1); margin-top:4px; }
    .main-panel { flex:1; overflow-y:auto; display:flex; flex-direction:column; min-width:0; }
    .module-content { display:flex; flex-direction:column; flex:1; }
    .content-header { display:flex; align-items:center; justify-content:space-between; padding:22px 28px 16px; border-bottom:1px solid rgba(167,139,250,.1); gap:12px; flex-wrap:wrap; }
    .lessons-area { padding:16px 28px; display:flex; flex-direction:column; gap:10px; }
    .lesson-card { display:flex; align-items:center; gap:12px; padding:14px; border-radius:18px; background:rgba(255,255,255,.7); border:1px solid rgba(167,139,250,.12); transition:all .22s; }
    .lesson-card:hover { border-color:rgba(167,139,250,.28); box-shadow:0 6px 20px rgba(167,139,250,.1); }
    .lesson-type-badge { font-size:11px; font-weight:700; padding:4px 10px; border-radius:999px; white-space:nowrap; flex-shrink:0; }
    .empty-lessons { display:flex; flex-direction:column; align-items:center; gap:10px; padding:40px; }
    .edit-btn { padding:6px 12px; border-radius:10px; background:rgba(167,139,250,.1); border:none; color:#7c5ce0; font-size:12px; font-weight:600; cursor:pointer; font-family:inherit; transition:background .2s; }
    .edit-btn:hover { background:rgba(167,139,250,.2); }
    .mod-actions { display:flex; align-items:center; gap:4px; flex-shrink:0; }
    .lock-btn { width:28px; height:28px; border-radius:9px; background:rgba(148,141,163,.08); border:none; color:#948da3; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:all .2s; }
    .lock-btn:hover { background:rgba(167,139,250,.15); color:#7c5ce0; }
    .lock-btn-locked { background:rgba(167,139,250,.12); color:#7c5ce0; }
    .lock-btn-locked:hover { background:rgba(167,139,250,.22); }
    .module-locked-row { opacity:.75; }
    .del-btn { width:28px; height:28px; border-radius:9px; background:rgba(242,92,120,.08); border:none; color:#f25c78; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:background .2s; }
    .del-btn:hover { background:rgba(242,92,120,.18); }
    .form-panel { width:380px; flex-shrink:0; border-left:1px solid rgba(167,139,250,.14); background:rgba(255,253,251,.95); display:flex; flex-direction:column; }
    .form-header { display:flex; align-items:center; justify-content:space-between; padding:20px 20px 14px; border-bottom:1px solid rgba(167,139,250,.1); }
    .close-btn { width:30px; height:30px; border-radius:9px; background:rgba(167,139,250,.08); border:none; color:#948da3; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:all .2s; }
    .close-btn:hover { background:rgba(242,92,120,.12); color:#f25c78; }
    .form-scroll { flex:1; overflow-y:auto; padding:16px 20px; }
    .form-footer { display:flex; gap:10px; padding:14px 20px; border-top:1px solid rgba(167,139,250,.1); }
    .field { margin-bottom:16px; }
    .flabel { display:block; font-size:11px; font-weight:700; color:#948da3; text-transform:uppercase; letter-spacing:.04em; margin-bottom:6px; }
    .type-tabs { display:flex; gap:6px; flex-wrap:wrap; }
    .type-tab { display:flex; align-items:center; gap:5px; padding:7px 12px; border-radius:10px; border:1px solid rgba(167,139,250,.2); background:transparent; font-size:12px; font-weight:600; color:#948da3; cursor:pointer; font-family:inherit; transition:all .22s; }
    .type-tab:hover { border-color:rgba(167,139,250,.4); color:#221f2c; }
    .type-active { background:rgba(167,139,250,.12) !important; border-color:#a78bfa !important; color:#7c5ce0 !important; }
    .upload-zone { border:2px dashed rgba(167,139,250,.3); border-radius:16px; padding:20px; cursor:pointer; transition:all .22s; min-height:90px; display:flex; align-items:center; justify-content:center; }
    .upload-zone:hover { border-color:rgba(167,139,250,.6); background:rgba(167,139,250,.04); }
    .upload-zone.uploading { border-color:#a78bfa; background:rgba(167,139,250,.06); cursor:default; }
    .upload-placeholder { display:flex; flex-direction:column; align-items:center; gap:6px; text-align:center; }
    .upload-loading { display:flex; flex-direction:column; align-items:center; gap:8px; }
    .upload-done { display:flex; align-items:center; gap:10px; width:100%; }
    .spinner { width:28px; height:28px; border:3px solid rgba(167,139,250,.2); border-top-color:#a78bfa; border-radius:50%; animation:spin .8s linear infinite; }
    @keyframes spin { to { transform:rotate(360deg); } }
    .or-divider { text-align:center; font-size:11px; color:#c4bdd6; margin:8px 0; font-weight:600; letter-spacing:.06em; }
    .clear-btn { width:24px; height:24px; border-radius:6px; background:rgba(242,92,120,.1); border:none; color:#f25c78; cursor:pointer; font-size:14px; font-weight:700; display:flex; align-items:center; justify-content:center; flex-shrink:0; margin-left:auto; }
    .info-box { display:flex; gap:8px; padding:12px 14px; border-radius:13px; background:rgba(167,139,250,.06); border:1px solid rgba(167,139,250,.14); margin-bottom:16px; }
    .err-banner { padding:10px 14px; border-radius:12px; background:rgba(242,92,120,.08); border:1px solid rgba(242,92,120,.22); color:#f25c78; font-size:13px; }
    .quiz-ai-btn { display:inline-flex; align-items:center; gap:5px; padding:8px 14px; border-radius:12px; background:rgba(167,139,250,.1); border:1px solid rgba(167,139,250,.22); color:#7c5ce0; font-size:12px; font-weight:600; cursor:pointer; font-family:inherit; transition:all .22s; white-space:nowrap; }
    .quiz-ai-btn:hover { background:rgba(167,139,250,.22); border-color:#a78bfa; }
    /* Modal */
    .modal-backdrop { position:fixed; inset:0; background:rgba(34,31,44,.45); backdrop-filter:blur(4px); z-index:100; display:flex; align-items:center; justify-content:center; animation:fadeIn .18s ease; }
    @keyframes fadeIn { from{opacity:0}to{opacity:1} }
    .quiz-modal { background:#fffdfb; border-radius:24px; width:500px; max-width:calc(100vw - 32px); max-height:90vh; overflow-y:auto; box-shadow:0 32px 80px rgba(34,31,44,.22); border:1px solid rgba(167,139,250,.18); animation:slideUp .22s cubic-bezier(.16,1,.3,1); }
    @keyframes slideUp { from{transform:translateY(20px);opacity:0}to{transform:translateY(0);opacity:1} }
    .qm-header { display:flex; align-items:center; gap:12px; padding:20px 22px 16px; border-bottom:1px solid rgba(167,139,250,.1); position:sticky; top:0; background:#fffdfb; z-index:1; }
    .qm-icon { width:40px; height:40px; border-radius:14px; background:rgba(167,139,250,.1); display:flex; align-items:center; justify-content:center; flex-shrink:0; }
    .scope-chip { font-size:10px; font-weight:700; padding:2px 8px; border-radius:999px; background:rgba(167,139,250,.14); color:#7c5ce0; margin-right:6px; }
    .qm-tabs { display:flex; border-bottom:1px solid rgba(167,139,250,.1); background:#fffdfb; position:sticky; top:76px; z-index:1; }
    .qm-tab { flex:1; padding:11px 8px; border:none; background:transparent; cursor:pointer; font-family:inherit; font-size:12px; font-weight:600; color:#948da3; display:flex; align-items:center; justify-content:center; gap:6px; border-bottom:2px solid transparent; transition:all .2s; }
    .qm-tab:hover { color:#7c5ce0; }
    .qm-tab-active { color:#7c5ce0 !important; border-bottom-color:#a78bfa !important; }
    .qm-body { padding:20px 22px 22px; }
    .qm-manual-body { padding:20px 22px 22px; }
    .qm-section-label { font-size:11px; font-weight:700; color:#948da3; text-transform:uppercase; letter-spacing:.05em; margin-bottom:8px; display:block; }
    .lesson-select-list { display:flex; flex-direction:column; gap:5px; max-height:130px; overflow-y:auto; padding:8px 10px; border:1px solid rgba(167,139,250,.14); border-radius:12px; background:rgba(167,139,250,.03); }
    .lesson-select-item { display:flex; align-items:center; gap:8px; padding:3px 0; }
    .course-lesson-tree { max-height:180px; overflow-y:auto; border:1px solid rgba(167,139,250,.14); border-radius:12px; background:rgba(167,139,250,.03); }
    .tree-module { border-bottom:1px solid rgba(167,139,250,.08); }
    .tree-module:last-child { border-bottom:none; }
    .tree-mod-header { padding:6px 10px 4px; background:rgba(167,139,250,.05); }
    .tree-lesson { padding:1px 10px 1px 8px; }
    .count-selector { display:flex; gap:10px; }
    .count-btn { flex:1; display:flex; flex-direction:column; align-items:center; gap:3px; padding:12px 8px; border-radius:14px; border:2px solid rgba(167,139,250,.18); background:transparent; cursor:pointer; font-family:inherit; font-size:22px; font-weight:700; color:#221f2c; transition:all .22s; }
    .count-btn:hover { border-color:rgba(167,139,250,.4); background:rgba(167,139,250,.04); }
    .count-active { border-color:#a78bfa !important; background:rgba(167,139,250,.1) !important; color:#7c5ce0 !important; }
    .count-sub { font-size:11px; font-weight:500; color:#948da3; }
    .count-active .count-sub { color:#a78bfa; }
    .type-selector { display:flex; gap:8px; }
    .qtype-btn { flex:1; padding:9px 8px; border-radius:12px; border:1.5px solid rgba(167,139,250,.2); background:transparent; cursor:pointer; font-family:inherit; font-size:12px; font-weight:600; color:#948da3; transition:all .2s; }
    .qtype-btn:hover { border-color:rgba(167,139,250,.4); color:#221f2c; }
    .qtype-active { border-color:#a78bfa !important; background:rgba(167,139,250,.1) !important; color:#7c5ce0 !important; }
    /* Manual quiz */
    .mini-count-row { display:flex; gap:4px; margin-top:6px; }
    .mini-count-btn { width:30px; height:28px; border-radius:8px; border:1.5px solid rgba(167,139,250,.2); background:transparent; cursor:pointer; font-family:inherit; font-size:12px; font-weight:700; color:#948da3; transition:all .18s; display:flex; align-items:center; justify-content:center; }
    .mini-count-btn:hover { border-color:rgba(167,139,250,.4); color:#221f2c; }
    .mini-count-active { border-color:#a78bfa !important; background:rgba(167,139,250,.12) !important; color:#7c5ce0 !important; }
    .mode-hint { display:flex; align-items:center; gap:5px; margin-top:6px; }
    .manual-q-list { display:flex; flex-direction:column; gap:6px; }
    .manual-q-item { display:flex; align-items:center; gap:8px; padding:8px 10px; border-radius:10px; background:rgba(167,139,250,.05); border:1px solid rgba(167,139,250,.1); }
    .manual-q-num { width:22px; height:22px; border-radius:7px; background:rgba(167,139,250,.15); color:#7c5ce0; font-size:10px; font-weight:700; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
    .manual-q-text { font-size:12px; color:#4a4458; flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    .multi-badge { font-size:9px; font-weight:700; padding:1px 6px; border-radius:999px; background:rgba(245,165,36,.12); color:#d97706; border:1px solid rgba(245,165,36,.2); flex-shrink:0; }
    .qm-divider { height:1px; background:rgba(167,139,250,.12); margin:12px 0; }
    .manual-opts { display:flex; flex-direction:column; gap:6px; }
    .manual-opt-row { display:flex; align-items:center; gap:8px; }
    .opt-letter-btn { width:30px; height:34px; border-radius:8px; background:rgba(167,139,250,.08); border:1.5px solid rgba(167,139,250,.18); color:#948da3; font-size:12px; font-weight:700; cursor:pointer; display:flex; align-items:center; justify-content:center; flex-shrink:0; transition:all .18s; font-family:inherit; }
    .opt-letter-btn:hover { background:rgba(167,139,250,.15); border-color:rgba(167,139,250,.3); color:#7c5ce0; }
    .opt-letter-correct { background:rgba(139,110,242,.18) !important; border-color:#a78bfa !important; color:#7c5ce0 !important; }
    .qm-success { padding:28px 22px; display:flex; flex-direction:column; align-items:center; text-align:center; gap:4px; }
    .success-icon { width:56px; height:56px; border-radius:20px; background:rgba(110,231,183,.12); border:1px solid rgba(110,231,183,.3); display:flex; align-items:center; justify-content:center; margin-bottom:8px; }
    .spinner-sm { width:16px; height:16px; border:2px solid rgba(255,255,255,.3); border-top-color:#fff; border-radius:50%; animation:spin .7s linear infinite; }
    /* Shared */
    .btn-primary { display:inline-flex; align-items:center; gap:6px; padding:10px 18px; border-radius:14px; background:linear-gradient(135deg,#a78bfa,#fb7299); border:none; color:white; font-size:13px; font-weight:700; cursor:pointer; font-family:inherit; transition:all .22s; box-shadow:0 4px 14px rgba(167,139,250,.3); white-space:nowrap; }
    .btn-primary:hover:not(:disabled) { transform:translateY(-1px); box-shadow:0 6px 20px rgba(167,139,250,.42); }
    .btn-primary:disabled { opacity:.45; cursor:default; transform:none; box-shadow:none; }
    .btn-secondary { display:inline-flex; align-items:center; gap:6px; padding:10px 18px; border-radius:14px; background:rgba(167,139,250,.1); border:1px solid rgba(167,139,250,.2); color:#7c5ce0; font-size:13px; font-weight:600; cursor:pointer; font-family:inherit; transition:all .22s; white-space:nowrap; }
    .btn-secondary:hover { background:rgba(167,139,250,.18); }
    .input-field { width:100%; padding:9px 12px; border-radius:12px; border:1px solid rgba(167,139,250,.2); background:rgba(255,255,255,.7); font-size:14px; color:#221f2c; font-family:inherit; outline:none; transition:border .2s; box-sizing:border-box; }
    .input-field:focus { border-color:#a78bfa; background:#fff; }
    .resize-none { resize:none; }
    .skeleton { background:linear-gradient(90deg,rgba(167,139,250,.08) 25%,rgba(167,139,250,.15) 50%,rgba(167,139,250,.08) 75%); background-size:200% 100%; animation:shimmer 1.5s infinite; }
    @keyframes shimmer { to { background-position:-200% 0; } }
    .w-full { width:100%; }
    .ml-auto { margin-left:auto; }
    .hidden { display:none; }
  `],
})
export class TrainerCourseContent implements OnInit {
  loading = signal(true);
  savingModule = signal(false);
  savingLesson = signal(false);
  uploadingVideo = signal(false);
  uploadingPdf = signal(false);
  courseTitle = signal('');
  courseId = signal('');
  modules = signal<Module[]>([]);
  activeModule = signal<Module | null>(null);
  lessonFormOpen = signal(false);
  editingLesson = signal<Lesson | null>(null);
  formError = signal('');
  newModuleTitle = '';
  lessonForm: any = EMPTY_LESSON();

  // Course final quiz
  courseFinalQuiz = signal<QuizRef | null>(null);

  // Quiz modal state
  quizModalOpen = signal(false);
  quizModalTarget = signal<{ scope: string; id: string; label: string } | null>(null);
  quizMode = signal<'AI' | 'MANUAL'>('AI');

  // AI mode
  quizGenCount = signal<number>(10);
  quizQuestionType = signal<'SINGLE' | 'MIXED'>('SINGLE');
  quizSelectedLessons = signal<Set<string>>(new Set());
  generatingQuiz = signal(false);
  quizGenResult = signal<{ title: string; questionsCount: number } | null>(null);
  quizGenError = signal('');

  // Manual mode — dynamic options + multi-correct
  manualQuestions = signal<ManualQuestion[]>([]);
  manualQText = '';
  manualQOptions = ['', '', '', '', '', ''];
  manualQOptionCount = signal(4);
  manualQCorrects = signal<Set<number>>(new Set([0]));
  creatingManualQuiz = signal(false);
  manualQuizError = signal('');
  manualAddError = signal('');

  optionIndices = computed(() => Array.from({ length: this.manualQOptionCount() }, (_, i) => i));

  moduleQuizMap = signal<Record<string, QuizRef>>({});

  questionTypes = [
    { value: 'SINGLE' as const, label: 'Choix unique' },
    { value: 'MIXED'  as const, label: 'Mixte' },
  ];

  lessonTypes = [
    { value: 'VIDEO', label: 'Vidéo',  color: '#a78bfa', icon: '<svg width="11" height="11" viewBox="0 0 24 24" fill="#a78bfa"><polygon points="5 3 19 12 5 21 5 3"/></svg>' },
    { value: 'PDF',   label: 'PDF',    color: '#fb7299', icon: '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fb7299" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/></svg>' },
    { value: 'TEXT',  label: 'Texte',  color: '#1f9d6f', icon: '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#1f9d6f" stroke-width="2"><line x1="17" y1="10" x2="3" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/></svg>' },
    { value: 'QUIZ',  label: 'Quiz',   color: '#f5a524', icon: '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#f5a524" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/></svg>' },
  ];

  get role() { return this.auth.user()?.role ?? 'TRAINER'; }
  get userName() { return this.auth.user()?.name ?? ''; }

  constructor(
    private route: ActivatedRoute,
    private auth: AuthService,
    private api: ApiService,
    private http: HttpClient,
    private toast: ToastService,
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('courseId')!;
    this.courseId.set(id);
    this.api.get<any>(`/courses/${id}`).subscribe({
      next: c => this.courseTitle.set(c?.title ?? ''),
    });
    this.api.get<Module[]>(`/courses/${id}/modules`).subscribe({
      next: mods => {
        const sorted = (mods ?? []).sort((a, b) => a.sortOrder - b.sortOrder);
        sorted.forEach(m => { m.lessons = (m.lessons ?? []).sort((a, b) => a.sortOrder - b.sortOrder); });
        this.modules.set(sorted);
        if (sorted.length > 0) this.activeModule.set(sorted[0]);
        this.loading.set(false);
        this.loadModuleQuizzes(sorted);
        this.loadCourseFinalQuiz(id);
      },
      error: () => this.loading.set(false),
    });
  }

  private loadModuleQuizzes(mods: Module[]) {
    mods.forEach(mod => {
      this.api.get<any>(`/quizzes/module/${mod.id}`).subscribe({
        next: quiz => {
          if (quiz?.id) {
            this.moduleQuizMap.set({
              ...this.moduleQuizMap(),
              [mod.id]: { id: quiz.id, title: quiz.title, questionsCount: quiz.questions?.length ?? 0 },
            });
          }
        },
      });
    });
  }

  private loadCourseFinalQuiz(courseId: string) {
    this.api.get<any[]>(`/quizzes/course/${courseId}`).subscribe({
      next: quizzes => {
        const final = (quizzes ?? []).find(q => !q.moduleId);
        if (final) {
          this.courseFinalQuiz.set({ id: final.id, title: final.title, questionsCount: final.questionsCount ?? 0 });
        }
      },
    });
  }

  selectModule(mod: Module) { this.activeModule.set(mod); this.closeForm(); }

  addModule() {
    const title = this.newModuleTitle.trim();
    if (!title) return;
    const courseId = this.courseId();
    this.savingModule.set(true);
    this.api.post<Module>(`/courses/${courseId}/modules`, { title, sortOrder: this.modules().length }).subscribe({
      next: mod => {
        mod.lessons = [];
        this.modules.update(list => [...list, mod]);
        this.activeModule.set(mod);
        this.newModuleTitle = '';
        this.savingModule.set(false);
      },
      error: () => this.savingModule.set(false),
    });
  }

  toggleModuleLock(mod: Module) {
    this.api.patch<Module>(`/modules/${mod.id}/lock`, {}).subscribe({
      next: updated => {
        this.modules.update(list => list.map(m => m.id === mod.id ? { ...m, locked: updated.locked } : m));
        this.toast.info(updated.locked ? 'Module verrouillé pour les stagiaires.' : 'Module déverrouillé.');
      },
      error: () => this.toast.error('Erreur lors du verrouillage.'),
    });
  }

  deleteModule(moduleId: string) {
    this.toast.confirm('Supprimer ce module et toutes ses leçons ?').then(ok => {
      if (!ok) return;
      this.api.delete(`/modules/${moduleId}`).subscribe({
        next: () => {
          this.modules.update(list => list.filter(m => m.id !== moduleId));
          if (this.activeModule()?.id === moduleId) this.activeModule.set(this.modules()[0] ?? null);
          this.toast.success('Module supprimé.');
        },
        error: () => this.toast.error('Impossible de supprimer ce module.'),
      });
    });
  }

  openNewLesson() {
    this.editingLesson.set(null);
    this.lessonForm = EMPTY_LESSON();
    this.formError.set('');
    this.lessonFormOpen.set(true);
  }

  editLesson(lesson: Lesson) {
    this.editingLesson.set(lesson);
    this.lessonForm = { ...lesson };
    this.formError.set('');
    this.lessonFormOpen.set(true);
  }

  closeForm() { this.lessonFormOpen.set(false); this.editingLesson.set(null); this.formError.set(''); }

  saveLesson() {
    if (!this.lessonForm.title?.trim()) { this.formError.set('Le titre est obligatoire.'); return; }
    this.savingLesson.set(true);
    this.formError.set('');
    const payload = {
      title: this.lessonForm.title, type: this.lessonForm.type,
      content: this.lessonForm.content || null,
      videoUrl: this.lessonForm.videoUrl || null,
      pdfUrl: this.lessonForm.pdfUrl || null,
      durationMinutes: this.lessonForm.durationMinutes ?? 0,
      sortOrder: this.editingLesson() ? this.editingLesson()!.sortOrder : (this.activeModule()?.lessons.length ?? 0),
      free: this.lessonForm.free ?? false,
    };
    const req = this.editingLesson()
      ? this.api.put<Lesson>(`/lessons/${this.editingLesson()!.id}`, payload)
      : this.api.post<Lesson>(`/modules/${this.activeModule()!.id}/lessons`, payload);

    req.subscribe({
      next: saved => {
        this.modules.update(list => list.map(m => {
          if (m.id !== this.activeModule()!.id) return m;
          const lessons = this.editingLesson()
            ? m.lessons.map(l => l.id === saved.id ? saved : l)
            : [...m.lessons, saved];
          return { ...m, lessons };
        }));
        this.activeModule.update(m => m ? { ...m, lessons: this.modules().find(x => x.id === m.id)?.lessons ?? m.lessons } : m);
        this.savingLesson.set(false);
        this.closeForm();
      },
      error: () => { this.formError.set('Erreur lors de la sauvegarde.'); this.savingLesson.set(false); },
    });
  }

  deleteLesson(lessonId: string) {
    this.toast.confirm('Supprimer cette leçon définitivement ?').then(ok => {
      if (!ok) return;
      this.api.delete(`/lessons/${lessonId}`).subscribe({
        next: () => {
          this.modules.update(list => list.map(m => m.id === this.activeModule()?.id
            ? { ...m, lessons: m.lessons.filter(l => l.id !== lessonId) } : m));
          this.activeModule.update(m => m ? { ...m, lessons: m.lessons.filter(l => l.id !== lessonId) } : m);
          this.toast.success('Leçon supprimée.');
        },
        error: () => this.toast.error('Impossible de supprimer cette leçon.'),
      });
    });
  }

  onVideoFile(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.uploadFile(file, 'video');
  }

  onPdfFile(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.uploadFile(file, 'pdf');
  }

  private uploadFile(file: File, kind: 'video' | 'pdf') {
    if (kind === 'video') this.uploadingVideo.set(true);
    else this.uploadingPdf.set(true);
    const formData = new FormData();
    formData.append('file', file);
    this.api.postForm<string>('/lessons/upload', formData).subscribe({
      next: url => {
        if (kind === 'video') { this.lessonForm.videoUrl = url; this.uploadingVideo.set(false); }
        else { this.lessonForm.pdfUrl = url; this.uploadingPdf.set(false); }
      },
      error: (err) => {
        this.formError.set(err?.error?.message ?? "Erreur lors de l'upload.");
        if (kind === 'video') this.uploadingVideo.set(false);
        else this.uploadingPdf.set(false);
      },
    });
  }

  typeColor(type: string): string {
    return ({ VIDEO: '#a78bfa', PDF: '#fb7299', TEXT: '#1f9d6f', QUIZ: '#f5a524' } as any)[type] ?? '#948da3';
  }
  typeLabel(type: string): string {
    return ({ VIDEO: 'Vidéo', PDF: 'PDF', TEXT: 'Texte', QUIZ: 'Quiz' } as any)[type] ?? type;
  }
  optLetter(i: number): string { return 'ABCDEF'[i] ?? String(i + 1); }

  openQuizModal(scope: string, id: string, label: string) {
    this.quizModalTarget.set({ scope, id, label });
    this.quizMode.set('AI');
    this.quizGenCount.set(10);
    this.quizQuestionType.set('SINGLE');
    this.quizGenResult.set(null);
    this.quizGenError.set('');
    if (scope === 'MODULE') {
      const ids = new Set(this.activeModule()?.lessons.map(l => l.id) ?? []);
      this.quizSelectedLessons.set(ids);
    } else {
      // Pre-select ALL lessons from ALL modules for the final course quiz
      const allIds = new Set(this.modules().flatMap(m => m.lessons.map(l => l.id)));
      this.quizSelectedLessons.set(allIds);
    }
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

  toggleLessonSelection(lessonId: string) {
    const curr = new Set(this.quizSelectedLessons());
    if (curr.has(lessonId)) curr.delete(lessonId);
    else curr.add(lessonId);
    this.quizSelectedLessons.set(curr);
  }

  setOptionCount(n: number) {
    this.manualQOptionCount.set(n);
    const trimmed = new Set([...this.manualQCorrects()].filter(i => i < n));
    if (trimmed.size === 0) trimmed.add(0);
    this.manualQCorrects.set(trimmed);
  }

  toggleCorrect(idx: number) {
    const current = new Set(this.manualQCorrects());
    if (current.has(idx)) {
      if (current.size > 1) current.delete(idx);
    } else {
      current.add(idx);
    }
    this.manualQCorrects.set(current);
  }

  moduleFullySelected(mod: Module): boolean {
    return mod.lessons.every(l => this.quizSelectedLessons().has(l.id));
  }

  selectedInModule(mod: Module): number {
    return mod.lessons.filter(l => this.quizSelectedLessons().has(l.id)).length;
  }

  toggleModuleSelection(mod: Module) {
    const curr = new Set(this.quizSelectedLessons());
    const allSelected = mod.lessons.every(l => curr.has(l.id));
    if (allSelected) {
      mod.lessons.forEach(l => curr.delete(l.id));
    } else {
      mod.lessons.forEach(l => curr.add(l.id));
    }
    this.quizSelectedLessons.set(curr);
  }

  generateQuiz() {
    const target = this.quizModalTarget();
    if (!target) return;
    const courseId = this.courseId();
    this.generatingQuiz.set(true);
    this.quizGenError.set('');
    const body: any = {
      scope: target.scope,
      scopeId: target.id,
      courseId,
      count: this.quizGenCount(),
      questionType: this.quizQuestionType(),
    };
    // Always pass selected lesson IDs so backend knows exactly what to cover
    const selected = [...this.quizSelectedLessons()];
    if (selected.length > 0) body.lessonIds = selected;
    this.api.post<any>('/ai/generate-quiz-for', body).subscribe({
      next: res => {
        this.generatingQuiz.set(false);
        if (res?.quizId) {
          this.quizGenResult.set({ title: res.title, questionsCount: res.questionsCount });
          if (target.scope === 'MODULE') {
            this.moduleQuizMap.set({ ...this.moduleQuizMap(), [target.id]: { id: res.quizId, title: res.title, questionsCount: res.questionsCount } });
          } else {
            this.courseFinalQuiz.set({ id: res.quizId, title: res.title, questionsCount: res.questionsCount });
          }
        } else {
          this.quizGenError.set(res?.error ?? 'Erreur lors de la génération.');
        }
      },
      error: () => {
        this.generatingQuiz.set(false);
        this.quizGenError.set('Service IA indisponible. Vérifiez que le service IA est démarré.');
      },
    });
  }

  addManualQuestion() {
    this.manualAddError.set('');
    if (!this.manualQText.trim()) { this.manualAddError.set("L'énoncé est obligatoire."); return; }
    const count = this.manualQOptionCount();
    const opts = this.manualQOptions.slice(0, count);
    if (opts.some(o => !o.trim())) { this.manualAddError.set('Remplissez toutes les options.'); return; }
    const corrects = [...this.manualQCorrects()].filter(i => i < count).sort();
    if (corrects.length === 0) { this.manualAddError.set('Sélectionnez au moins une bonne réponse.'); return; }
    this.manualQuestions.update(list => [...list, {
      text: this.manualQText.trim(),
      options: opts.map(o => o.trim()),
      correct: corrects[0],
      correctAnswers: corrects,
    }]);
    this.manualQText = '';
    this.manualQOptions = ['', '', '', '', '', ''];
    this.manualQCorrects.set(new Set([0]));
    this.manualAddError.set('');
  }

  removeManualQuestion(index: number) {
    this.manualQuestions.update(list => list.filter((_, i) => i !== index));
  }

  createManualQuiz() {
    const qs = this.manualQuestions();
    if (qs.length === 0) return;
    const target = this.quizModalTarget();
    if (!target) return;
    const courseId = this.courseId();
    const moduleId = target.scope === 'MODULE' ? target.id : null;
    this.creatingManualQuiz.set(true);
    this.manualQuizError.set('');
    const payload = {
      courseId,
      moduleId,
      title: 'Quiz — ' + target.label,
      timeLimit: Math.max(10, Math.ceil(qs.length * 1.5)),
      passingScore: 70,
      questions: qs.map(q => ({ text: q.text, options: q.options, correct: q.correct, correctAnswers: q.correctAnswers })),
    };
    this.api.post<any>('/quizzes', payload).subscribe({
      next: quiz => {
        this.creatingManualQuiz.set(false);
        if (quiz?.id) {
          this.quizGenResult.set({ title: quiz.title, questionsCount: qs.length });
          if (target.scope === 'MODULE') {
            this.moduleQuizMap.set({ ...this.moduleQuizMap(), [target.id]: { id: quiz.id, title: quiz.title, questionsCount: qs.length } });
          } else {
            this.courseFinalQuiz.set({ id: quiz.id, title: quiz.title, questionsCount: qs.length });
          }
        } else {
          this.manualQuizError.set('Erreur lors de la création du quiz.');
        }
      },
      error: () => {
        this.creatingManualQuiz.set(false);
        this.manualQuizError.set('Erreur lors de la création du quiz.');
      },
    });
  }
}
