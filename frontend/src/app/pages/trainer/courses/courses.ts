import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth';
import { ApiService } from '../../../core/services/api';
import { ToastService } from '../../../core/services/toast';
import { Sidebar } from '../../../shared/sidebar/sidebar';

type CourseStatus = 'DRAFT' | 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED';

interface Course {
  id: string; title: string; description: string; category: string;
  level: string; price: number; studentsCount?: number; rating?: number;
  published: boolean; status: CourseStatus; rejectionReason?: string;
  thumbnail?: string;
}

@Component({
  selector: 'app-trainer-courses',
  standalone: true,
  imports: [CommonModule, RouterLink, Sidebar],
  template: `
    <div class="flex h-screen overflow-hidden" style="background:linear-gradient(160deg,#fffdfb 0%,#fdf2f8 60%,#f6f0ff 100%)">
      <app-sidebar [role]="role" [userName]="userName"></app-sidebar>
      <main class="flex-1 overflow-y-auto p-7">
        <div class="mb-6 flex items-center justify-between reveal">
          <div>
            <h1 class="font-display text-2xl font-bold" style="color:#221f2c">Mes cours</h1>
            <p class="text-sm mt-0.5" style="color:#948da3">{{ courses().length }} cours créés</p>
          </div>
          <a routerLink="/trainer/courses/new" class="btn-primary">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Nouveau cours
          </a>
        </div>

        <div *ngIf="loading()" class="grid grid-cols-3 gap-4">
          <div *ngFor="let _ of [1,2,3,4,5,6]" class="card p-4 h-48 skeleton"></div>
        </div>

        <div *ngIf="!loading()" class="grid grid-cols-3 gap-4 reveal stagger-1">
          <div *ngFor="let c of courses()" class="course-card">
            <!-- Thumbnail -->
            <div class="course-thumb"
              [style.backgroundImage]="c.thumbnail ? 'url(' + (c.thumbnail.startsWith('http') ? c.thumbnail : '/api' + c.thumbnail) + ')' : 'none'"
              [style.backgroundSize]="'cover'"
              [style.backgroundPosition]="'center'">
              <svg *ngIf="!c.thumbnail" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.6"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
              <!-- Level chip on thumb -->
              <span *ngIf="c.level" class="level-chip">{{ levelLabel(c.level) }}</span>
            </div>

            <!-- Body -->
            <div class="course-body">
              <p class="course-title">{{ c.title }}</p>
              <p class="course-desc">{{ c.description }}</p>

              <!-- Meta row -->
              <div class="meta-row">
                <span class="badge-cat">
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="flex-shrink:0"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
                  {{ c.category }}
                </span>
                <span class="enrolls">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink:0"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                  {{ c.studentsCount ?? 0 }} inscrit{{ (c.studentsCount ?? 0) !== 1 ? 's' : '' }}
                </span>
              </div>
            </div>

            <!-- Rejection reason -->
            <div *ngIf="c.status === 'REJECTED' && c.rejectionReason" class="rejection-notice">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="flex-shrink:0"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              {{ c.rejectionReason }}
            </div>

            <!-- Footer -->
            <div class="course-footer">
              <!-- Status pill -->
              <span class="status-pill" [ngClass]="statusClass(c.status)">
                <span class="status-dot" [ngClass]="dotClass(c.status)"></span>
                {{ statusLabel(c.status) }}
              </span>

              <!-- Actions -->
              <div class="card-actions">
                <button *ngIf="c.status === 'DRAFT' || c.status === 'REJECTED'"
                  (click)="submitForReview(c)" class="btn-submit" title="Soumettre pour validation">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                  Soumettre
                </button>
                <a [routerLink]="'/trainer/courses/' + c.id + '/content'" class="btn-content" title="Gérer le contenu">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
                  Contenu
                </a>
                <a [routerLink]="'/trainer/courses/' + c.id" class="btn-edit" title="Modifier le cours">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  Modifier
                </a>
                <button (click)="deleteCourse(c.id)" class="btn-delete" title="Supprimer">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div *ngIf="!loading() && courses().length === 0" class="card p-16 text-center bounce-in">
          <svg class="mx-auto mb-4" width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#c4bdd6" stroke-width="1.5"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
          <p class="font-bold text-lg mb-2 font-display" style="color:#221f2c">Aucun cours créé</p>
          <a routerLink="/trainer/courses/new" class="btn-primary inline-flex mt-4">Créer mon premier cours</a>
        </div>
      </main>
    </div>
  `,
  styles: [`
    /* Card */
    .course-card { background:rgba(255,255,255,.82); border:1px solid rgba(167,139,250,.13); border-radius:22px; overflow:hidden; display:flex; flex-direction:column; transition:box-shadow .22s, transform .22s; box-shadow:0 2px 12px rgba(167,139,250,.07); }
    .course-card:hover { box-shadow:0 8px 32px rgba(167,139,250,.18); transform:translateY(-2px); }

    /* Thumb */
    .course-thumb { width:100%; height:116px; background:linear-gradient(135deg,rgba(167,139,250,.85),rgba(251,114,153,.7)); display:flex; align-items:center; justify-content:center; position:relative; }
    .level-chip { position:absolute; top:10px; right:10px; font-size:10px; font-weight:700; padding:3px 9px; border-radius:999px; background:rgba(255,255,255,.22); backdrop-filter:blur(6px); color:#fff; border:1px solid rgba(255,255,255,.3); letter-spacing:.03em; }

    /* Body */
    .course-body { padding:14px 16px 10px; flex:1; }
    .course-title { font-size:14px; font-weight:700; color:#221f2c; line-height:1.35; margin-bottom:4px; font-family:'Fraunces',Georgia,serif; }
    .course-desc { font-size:12px; color:#948da3; line-height:1.5; overflow:hidden; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; margin-bottom:12px; }
    .meta-row { display:flex; align-items:center; justify-content:space-between; gap:8px; }
    .badge-cat { display:inline-flex; align-items:center; gap:5px; padding:4px 10px; border-radius:999px; background:rgba(167,139,250,.12); color:#7c5ce0; font-size:11px; font-weight:700; border:1px solid rgba(167,139,250,.2); }
    .enrolls { display:flex; align-items:center; gap:5px; font-size:11px; color:#948da3; font-weight:500; }

    /* Footer */
    .course-footer { display:flex; align-items:center; justify-content:space-between; gap:8px; padding:10px 16px 14px; border-top:1px solid rgba(167,139,250,.09); }
    .status-pill { display:inline-flex; align-items:center; gap:6px; padding:5px 12px; border-radius:999px; font-size:11px; font-weight:700; border:1px solid transparent; }
    .status-published { background:rgba(31,157,111,.08); color:#1f9d6f; border-color:rgba(31,157,111,.2); }
    .status-draft     { background:rgba(148,141,163,.08); color:#948da3; border-color:rgba(148,141,163,.18); }
    .status-pending   { background:rgba(245,165,36,.1); color:#d97706; border-color:rgba(245,165,36,.28); }
    .status-rejected  { background:rgba(242,92,120,.08); color:#f25c78; border-color:rgba(242,92,120,.22); }
    .status-dot { width:6px; height:6px; border-radius:50%; flex-shrink:0; }
    .dot-published { background:#1f9d6f; box-shadow:0 0 0 2px rgba(31,157,111,.2); }
    .dot-draft     { background:#c4bdd6; }
    .dot-pending   { background:#f5a524; box-shadow:0 0 0 2px rgba(245,165,36,.2); animation:pulse-dot 1.8s ease-in-out infinite; }
    .dot-rejected  { background:#f25c78; }
    @keyframes pulse-dot { 0%,100%{box-shadow:0 0 0 2px rgba(245,165,36,.2)} 50%{box-shadow:0 0 0 4px rgba(245,165,36,.1)} }

    .rejection-notice { display:flex; align-items:flex-start; gap:6px; font-size:11px; color:#f25c78; background:rgba(242,92,120,.06); border-left:3px solid rgba(242,92,120,.35); padding:7px 12px; line-height:1.45; }

    .btn-submit { display:inline-flex; align-items:center; gap:5px; padding:7px 12px; border-radius:12px; background:linear-gradient(135deg,#a78bfa,#7c5ce0); border:none; color:#fff; font-size:12px; font-weight:700; cursor:pointer; font-family:inherit; transition:all .22s; white-space:nowrap; box-shadow:0 3px 10px rgba(124,92,224,.28); }
    .btn-submit:hover { box-shadow:0 5px 16px rgba(124,92,224,.4); transform:translateY(-1px); }

    /* Action buttons */
    .card-actions { display:flex; align-items:center; gap:6px; }
    .btn-content { display:inline-flex; align-items:center; gap:5px; padding:7px 12px; border-radius:12px; background:rgba(255,255,255,.9); border:1px solid rgba(167,139,250,.22); color:#5c5470; font-size:12px; font-weight:600; text-decoration:none; font-family:inherit; transition:all .2s; white-space:nowrap; }
    .btn-content:hover { background:rgba(167,139,250,.08); border-color:rgba(167,139,250,.4); color:#7c5ce0; }
    .btn-edit { display:inline-flex; align-items:center; gap:5px; padding:7px 14px; border-radius:12px; background:linear-gradient(135deg,#a78bfa,#7c5ce0); border:none; color:#fff; font-size:12px; font-weight:700; text-decoration:none; font-family:inherit; transition:all .22s; white-space:nowrap; box-shadow:0 3px 10px rgba(124,92,224,.28); }
    .btn-edit:hover { box-shadow:0 5px 16px rgba(124,92,224,.4); transform:translateY(-1px); }
    .btn-delete { width:34px; height:34px; border-radius:11px; background:rgba(242,92,120,.08); border:1px solid rgba(242,92,120,.18); color:#f25c78; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:all .2s; flex-shrink:0; }
    .btn-delete:hover { background:rgba(242,92,120,.18); border-color:rgba(242,92,120,.35); transform:scale(1.07); }
  `],
})
export class TrainerCourses implements OnInit {
  loading = signal(true);
  courses = signal<Course[]>([]);

