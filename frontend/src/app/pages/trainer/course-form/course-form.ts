import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../core/services/auth';
import { ApiService } from '../../../core/services/api';
import { Sidebar } from '../../../shared/sidebar/sidebar';

interface CourseFormData {
  title: string; description: string; category: string;
  level: string; price: number; tags: string; published: boolean;
  thumbnail: string;
}

@Component({
  selector: 'app-course-form',
  standalone: true,
  imports: [CommonModule, FormsModule, Sidebar],
  template: `
    <div class="flex h-screen overflow-hidden" style="background:linear-gradient(160deg,#fffdfb 0%,#fdf2f8 60%,#f6f0ff 100%)">
      <app-sidebar [role]="role" [userName]="userName"></app-sidebar>
      <main class="flex-1 overflow-y-auto p-7">

        <!-- Header -->
        <div class="mb-6 reveal">
          <h1 class="font-display text-2xl font-bold" style="color:#221f2c">
            {{ isEdit ? 'Modifier le cours' : 'Créer un nouveau cours' }}
          </h1>
          <p class="text-sm mt-0.5" style="color:#948da3">
            {{ isEdit ? 'Mettez à jour les informations du cours' : 'Remplissez les informations, puis ajoutez vos leçons et fichiers' }}
          </p>
        </div>

        <!-- Steps indicator (new course only) -->
        <div *ngIf="!isEdit" class="steps-bar reveal stagger-1 mb-6">
          <div class="step active">
            <div class="step-circle">1</div>
            <span>Informations</span>
          </div>
          <div class="step-line"></div>
          <div class="step">
            <div class="step-circle">2</div>
            <span>Contenu (modules & leçons)</span>
          </div>
          <div class="step-line"></div>
          <div class="step">
            <div class="step-circle">3</div>
            <span>Publier</span>
          </div>
        </div>

        <!-- Info banner -->
        <div *ngIf="!isEdit" class="info-banner reveal stagger-2 mb-5">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8b6ef2" stroke-width="2" style="flex-shrink:0"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <span>Après avoir créé le cours, vous serez automatiquement redirigé vers l'éditeur de contenu pour ajouter vos <strong>modules</strong>, <strong>leçons</strong> et <strong>fichiers</strong> (vidéos, PDF).</span>
        </div>

        <div class="max-w-2xl reveal stagger-2">
          <div *ngIf="error()" class="err-banner mb-4 bounce-in">{{ error() }}</div>
          <div *ngIf="saved()" class="ok-banner mb-4 bounce-in">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            Cours enregistré — redirection vers l'éditeur de contenu...
          </div>

          <form (ngSubmit)="save()" class="card p-6 space-y-5">

            <!-- Image de couverture -->
            <div>
              <label class="form-label">Image de couverture</label>
              <div class="thumb-upload-row">
                <!-- Preview -->
                <div class="thumb-preview" [class.has-img]="form.thumbnail"
                  [style.backgroundImage]="form.thumbnail ? 'url(' + (form.thumbnail.startsWith('http') ? form.thumbnail : '/api' + form.thumbnail) + ')' : 'none'">
                  <div *ngIf="!form.thumbnail" class="thumb-placeholder">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#c4bdd6" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                  </div>
                  <button *ngIf="form.thumbnail" type="button" (click)="form.thumbnail = ''" class="thumb-clear">×</button>
                </div>
                <!-- Upload zone -->
                <div class="thumb-right">
                  <div class="thumb-zone" (click)="thumbInput.click()" [class.uploading]="uploadingThumb()">
                    <input #thumbInput type="file" accept="image/jpeg,image/png,image/webp" class="hidden" (change)="onThumbFile($event)" />
                    <div *ngIf="!uploadingThumb()">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" stroke-width="2"><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></svg>
                      <span>Cliquez pour uploader</span>
                      <span class="hint">JPG, PNG, WebP — max 5 Mo</span>
                    </div>
                    <div *ngIf="uploadingThumb()" class="uploading-inner">
                      <div class="mini-spinner"></div>
                      <span>Upload...</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Titre -->
            <div>
              <label class="form-label">Titre du cours *</label>
              <input type="text" [(ngModel)]="form.title" name="title" required class="input-field"
                placeholder="Ex : Introduction à Python, Gestion de projet Agile..." />
            </div>

            <!-- Description + IA -->
            <div>
              <div class="flex items-center justify-between mb-1.5">
                <label class="form-label" style="margin-bottom:0">Description *</label>
                <button type="button" (click)="generateDescription()" [disabled]="generatingDesc()" class="ai-btn">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
                  {{ generatingDesc() ? 'Génération...' : 'Générer avec IA' }}
                </button>
              </div>
              <textarea [(ngModel)]="form.description" name="description" rows="4" required
                class="input-field resize-none"
                placeholder="Décrivez ce que les stagiaires vont apprendre, les prérequis, les objectifs..."></textarea>
            </div>

            <!-- Catégorie -->
            <div>
              <label class="form-label">Domaine / Catégorie *</label>
              <div class="cat-grid">
                <button *ngFor="let c of categories" type="button"
                  class="cat-btn"
                  [class.cat-selected]="form.category === c.value"
                  (click)="form.category = c.value">
                  <span class="cat-icon">{{ c.icon }}</span>
                  <span class="cat-label">{{ c.label }}</span>
                </button>
              </div>
              <input type="hidden" [(ngModel)]="form.category" name="category" required />
            </div>

            <!-- Niveau -->
            <div>
              <label class="form-label">Niveau cible</label>
              <div class="level-group">
                <button *ngFor="let l of levels" type="button"
                  class="level-btn"
                  [class.level-selected]="form.level === l.value"
                  (click)="form.level = l.value">
                  {{ l.label }}
                </button>
              </div>
            </div>

            <!-- Tags -->
            <div>
              <label class="form-label">Mots-clés (optionnel)</label>
              <input type="text" [(ngModel)]="form.tags" name="tags" class="input-field"
                placeholder="Ex : python, programmation, débutant — séparés par des virgules" />
            </div>

            <!-- Publier -->
            <div class="publish-row">
              <div class="publish-info">
                <p class="text-sm font-semibold" style="color:#221f2c">Publier maintenant</p>
                <p class="text-xs" style="color:#948da3">Le cours sera visible par les stagiaires dès sa création</p>
              </div>
              <label class="toggle">
                <input type="checkbox" [(ngModel)]="form.published" name="published" />
                <span class="toggle-track"></span>
              </label>
            </div>

            <!-- Actions -->
            <div class="flex gap-3 pt-2">
              <button type="button" (click)="router.navigate(['/trainer/courses'])" class="btn-secondary flex-1 justify-center">
                Annuler
              </button>
              <button type="submit" [disabled]="saving() || !form.category" class="btn-primary flex-1 justify-center">
                <svg *ngIf="saving()" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="spin"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                {{ saving() ? 'Enregistrement...' : (isEdit ? 'Mettre à jour' : 'Créer et ajouter le contenu') }}
              </button>
            </div>

          </form>
        </div>
      </main>
    </div>
  `,
  styles: [`
    .form-label { display:block; font-size:12px; font-weight:600; color:#948da3; letter-spacing:.04em; text-transform:uppercase; margin-bottom:6px; }
    .err-banner { padding:11px 16px; border-radius:14px; background:rgba(242,92,120,.08); border:1px solid rgba(242,92,120,.22); color:#f25c78; font-size:13px; }
    .ok-banner { display:flex; align-items:center; gap:8px; padding:11px 16px; border-radius:14px; background:rgba(110,231,183,.12); border:1px solid rgba(110,231,183,.3); color:#1f9d6f; font-size:13px; }

    /* Steps */
    .steps-bar { display:flex; align-items:center; gap:0; padding:16px 20px; border-radius:18px; background:rgba(167,139,250,.06); border:1px solid rgba(167,139,250,.14); }
    .step { display:flex; align-items:center; gap:8px; flex-shrink:0; }
    .step-circle { width:28px; height:28px; border-radius:50%; background:rgba(167,139,250,.14); border:2px solid rgba(167,139,250,.25); display:flex; align-items:center; justify-content:center; font-size:12px; font-weight:700; color:#948da3; }
    .step span { font-size:12px; font-weight:600; color:#948da3; }
    .step.active .step-circle { background:linear-gradient(135deg,#a78bfa,#fb7299); border-color:transparent; color:white; box-shadow:0 4px 12px rgba(167,139,250,.4); }
    .step.active span { color:#221f2c; }
    .step-line { flex:1; height:2px; background:rgba(167,139,250,.18); margin:0 10px; }

    /* Info banner */
    .info-banner { display:flex; align-items:flex-start; gap:10px; padding:12px 16px; border-radius:14px; background:rgba(167,139,250,.07); border:1px solid rgba(167,139,250,.2); font-size:13px; color:#4a4458; line-height:1.5; }
    .info-banner strong { color:#7c5ce0; }

    /* Category grid */
    .cat-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:8px; }
    .cat-btn { display:flex; align-items:center; gap:8px; padding:10px 12px; border-radius:13px; border:1.5px solid rgba(167,139,250,.18); background:rgba(167,139,250,.04); cursor:pointer; transition:all .18s; text-align:left; font-family:inherit; }
    .cat-btn:hover { background:rgba(167,139,250,.1); border-color:rgba(167,139,250,.3); }
    .cat-btn.cat-selected { background:linear-gradient(135deg,rgba(167,139,250,.18),rgba(251,114,153,.1)); border-color:rgba(167,139,250,.5); box-shadow:0 2px 10px rgba(167,139,250,.18); }
    .cat-icon { font-size:18px; flex-shrink:0; }
    .cat-label { font-size:12px; font-weight:600; color:#221f2c; line-height:1.3; }
    .cat-btn.cat-selected .cat-label { color:#7c5ce0; }

    /* Level group */
    .level-group { display:flex; gap:6px; }
    .level-btn { flex:1; padding:8px 4px; border-radius:10px; border:1.5px solid rgba(167,139,250,.18); background:rgba(167,139,250,.04); font-size:11px; font-weight:600; color:#948da3; cursor:pointer; transition:all .18s; font-family:inherit; }
    .level-btn:hover { background:rgba(167,139,250,.1); }
    .level-btn.level-selected { background:linear-gradient(135deg,rgba(167,139,250,.2),rgba(251,114,153,.12)); border-color:rgba(167,139,250,.45); color:#7c5ce0; }

    /* Price */
    .price-wrap { position:relative; }
    .price-sym { position:absolute; left:12px; top:50%; transform:translateY(-50%); font-size:12px; font-weight:700; color:#948da3; z-index:1; }
    .price-input { padding-left:44px !important; }

    /* Publish toggle */
    .publish-row { display:flex; align-items:center; justify-content:space-between; padding:14px 16px; border-radius:14px; background:rgba(167,139,250,.05); border:1px solid rgba(167,139,250,.12); }
    .toggle { position:relative; width:44px; height:24px; flex-shrink:0; }
    .toggle input { opacity:0; width:0; height:0; position:absolute; }
    .toggle-track { position:absolute; inset:0; border-radius:99px; background:rgba(167,139,250,.2); transition:all .25s; cursor:pointer; }
    .toggle-track::after { content:''; position:absolute; top:3px; left:3px; width:18px; height:18px; border-radius:50%; background:white; transition:all .25s; box-shadow:0 2px 6px rgba(0,0,0,.15); }
    .toggle input:checked ~ .toggle-track { background:linear-gradient(135deg,#a78bfa,#fb7299); }
    .toggle input:checked ~ .toggle-track::after { transform:translateX(20px); }

    /* Spinner */
    @keyframes spin { to { transform:rotate(360deg); } }
    .spin { animation:spin .8s linear infinite; }

    .ai-btn { display:inline-flex; align-items:center; gap:6px; padding:5px 12px; border-radius:10px; background:linear-gradient(135deg,rgba(167,139,250,.18),rgba(251,114,153,.12)); border:1px solid rgba(167,139,250,.3); color:#8b6ef2; font-size:12px; font-weight:600; cursor:pointer; transition:all .22s; font-family:inherit; }
    .ai-btn:hover:not(:disabled) { background:linear-gradient(135deg,rgba(167,139,250,.28),rgba(251,114,153,.2)); }
    .ai-btn:disabled { opacity:.6; cursor:default; }
    .thumb-upload-row { display:flex; gap:14px; align-items:stretch; }
    .thumb-preview { width:120px; height:80px; flex-shrink:0; border-radius:14px; background:linear-gradient(135deg,rgba(167,139,250,.18),rgba(251,114,153,.12)); border:1.5px dashed rgba(167,139,250,.3); display:flex; align-items:center; justify-content:center; position:relative; overflow:hidden; background-size:cover; background-position:center; }
    .thumb-preview.has-img { border-style:solid; border-color:rgba(167,139,250,.4); }
    .thumb-placeholder { display:flex; align-items:center; justify-content:center; }
    .thumb-clear { position:absolute; top:4px; right:4px; width:20px; height:20px; border-radius:6px; background:rgba(0,0,0,.5); border:none; color:white; cursor:pointer; font-size:13px; font-weight:700; display:flex; align-items:center; justify-content:center; line-height:1; }
    .thumb-right { flex:1; }
    .thumb-zone { border:1.5px dashed rgba(167,139,250,.3); border-radius:14px; padding:14px 16px; cursor:pointer; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:5px; text-align:center; height:80px; transition:all .22s; font-size:12px; color:#948da3; }
    .thumb-zone:hover { border-color:rgba(167,139,250,.6); background:rgba(167,139,250,.04); color:#7c5ce0; }
    .thumb-zone.uploading { border-color:#a78bfa; background:rgba(167,139,250,.06); cursor:default; }
    .thumb-zone span { font-weight:600; }
    .thumb-zone .hint { font-size:11px; font-weight:400; color:#c4bdd6; }
    .uploading-inner { display:flex; align-items:center; gap:8px; }
    .mini-spinner { width:16px; height:16px; border:2px solid rgba(167,139,250,.3); border-top-color:#a78bfa; border-radius:50%; animation:spin .8s linear infinite; }
    .hidden { display:none; }
  `],
})
export class CourseForm implements OnInit {
  saving = signal(false);
  error = signal('');
  saved = signal(false);
  generatingDesc = signal(false);
  uploadingThumb = signal(false);
  courseId: string | null = null;

