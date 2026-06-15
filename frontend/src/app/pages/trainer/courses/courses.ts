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
    <div class="flex h-screen overflow-hidden" style="background:linear-gradient(160deg,#f5fdfe 0%,#edf9fb 60%,#daf2f6 100%)">
      <app-sidebar [role]="role" [userName]="userName"></app-sidebar>
      <main class="flex-1 overflow-y-auto p-7">

        <!-- Header -->
        <div class="mb-8 flex items-center justify-between reveal">
          <div>
            <h1 class="font-display text-2xl font-bold" style="color:#1a2d3a">Mes cours</h1>
            <p class="text-sm mt-0.5" style="color:#5a7a8a">{{ courses().length }} cours créés</p>
          </div>
          <a routerLink="/trainer/courses/new" class="btn-primary">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Nouveau cours
          </a>
        </div>

        <!-- Skeletons -->
        <div *ngIf="loading()" class="accordion-wrap">
          <div class="accordion-row">
            <div *ngFor="let _ of [1,2,3,4,5]" class="accord-panel accord-skeleton"></div>
          </div>
        </div>

        <!-- Accordion -->
        <div *ngIf="!loading() && courses().length > 0" class="accordion-wrap reveal stagger-1">
          <div class="accordion-row">
            <div *ngFor="let c of courses(); let i = index"
                 class="accord-panel"
                 [class.accord-active]="activeIndex() === i"
                 (mouseenter)="activeIndex.set(i)">

              <!-- BG -->
              <div class="accord-bg" [ngStyle]="panelStyle(c)"></div>
              <!-- Overlay -->
              <div class="accord-overlay"></div>

              <!-- Status indicator dot -->
              <div class="accord-indicator" [ngClass]="dotClass(c.status)"></div>

              <!-- Chips (visible when active) -->
              <div class="accord-chips">
                <span class="chip-cat">{{ c.category }}</span>
                <span *ngIf="c.level" class="chip-lvl">{{ levelLabel(c.level) }}</span>
              </div>

              <!-- Rotated label (visible when collapsed) -->
              <span class="accord-label">{{ c.title }}</span>

              <!-- Content panel (slides up when active) -->
              <div class="accord-content">
                <!-- Status pill -->
                <div class="ac-row-top">
                  <span class="sp" [ngClass]="statusClass(c.status)">
                    <span class="sp-dot" [ngClass]="dotClass(c.status)"></span>
                    {{ statusLabel(c.status) }}
                  </span>
                  <span class="ac-enrolls">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                    {{ c.studentsCount ?? 0 }} inscrit{{ (c.studentsCount ?? 0) !== 1 ? 's' : '' }}
                  </span>
                </div>

                <!-- Title -->
                <p class="ac-title">{{ c.title }}</p>

                <!-- Description -->
                <p class="ac-desc">{{ c.description }}</p>

                <!-- Rejection notice -->
                <div *ngIf="c.status === 'REJECTED' && c.rejectionReason" class="ac-rejection">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="flex-shrink:0"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  {{ c.rejectionReason }}
                </div>

                <!-- Actions -->
                <div class="ac-actions">
                  <button *ngIf="c.status === 'DRAFT' || c.status === 'REJECTED'"
                    (click)="$event.stopPropagation(); submitForReview(c)"
                    class="ac-btn-teal">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                    Soumettre
                  </button>
                  <a [routerLink]="'/trainer/courses/' + c.id + '/content'"
                     (click)="$event.stopPropagation()"
                     class="ac-btn">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
                    Contenu
                  </a>
                  <a [routerLink]="'/trainer/courses/' + c.id"
                     (click)="$event.stopPropagation()"
                     class="ac-btn-solid">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    Modifier
                  </a>
                  <button (click)="$event.stopPropagation(); deleteCourse(c.id)" class="ac-btn-del">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Empty state -->
        <div *ngIf="!loading() && courses().length === 0" class="card p-16 text-center bounce-in">
          <svg class="mx-auto mb-4" width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#c4bdd6" stroke-width="1.5"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
          <p class="font-bold text-lg mb-2 font-display" style="color:#1a2d3a">Aucun cours créé</p>
          <a routerLink="/trainer/courses/new" class="btn-primary inline-flex mt-4">Créer mon premier cours</a>
        </div>
      </main>
    </div>
  `,
  styles: [`
    /* ── Accordion wrap ── */
    .accordion-wrap { width:100%; overflow-x:auto; padding-bottom:12px; }
    .accordion-row { display:flex; flex-direction:row; gap:10px; min-width:max-content; align-items:stretch; }

    /* ── Panel ── */
    .accord-panel {
      position:relative; width:72px; height:460px; border-radius:24px;
      overflow:hidden; cursor:pointer; flex-shrink:0;
      transition:width 700ms cubic-bezier(0.16,1,0.3,1),
                 box-shadow 400ms ease;
      box-shadow:0 4px 18px rgba(0,0,0,.18);
    }
    .accord-panel:hover { box-shadow:0 8px 36px rgba(0,0,0,.28); }
    .accord-active { width:380px; }

    /* Skeleton */
    .accord-skeleton { background:linear-gradient(90deg,rgba(0,180,198,.08) 0%,rgba(0,180,198,.16) 50%,rgba(0,180,198,.08) 100%); background-size:200% 100%; animation:shimmer 1.4s infinite; }
    @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

    /* ── BG layer ── */
    .accord-bg {
      position:absolute; inset:0;
      background-size:cover; background-position:center;
      transition:transform 700ms cubic-bezier(0.16,1,0.3,1);
    }
    .accord-active .accord-bg { transform:scale(1.06); }

    /* ── Dark overlay ── */
    .accord-overlay {
      position:absolute; inset:0;
      background:linear-gradient(to top,
        rgba(0,0,0,.92) 0%,
        rgba(0,0,0,.55) 38%,
        rgba(0,0,0,.18) 68%,
        transparent 100%);
    }

    /* ── Status indicator dot ── */
    .accord-indicator {
      position:absolute; top:16px; left:50%; transform:translateX(-50%);
      z-index:3; width:9px; height:9px; border-radius:50%;
      border:2px solid rgba(255,255,255,.35);
      transition:opacity 350ms;
    }
    .accord-active .accord-indicator { opacity:0; }

    /* ── Chips (category + level) ── */
    .accord-chips {
      position:absolute; top:14px; left:14px; right:14px;
      z-index:3; display:flex; gap:5px; flex-wrap:wrap;
      opacity:0; transition:opacity 300ms 200ms; pointer-events:none;
    }
    .accord-active .accord-chips { opacity:1; }
    .chip-cat, .chip-lvl {
      font-size:10px; font-weight:700; letter-spacing:.04em;
      padding:3px 9px; border-radius:999px;
      border:1px solid rgba(255,255,255,.3);
      backdrop-filter:blur(8px);
      color:#fff; white-space:nowrap;
    }
    .chip-cat { background:rgba(0,180,198,.45); }
    .chip-lvl { background:rgba(255,255,255,.18); }

    /* ── Rotated label (collapsed) ── */
    .accord-label {
      position:absolute; left:50%; bottom:96px; z-index:3;
      transform:translateX(-50%) rotate(90deg);
      color:#fff; font-size:12px; font-weight:700;
      white-space:nowrap; font-family:'Fraunces',Georgia,serif;
      text-shadow:0 1px 8px rgba(0,0,0,.7);
      transition:opacity 280ms;
      pointer-events:none;
    }
    .accord-active .accord-label { opacity:0; }

    /* ── Content (slides up on expand) ── */
    .accord-content {
      position:absolute; bottom:0; left:0; right:0;
      padding:16px 18px 20px; z-index:4;
      display:flex; flex-direction:column; gap:8px;
      opacity:0; transform:translateY(18px);
      transition:opacity 360ms 160ms, transform 360ms 160ms;
      pointer-events:none;
    }
    .accord-active .accord-content { opacity:1; transform:none; pointer-events:all; }

    /* Top row: status + enrollments */
    .ac-row-top { display:flex; align-items:center; justify-content:space-between; gap:8px; }
    .ac-enrolls { display:flex; align-items:center; gap:5px; font-size:11px; color:rgba(255,255,255,.7); font-weight:500; }

    /* Status pill */
    .sp { display:inline-flex; align-items:center; gap:5px; padding:4px 10px; border-radius:999px; font-size:10px; font-weight:700; border:1px solid transparent; }
    .sp-published { background:rgba(52,211,153,.18); color:#6ee7b7; border-color:rgba(52,211,153,.3); }
    .sp-draft     { background:rgba(255,255,255,.12); color:rgba(255,255,255,.75); border-color:rgba(255,255,255,.2); }
    .sp-pending   { background:rgba(251,191,36,.18); color:#fde68a; border-color:rgba(251,191,36,.3); }
    .sp-rejected  { background:rgba(248,113,113,.18); color:#fca5a5; border-color:rgba(248,113,113,.3); }
    .sp-dot { width:5px; height:5px; border-radius:50%; flex-shrink:0; }

    /* Status dots */
    .dot-pub     { background:#34d399; }
    .dot-draft   { background:rgba(255,255,255,.55); }
    .dot-pending { background:#fbbf24; animation:pulse-dot 1.8s ease-in-out infinite; }
    .dot-rej     { background:#f87171; }
    @keyframes pulse-dot {
      0%,100%{box-shadow:0 0 0 2px rgba(251,191,36,.25)}
      50%{box-shadow:0 0 0 4px rgba(251,191,36,.1)}
    }

    /* Title & desc */
    .ac-title { font-size:15px; font-weight:800; color:#fff; line-height:1.3; font-family:'Fraunces',Georgia,serif; margin:0; }
    .ac-desc  { font-size:12px; color:rgba(255,255,255,.72); line-height:1.5; overflow:hidden; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; margin:0; }

    /* Rejection notice */
    .ac-rejection { display:flex; align-items:flex-start; gap:5px; font-size:11px; color:#fca5a5; background:rgba(248,113,113,.12); border-left:3px solid rgba(248,113,113,.4); padding:6px 10px; border-radius:0 6px 6px 0; line-height:1.4; }

    /* Action buttons */
    .ac-actions { display:flex; align-items:center; gap:6px; flex-wrap:wrap; margin-top:2px; }
    .ac-btn-teal {
      display:inline-flex; align-items:center; gap:5px;
      padding:7px 13px; border-radius:12px;
      background:linear-gradient(135deg,#00B4C6,#007A8A);
      border:none; color:#fff; font-size:12px; font-weight:700;
      cursor:pointer; font-family:inherit;
      box-shadow:0 3px 10px rgba(0,180,198,.35);
      transition:all .22s; white-space:nowrap;
    }
    .ac-btn-teal:hover { box-shadow:0 5px 18px rgba(0,180,198,.5); transform:translateY(-1px); }
    .ac-btn {
      display:inline-flex; align-items:center; gap:5px;
      padding:7px 13px; border-radius:12px;
      background:rgba(255,255,255,.14); border:1px solid rgba(255,255,255,.28);
      color:#fff; font-size:12px; font-weight:600;
      text-decoration:none; font-family:inherit;
      transition:all .2s; white-space:nowrap; cursor:pointer;
      backdrop-filter:blur(6px);
    }
    .ac-btn:hover { background:rgba(255,255,255,.24); border-color:rgba(255,255,255,.45); }
    .ac-btn-solid {
      display:inline-flex; align-items:center; gap:5px;
      padding:7px 14px; border-radius:12px;
      background:rgba(255,255,255,.92); border:none;
      color:#007A8A; font-size:12px; font-weight:700;
      text-decoration:none; font-family:inherit;
      transition:all .22s; white-space:nowrap; cursor:pointer;
      box-shadow:0 2px 8px rgba(0,0,0,.18);
    }
    .ac-btn-solid:hover { background:#fff; box-shadow:0 4px 16px rgba(0,0,0,.24); transform:translateY(-1px); }
    .ac-btn-del {
      width:34px; height:34px; border-radius:11px;
      background:rgba(248,113,113,.15); border:1px solid rgba(248,113,113,.3);
      color:#fca5a5; cursor:pointer;
      display:flex; align-items:center; justify-content:center;
      transition:all .2s; flex-shrink:0;
    }
    .ac-btn-del:hover { background:rgba(248,113,113,.28); border-color:rgba(248,113,113,.5); transform:scale(1.07); }
  `],
})
export class TrainerCourses implements OnInit {
  loading = signal(true);
  courses = signal<Course[]>([]);
  activeIndex = signal(0);

  private readonly GRADS = [
    'linear-gradient(135deg,#00B4C6 0%,#00787f 100%)',
    'linear-gradient(135deg,#667eea 0%,#764ba2 100%)',
    'linear-gradient(135deg,#f093fb 0%,#f5576c 100%)',
    'linear-gradient(135deg,#4facfe 0%,#00b4d8 100%)',
    'linear-gradient(135deg,#43e97b 0%,#38f9d7 100%)',
    'linear-gradient(135deg,#fa709a 0%,#fee140 100%)',
    'linear-gradient(135deg,#a18cd1 0%,#fbc2eb 100%)',
  ];

  get role() { return this.auth.user()?.role ?? 'TRAINER'; }
  get userName() { return this.auth.user()?.name ?? ''; }

  constructor(private auth: AuthService, private api: ApiService, private toast: ToastService) {}

  ngOnInit() {
    this.api.get<Course[]>('/courses/my').subscribe({
      next: data => { this.courses.set(data ?? []); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  panelStyle(c: Course): Record<string, string> {
    if (c.thumbnail) {
      const url = c.thumbnail.startsWith('http') ? c.thumbnail : '/api' + c.thumbnail;
      return { 'background-image': `url('${url}')`, 'background-size': 'cover', 'background-position': 'center' };
    }
    const idx = (c.title?.charCodeAt(0) ?? 0) % this.GRADS.length;
    return { 'background': this.GRADS[idx] };
  }

  levelLabel(level: string) {
    return ({ BEGINNER: 'Débutant', INTERMEDIATE: 'Intermédiaire', ADVANCED: 'Avancé' } as any)[level] ?? level;
  }

  statusLabel(s: CourseStatus) {
    return ({ DRAFT: 'Brouillon', PENDING_REVIEW: 'En attente', APPROVED: 'Publié', REJECTED: 'Rejeté' } as any)[s] ?? s;
  }

  statusClass(s: CourseStatus) {
    return ({ DRAFT: 'sp-draft', PENDING_REVIEW: 'sp-pending', APPROVED: 'sp-published', REJECTED: 'sp-rejected' } as any)[s] ?? 'sp-draft';
  }

  dotClass(s: CourseStatus) {
    return ({ DRAFT: 'dot-draft', PENDING_REVIEW: 'dot-pending', APPROVED: 'dot-pub', REJECTED: 'dot-rej' } as any)[s] ?? 'dot-draft';
  }

  submitForReview(course: Course) {
    this.api.put<any>(`/courses/${course.id}`, {
      title: course.title, description: course.description, category: course.category,
      level: course.level, price: course.price ?? 0, tags: [],
      published: true, thumbnail: course.thumbnail ?? '',
    }).subscribe({
      next: () => {
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
          this.courses.update(list => {
            const next = list.filter(c => c.id !== id);
            if (this.activeIndex() >= next.length) this.activeIndex.set(Math.max(0, next.length - 1));
            return next;
          });
          this.toast.success('Cours supprimé avec succès.');
        },
        error: () => this.toast.error('Impossible de supprimer ce cours.'),
      });
    });
  }
}
