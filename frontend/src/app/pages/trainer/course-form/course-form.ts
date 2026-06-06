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
}

@Component({
  selector: 'app-course-form',
  standalone: true,
  imports: [CommonModule, FormsModule, Sidebar],
  template: `
    <div class="flex h-screen overflow-hidden" style="background:linear-gradient(160deg,#fffdfb 0%,#fdf2f8 60%,#f6f0ff 100%)">
      <app-sidebar [role]="role" [userName]="userName"></app-sidebar>
      <main class="flex-1 overflow-y-auto p-7">
        <div class="mb-6 reveal">
          <h1 class="font-display text-2xl font-bold" style="color:#221f2c">{{ isEdit ? 'Modifier le cours' : 'Nouveau cours' }}</h1>
          <p class="text-sm mt-0.5" style="color:#948da3">{{ isEdit ? 'Mettez à jour les informations du cours' : 'Créez un nouveau contenu de formation' }}</p>
        </div>

        <div class="max-w-2xl reveal stagger-1">
          <div *ngIf="error()" class="err-banner mb-4 bounce-in">{{ error() }}</div>
          <div *ngIf="saved()" class="ok-banner mb-4 bounce-in">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            Cours enregistré avec succès
          </div>

          <form (ngSubmit)="save()" class="card p-6 space-y-5">
            <div>
              <label class="form-label">Titre du cours *</label>
              <input type="text" [(ngModel)]="form.title" name="title" required class="input-field" placeholder="Ex : Introduction à Python" />
            </div>
            <div>
              <label class="form-label">Description *</label>
              <textarea [(ngModel)]="form.description" name="description" rows="4" required class="input-field resize-none" placeholder="Décrivez le contenu du cours..."></textarea>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="form-label">Catégorie *</label>
                <select [(ngModel)]="form.category" name="category" class="input-field">
                  <option value="">Sélectionner...</option>
                  <option *ngFor="let c of categories" [value]="c">{{ c }}</option>
                </select>
              </div>
              <div>
                <label class="form-label">Niveau</label>
                <select [(ngModel)]="form.level" name="level" class="input-field">
                  <option value="BEGINNER">Débutant</option>
                  <option value="INTERMEDIATE">Intermédiaire</option>
                  <option value="ADVANCED">Avancé</option>
                </select>
              </div>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="form-label">Prix (TND)</label>
                <input type="number" [(ngModel)]="form.price" name="price" min="0" class="input-field" />
              </div>
              <div>
                <label class="form-label">Tags (séparés par des virgules)</label>
                <input type="text" [(ngModel)]="form.tags" name="tags" class="input-field" placeholder="python, programmation, débutant" />
              </div>
            </div>
            <div class="flex items-center gap-3">
              <input type="checkbox" [(ngModel)]="form.published" name="published" id="published" class="checkbox-pastel" />
              <label for="published" class="text-sm cursor-pointer" style="color:#221f2c">Publier immédiatement</label>
            </div>
            <div class="flex gap-3 pt-2">
              <button type="button" (click)="router.navigate(['/trainer/courses'])" class="btn-secondary flex-1 justify-center">
                Annuler
              </button>
              <button type="submit" [disabled]="saving()" class="btn-primary flex-1 justify-center">
                {{ saving() ? 'Enregistrement...' : (isEdit ? 'Mettre à jour' : 'Créer le cours') }}
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
    .checkbox-pastel { width:18px; height:18px; border-radius:6px; accent-color:#a78bfa; cursor:pointer; }
  `],
})
export class CourseForm implements OnInit {
  saving = signal(false);
  error = signal('');
  saved = signal(false);
  courseId: string | null = null;

  form: CourseFormData = { title: '', description: '', category: '', level: 'BEGINNER', price: 0, tags: '', published: false };

  categories = ['Développement Web', 'Développement Mobile', 'Data Science', 'Intelligence Artificielle', 'DevOps', 'Cybersécurité', 'Design UX/UI', 'Management', 'Marketing Digital'];

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
          };
        },
      });
    }
  }

  save() {
    this.saving.set(true); this.error.set(''); this.saved.set(false);
    const payload = { ...this.form, tags: this.form.tags.split(',').map(t => t.trim()).filter(Boolean) };
    const req = this.courseId
      ? this.api.put(`/courses/${this.courseId}`, payload)
      : this.api.post(`/courses`, payload);
    req.subscribe({
      next: () => { this.saved.set(true); this.saving.set(false); if (!this.courseId) setTimeout(() => this.router.navigate(['/trainer/courses']), 1500); },
      error: (e) => { this.error.set(e.error?.message || 'Erreur lors de la sauvegarde'); this.saving.set(false); },
    });
  }
}