  form: CourseFormData = { title: '', description: '', category: '', level: 'BEGINNER', price: 0, tags: '', published: false, thumbnail: '' };

  categories = [
    { value: 'Développement Web',      label: 'Développement Web',      icon: '🌐' },
    { value: 'Développement Mobile',   label: 'Dev Mobile',              icon: '📱' },
    { value: 'Data Science',           label: 'Data Science',            icon: '📊' },
    { value: 'Intelligence Artificielle', label: 'Intelligence Artificielle', icon: '🤖' },
    { value: 'DevOps',                 label: 'DevOps & Cloud',          icon: '☁️' },
    { value: 'Cybersécurité',          label: 'Cybersécurité',           icon: '🔒' },
    { value: 'Design UX/UI',           label: 'Design UX/UI',            icon: '🎨' },
    { value: 'Management',             label: 'Management',              icon: '📋' },
    { value: 'Marketing Digital',      label: 'Marketing Digital',       icon: '📣' },
  ];

  levels = [
    { value: 'BEGINNER',     label: 'Débutant' },
    { value: 'INTERMEDIATE', label: 'Intermédiaire' },
    { value: 'ADVANCED',     label: 'Avancé' },
  ];

  get role() { return this.auth.user()?.role ?? 'TRAINER'; }
  get userName() { return this.auth.user()?.name ?? ''; }
  get isEdit() { return !!this.courseId; }

