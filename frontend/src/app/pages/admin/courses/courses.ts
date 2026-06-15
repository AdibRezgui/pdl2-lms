import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, style, animate, transition } from '@angular/animations';
import { AuthService } from '../../../core/services/auth';
import { ApiService } from '../../../core/services/api';
import { ToastService } from '../../../core/services/toast';
import { Sidebar } from '../../../shared/sidebar/sidebar';

type CourseStatus = 'DRAFT' | 'APPROVED';

interface AdminCourse {
  id: string; title: string; category: string; level: string;
  status: CourseStatus; published: boolean;
  trainerName: string; thumbnail?: string;
  studentsCount: number; createdAt: string;
}

@Component({
  selector: 'app-admin-courses',
  standalone: true,
  imports: [CommonModule, Sidebar],
  animations: [
    trigger('fadeUp', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(16px)' }),
        animate('320ms cubic-bezier(0.23,1,0.32,1)', style({ opacity: 1, transform: 'translateY(0)' })),
      ]),
    ]),
  ],
  template: `
    <div class="shell">
      <app-sidebar [role]="auth.role() ?? ''" [userName]="auth.user()?.name ?? ''" />

      <main class="main-area">
        <header class="topbar">
          <div>
            <h1 class="topbar-title">Gestion des <span class="gt">cours</span></h1>
            <p class="topbar-sub">{{ courses().length }} cours au total</p>
          </div>
          <div class="filter-tabs">
            <button *ngFor="let f of filters" (click)="activeFilter.set(f.key)"
              class="filter-tab" [class.filter-active]="activeFilter() === f.key">
              {{ f.label }}
            </button>
          </div>
        </header>

        <div class="content">
          <div *ngIf="loading()" class="courses-grid">
            <div *ngFor="let _ of [1,2,3,4,5,6]" class="skeleton h-44 rounded-2xl"></div>
          </div>

          <div *ngIf="!loading() && filteredCourses().length === 0" class="empty-state">
            <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#c4bdd6" stroke-width="1.4">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
            </svg>
            <p class="font-bold font-display text-lg" style="color:#1a2d3a">Aucun cours</p>
          </div>

          <div *ngIf="!loading()" class="courses-grid">
            <div *ngFor="let c of filteredCourses()" @fadeUp class="course-card">
              <div class="course-thumb"
                [style.backgroundImage]="c.thumbnail ? 'url(' + (c.thumbnail.startsWith('http') ? c.thumbnail : '/api' + c.thumbnail) + ')' : 'none'"
                [style.backgroundSize]="'cover'" [style.backgroundPosition]="'center'">
                <svg *ngIf="!c.thumbnail" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.7)" stroke-width="1.6">
                  <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
                </svg>
                <span class="status-badge" [class.status-approved]="c.published" [class.status-draft]="!c.published">
                  {{ c.published ? 'Publié' : 'Brouillon' }}
                </span>
              </div>

              <div class="course-body">
                <p class="course-title">{{ c.title }}</p>
                <div class="trainer-row">
                  <div class="trainer-av">{{ c.trainerName?.charAt(0) ?? 'F' }}</div>
                  <span class="trainer-name">{{ c.trainerName }}</span>
                  <span *ngIf="c.category" class="cat-chip">{{ c.category }}</span>
                </div>
                <span class="students-count">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                  {{ c.studentsCount }} stagiaire(s)
                </span>
              </div>

              <div class="course-footer">
                <span class="text-xs" style="color:#c4bdd6">{{ c.createdAt | date:'dd/MM/yy' }}</span>
                <button *ngIf="c.published" (click)="unpublish(c)" class="btn-unpublish" [disabled]="processing()">
                  Dépublier
                </button>
                <button *ngIf="!c.published" (click)="publish(c)" class="btn-publish" [disabled]="processing()">
                  Publier
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  `,
  styles: [`
    .shell { display:flex;height:100vh;overflow:hidden;background:linear-gradient(160deg,#f5fdfe 0%,#edf9fb 60%,#daf2f6 100%); }
    .main-area { flex:1;overflow-y:auto;display:flex;flex-direction:column; }
    .topbar { display:flex;align-items:center;justify-content:space-between;padding:20px 28px;border-bottom:1px solid rgba(0,180,198,.12);background:rgba(255,253,251,.78);backdrop-filter:blur(20px);position:sticky;top:0;z-index:10;gap:16px;flex-wrap:wrap; }
    .topbar-title { font-family:'Fraunces',Georgia,serif;font-size:22px;font-weight:700;color:#1a2d3a;margin:0; }
    .topbar-sub { font-size:13px;color:#5a7a8a;margin:3px 0 0; }
    .gt { background:linear-gradient(135deg,#00B4C6,#00A8BC);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text; }
    .content { padding:24px 28px;flex:1; }
    .filter-tabs { display:flex;gap:6px; }
    .filter-tab { padding:8px 16px;border-radius:100px;border:1px solid rgba(0,180,198,.18);background:transparent;color:#5a7a8a;font-size:13px;font-weight:600;cursor:pointer;transition:all .2s;font-family:inherit; }
    .filter-tab:hover { border-color:rgba(0,180,198,.35);color:#007A8A;background:rgba(0,180,198,.06); }
    .filter-active { background:linear-gradient(135deg,rgba(0,180,198,.15),rgba(0,168,188,.09)) !important;border-color:rgba(0,180,198,.35) !important;color:#007A8A !important; }
    .courses-grid { display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:16px; }
    .course-card { background:rgba(255,255,255,.85);border:1px solid rgba(0,180,198,.13);border-radius:22px;overflow:hidden;display:flex;flex-direction:column;transition:box-shadow .22s,transform .22s;box-shadow:0 2px 12px rgba(0,180,198,.08); }
    .course-card:hover { box-shadow:0 8px 30px rgba(0,180,198,.18);transform:translateY(-2px); }
    .course-thumb { height:110px;background:linear-gradient(135deg,rgba(0,180,198,.8),rgba(0,168,188,.65));display:flex;align-items:center;justify-content:center;position:relative; }
    .status-badge { position:absolute;top:10px;left:10px;font-size:10px;font-weight:700;padding:3px 10px;border-radius:999px;border:1px solid transparent; }
    .status-approved { background:rgba(31,157,111,.12);color:#1f9d6f;border-color:rgba(31,157,111,.25); }
    .status-draft { background:rgba(148,141,163,.1);color:#5a7a8a;border-color:rgba(148,141,163,.2); }
    .course-body { padding:13px 15px 10px;flex:1;display:flex;flex-direction:column;gap:8px; }
    .course-title { font-size:13.5px;font-weight:700;color:#1a2d3a;font-family:'Fraunces',Georgia,serif;line-height:1.35;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical; }
    .trainer-row { display:flex;align-items:center;gap:7px; }
    .trainer-av { width:22px;height:22px;border-radius:7px;background:linear-gradient(135deg,#00B4C6,#00A8BC);display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:800;color:white;flex-shrink:0; }
    .trainer-name { font-size:11.5px;color:#5c5470;font-weight:600;flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap; }
    .cat-chip { font-size:10px;font-weight:700;padding:2px 8px;border-radius:999px;background:rgba(0,180,198,.1);color:#007A8A;border:1px solid rgba(0,180,198,.18);white-space:nowrap; }
    .students-count { display:flex;align-items:center;gap:5px;font-size:11.5px;color:#5a7a8a;font-weight:600; }
    .course-footer { display:flex;align-items:center;justify-content:space-between;padding:10px 15px 13px;border-top:1px solid rgba(0,180,198,.08); }
    .btn-publish { padding:6px 13px;border-radius:10px;background:linear-gradient(135deg,rgba(31,157,111,.15),rgba(31,157,111,.08));border:1px solid rgba(31,157,111,.28);color:#1f9d6f;font-size:11.5px;font-weight:700;cursor:pointer;transition:all .2s;font-family:inherit; }
    .btn-publish:hover:not(:disabled) { background:linear-gradient(135deg,rgba(31,157,111,.25),rgba(31,157,111,.15)); }
    .btn-publish:disabled { opacity:.5;cursor:not-allowed; }
    .btn-unpublish { padding:6px 13px;border-radius:10px;background:rgba(242,92,120,.07);border:1px solid rgba(242,92,120,.2);color:#f25c78;font-size:11.5px;font-weight:700;cursor:pointer;transition:all .2s;font-family:inherit; }
    .btn-unpublish:hover:not(:disabled) { background:rgba(242,92,120,.14); }
    .btn-unpublish:disabled { opacity:.5;cursor:not-allowed; }
    .empty-state { display:flex;flex-direction:column;align-items:center;gap:14px;padding:70px 20px;text-align:center; }
    .skeleton { background:linear-gradient(90deg,rgba(0,180,198,.08) 25%,rgba(0,180,198,.15) 50%,rgba(0,180,198,.08) 75%);background-size:200% 100%;animation:shimmer 1.5s infinite; }
    @keyframes shimmer { 0% { background-position:200% 0; } 100% { background-position:-200% 0; } }
  `],
})
export class AdminCourses implements OnInit {
  loading    = signal(true);
  processing = signal(false);
  courses    = signal<AdminCourse[]>([]);
  activeFilter = signal<string>('ALL');