  get role() { return this.auth.user()?.role ?? 'TRAINER'; }
  get userName() { return this.auth.user()?.name ?? ''; }

  constructor(private auth: AuthService, private api: ApiService, private toast: ToastService) {}

  ngOnInit() {
    this.api.get<Course[]>('/courses/my').subscribe({
      next: data => { this.courses.set(data ?? []); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  levelLabel(level: string) {
    return ({ BEGINNER: 'Débutant', INTERMEDIATE: 'Intermédiaire', ADVANCED: 'Avancé' } as any)[level] ?? level;
  }

  statusLabel(s: CourseStatus) {
    return ({ DRAFT: 'Brouillon', PENDING_REVIEW: 'En attente', APPROVED: 'Publié', REJECTED: 'Rejeté' } as any)[s] ?? s;
  }

  statusClass(s: CourseStatus) {
    return ({ DRAFT: 'status-draft', PENDING_REVIEW: 'status-pending', APPROVED: 'status-published', REJECTED: 'status-rejected' } as any)[s] ?? 'status-draft';
  }

  dotClass(s: CourseStatus) {
    return ({ DRAFT: 'dot-draft', PENDING_REVIEW: 'dot-pending', APPROVED: 'dot-published', REJECTED: 'dot-rejected' } as any)[s] ?? 'dot-draft';
  }

  submitForReview(course: Course) {
    this.api.put<any>(`/courses/${course.id}`, {
      title: course.title, description: course.description, category: course.category,
      level: course.level, price: course.price ?? 0, tags: [],
      published: true, thumbnail: course.thumbnail ?? '',
    }).subscribe({
      next: (res: any) => {
        this.courses.update(list => list.map(c => c.id === course.id
          ? { ...c, status: 'PENDING_REVIEW' as CourseStatus } : c));
        this.toast.success('Cours soumis pour validation.');
      },
      error: () => this.toast.error('Impossible de soumettre ce cours.'),
    });
  }

  deleteCourse(id: string) {
    this.toast.confirm('Supprimer ce cours définitivement ?').then(ok => {
      if (!ok) return;
      this.api.delete(`/courses/${id}`).subscribe({
        next: () => {
          this.courses.update(list => list.filter(c => c.id !== id));
          this.toast.success('Cours supprimé avec succès.');
        },
        error: () => this.toast.error('Impossible de supprimer ce cours.'),
      });
    });
  }
}