  constructor(private auth: AuthService, private api: ApiService, public router: Router, private route: ActivatedRoute) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.courseId = id;
      this.api.get<any>(`/courses/${id}`).subscribe({
        next: data => {
          this.form = {
            title: data.title ?? '', description: data.description ?? '',
            category: data.category ?? '', level: data.level ?? 'BEGINNER',
            price: data.price ?? 0, tags: (data.tags ?? []).join(', '), published: data.published ?? false,
            thumbnail: data.thumbnail ?? '',
          };
        },
      });
    }
  }

  onThumbFile(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.uploadingThumb.set(true);
    this.error.set('');
    const fd = new FormData();
    fd.append('file', file);
    this.api.postForm<string>('/courses/upload-thumbnail', fd).subscribe({
      next: url => { this.form.thumbnail = url; this.uploadingThumb.set(false); },
      error: () => { this.error.set('Erreur lors de l\'upload de l\'image.'); this.uploadingThumb.set(false); },
    });
  }

  generateDescription() {
    const topic = this.form.title.trim();
    if (!topic) { this.error.set('Saisissez le titre du cours pour que IA puisse générer une description.'); return; }
    this.generatingDesc.set(true);
    this.error.set('');
    this.api.post<any>('/ai/generate-summary', { topic, level: this.form.level }).subscribe({
      next: res => { this.form.description = res?.summary ?? ''; this.generatingDesc.set(false); },
      error: () => { this.error.set('Service IA indisponible. Réessayez plus tard.'); this.generatingDesc.set(false); },
    });
  }

  save() {
    if (!this.form.category) { this.error.set('Veuillez sélectionner un domaine pour le cours.'); return; }
    this.saving.set(true); this.error.set(''); this.saved.set(false);
    const payload = { ...this.form, tags: this.form.tags.split(',').map(t => t.trim()).filter(Boolean) };
    const req = this.courseId
      ? this.api.put<any>(`/courses/${this.courseId}`, payload)
      : this.api.post<any>(`/courses`, payload);
    req.subscribe({
      next: (data) => {
        this.saved.set(true);
        this.saving.set(false);
        if (!this.courseId) {
          const newId = data?.id ?? data?.data?.id;
          setTimeout(() => {
            if (newId) {
              this.router.navigate(['/trainer/courses', newId, 'content']);
            } else {
              this.router.navigate(['/trainer/courses']);
            }
          }, 1200);
        }
      },
      error: (e) => { this.error.set(e.error?.message || 'Erreur lors de la sauvegarde'); this.saving.set(false); },
    });
  }
}