  filters = [
    { key: 'ALL',      label: 'Tous' },
    { key: 'APPROVED', label: 'Publiés' },
    { key: 'DRAFT',    label: 'Brouillons' },
  ];

  filteredCourses() {
    const f = this.activeFilter();
    if (f === 'ALL') return this.courses();
    if (f === 'APPROVED') return this.courses().filter(c => c.published);
    return this.courses().filter(c => !c.published);
  }

  constructor(public auth: AuthService, private api: ApiService, private toast: ToastService) {}

  ngOnInit() {
    this.api.get<AdminCourse[]>('/admin/courses').subscribe({
      next: data => { this.courses.set(data ?? []); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  publish(course: AdminCourse) {
    this.processing.set(true);
    this.api.put<any>(`/admin/courses/${course.id}/approve`, {}).subscribe({
      next: () => {
        this.courses.update(list => list.map(c => c.id === course.id ? { ...c, status: 'APPROVED' as CourseStatus, published: true } : c));
        this.toast.success(`"${course.title}" publié.`);
        this.processing.set(false);
      },
      error: () => { this.toast.error('Erreur lors de la publication.'); this.processing.set(false); },
    });
  }

  unpublish(course: AdminCourse) {
    this.processing.set(true);
    this.api.put<any>(`/admin/courses/${course.id}/reject`, { reason: '' }).subscribe({
      next: () => {
        this.courses.update(list => list.map(c => c.id === course.id ? { ...c, status: 'DRAFT' as CourseStatus, published: false } : c));
        this.toast.success(`"${course.title}" dépublié.`);
        this.processing.set(false);
      },
      error: () => { this.toast.error('Erreur lors de la dépublication.'); this.processing.set(false); },
    });
  }
}
