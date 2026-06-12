import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { trigger, style, animate, transition } from '@angular/animations';
import { AuthService } from '../../../core/services/auth';
import { ApiService } from '../../../core/services/api';
import { ToastService } from '../../../core/services/toast';
import { Sidebar } from '../../../shared/sidebar/sidebar';

type CourseStatus = 'DRAFT' | 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED';

interface AdminCourse {
  id: string; title: string; description: string; category: string; level: string;
  status: CourseStatus; rejectionReason?: string; published: boolean;
  trainerName: string; trainerAvatar?: string; thumbnail?: string;
  studentsCount: number; createdAt: string;
}

@Component({
  selector: 'app-admin-courses',
  standalone: true,
  imports: [CommonModule, FormsModule, Sidebar],
  animations: [
    trigger('fadeUp', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(16px)' }),
        animate('320ms cubic-bezier(0.23,1,0.32,1)', style({ opacity: 1, transform: 'translateY(0)' })),
      ]),
    ]),
    trigger('modalIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.94)' }),
        animate('260ms cubic-bezier(0.23,1,0.32,1)', style({ opacity: 1, transform: 'scale(1)' })),
      ]),
      transition(':leave', [
        animate('160ms ease-in', style({ opacity: 0, transform: 'scale(0.96)' })),
      ]),
    ]),
  ],
  template: `
    <div class="shell">
      <app-sidebar [role]="auth.role() ?? ''" [userName]="auth.user()?.name ?? ''" />

      <main class="main-area">
        <header class="topbar">
          <div>
            <h1 class="topbar-title">Validation des <span class="gt">cours</span></h1>
            <p class="topbar-sub">{{ pendingCount() }} en attente de validation</p>
          </div>
          <!-- Filter tabs -->
          <div class="filter-tabs">
            <button *ngFor="let f of filters" (click)="activeFilter.set(f.key)"
              class="filter-tab" [class.filter-active]="activeFilter() === f.key">
              {{ f.label }}
              <span *ngIf="f.key === 'PENDING_REVIEW' && pendingCount() > 0" class="pending-badge">{{ pendingCount() }}</span>
            </button>
          </div>
        </header>

        <div class="content">
          <!-- Loading -->
          <div *ngIf="loading()" class="grid grid-4 gap-4">
            <div *ngFor="let _ of [1,2,3,4,5,6,7,8]" class="skeleton h-44 rounded-2xl"></div>
          </div>

          <!-- Empty -->
          <div *ngIf="!loading() && filteredCourses().length === 0" class="empty-state">
            <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#c4bdd6" stroke-width="1.4">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
            </svg>
            <p class="font-bold font-display text-lg" style="color:#221f2c">Aucun cours dans cette catégorie</p>
          </div>

          <!-- Courses grid -->
          <div *ngIf="!loading()" class="courses-grid">
            <div *ngFor="let c of filteredCourses()" @fadeUp class="course-card">
              <!-- Thumb -->
              <div class="course-thumb"
                [style.backgroundImage]="c.thumbnail ? 'url(' + (c.thumbnail.startsWith('http') ? c.thumbnail : '/api' + c.thumbnail) + ')' : 'none'"
                [style.backgroundSize]="'cover'" [style.backgroundPosition]="'center'">
                <svg *ngIf="!c.thumbnail" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.7)" stroke-width="1.6">
                  <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
                </svg>
                <span class="status-badge" [ngClass]="statusClass(c.status)">{{ statusLabel(c.status) }}</span>
              </div>

              <!-- Body -->
              <div class="course-body">
                <p class="course-title">{{ c.title }}</p>
                <div class="trainer-row">
                  <div class="trainer-av">{{ c.trainerName?.charAt(0) ?? 'F' }}</div>
                  <span class="trainer-name">{{ c.trainerName }}</span>
                  <span class="cat-chip">{{ c.category }}</span>
                </div>
                <p *ngIf="c.status === 'REJECTED' && c.rejectionReason" class="rejection-reason">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="flex-shrink:0"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  {{ c.rejectionReason }}
                </p>
              </div>

              <!-- Footer actions -->
              <div class="course-footer">
                <span class="text-xs" style="color:#c4bdd6">{{ c.createdAt | date:'dd/MM/yy' }}</span>
                <div class="actions" *ngIf="c.status === 'PENDING_REVIEW'">
                  <button (click)="approve(c)" class="btn-approve" [disabled]="processing()">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                    Approuver
                  </button>
                  <button (click)="openReject(c)" class="btn-reject" [disabled]="processing()">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    Rejeter
                  </button>
                </div>
                <div class="actions" *ngIf="c.status !== 'PENDING_REVIEW'">
                  <button *ngIf="c.status === 'APPROVED'" (click)="rejectPublished(c)" class="btn-reject-sm">Dépublier</button>
                  <button *ngIf="c.status === 'REJECTED' || c.status === 'DRAFT'" (click)="approve(c)" class="btn-approve-sm">Approuver</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>

    <!-- Reject modal -->
    <div *ngIf="rejectTarget()" class="modal-backdrop" (click)="closeReject()">
      <div @modalIn class="modal" (click)="$event.stopPropagation()">
        <h3 class="modal-title">Motif de rejet</h3>
        <p class="modal-sub">Le formateur recevra ce message et pourra corriger son cours.</p>
        <textarea [(ngModel)]="rejectReason" class="reject-textarea" rows="4"
          placeholder="Ex : Le contenu ne respecte pas les standards pédagogiques…"></textarea>
        <div class="modal-actions">
          <button (click)="closeReject()" class="btn-cancel">Annuler</button>
          <button (click)="confirmReject()" class="btn-confirm-reject" [disabled]="!rejectReason.trim() || processing()">
            Confirmer le rejet
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .shell { display:flex;height:100vh;overflow:hidden;background:linear-gradient(160deg,#fffdfb 0%,#fdf2f8 60%,#f6f0ff 100%); }
    .main-area { flex:1;overflow-y:auto;display:flex;flex-direction:column; }
    .topbar { display:flex;align-items:center;justify-content:space-between;padding:20px 28px;border-bottom:1px solid rgba(167,139,250,.12);background:rgba(255,253,251,.78);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);position:sticky;top:0;z-index:10;gap:16px;flex-wrap:wrap; }
    .topbar-title { font-family:'Fraunces',Georgia,serif;font-size:22px;font-weight:700;color:#221f2c;margin:0;letter-spacing:-.01em; }
    .topbar-sub { font-size:13px;color:#948da3;margin:3px 0 0; }
    .gt { background:linear-gradient(135deg,#a78bfa,#fb7299);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text; }
    .content { padding:24px 28px;flex:1; }

    /* Filter tabs */
    .filter-tabs { display:flex;gap:6px; }
    .filter-tab { padding:8px 16px;border-radius:100px;border:1px solid rgba(167,139,250,.18);background:transparent;color:#948da3;font-size:13px;font-weight:600;cursor:pointer;transition:all .2s;font-family:inherit;display:flex;align-items:center;gap:7px; }
    .filter-tab:hover { border-color:rgba(167,139,250,.35);color:#7c5ce0;background:rgba(167,139,250,.06); }
    .filter-active { background:linear-gradient(135deg,rgba(167,139,250,.15),rgba(251,114,153,.09)) !important;border-color:rgba(167,139,250,.35) !important;color:#7c3aed !important; }
    .pending-badge { background:linear-gradient(135deg,#fb7299,#f25c78);color:white;font-size:10px;font-weight:800;padding:2px 7px;border-radius:999px;min-width:18px;text-align:center; }

    /* Grid */
    .courses-grid { display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:16px; }

    /* Card */
    .course-card { background:rgba(255,255,255,.85);border:1px solid rgba(167,139,250,.13);border-radius:22px;overflow:hidden;display:flex;flex-direction:column;transition:box-shadow .22s,transform .22s;box-shadow:0 2px 12px rgba(167,139,250,.08); }
    .course-card:hover { box-shadow:0 8px 30px rgba(167,139,250,.18);transform:translateY(-2px); }

    .course-thumb { height:110px;background:linear-gradient(135deg,rgba(167,139,250,.8),rgba(251,114,153,.65));display:flex;align-items:center;justify-content:center;position:relative; }
    .status-badge { position:absolute;top:10px;left:10px;font-size:10px;font-weight:700;padding:3px 10px;border-radius:999px;border:1px solid transparent; }
    .status-pending { background:rgba(245,165,36,.15);color:#d97706;border-color:rgba(245,165,36,.3); }
    .status-approved { background:rgba(31,157,111,.12);color:#1f9d6f;border-color:rgba(31,157,111,.25); }
    .status-rejected { background:rgba(242,92,120,.1);color:#f25c78;border-color:rgba(242,92,120,.25); }
    .status-draft { background:rgba(148,141,163,.1);color:#948da3;border-color:rgba(148,141,163,.2); }

    .course-body { padding:13px 15px 10px;flex:1;display:flex;flex-direction:column;gap:8px; }
    .course-title { font-size:13.5px;font-weight:700;color:#221f2c;font-family:'Fraunces',Georgia,serif;line-height:1.35;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical; }
    .trainer-row { display:flex;align-items:center;gap:7px; }
    .trainer-av { width:22px;height:22px;border-radius:7px;background:linear-gradient(135deg,#a78bfa,#fb7299);display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:800;color:white;flex-shrink:0; }
    .trainer-name { font-size:11.5px;color:#5c5470;font-weight:600;flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap; }
    .cat-chip { font-size:10px;font-weight:700;padding:2px 8px;border-radius:999px;background:rgba(167,139,250,.1);color:#7c5ce0;border:1px solid rgba(167,139,250,.18);white-space:nowrap; }

    .rejection-reason { display:flex;align-items:flex-start;gap:6px;font-size:11.5px;color:#f25c78;background:rgba(242,92,120,.06);border:1px solid rgba(242,92,120,.18);border-radius:10px;padding:8px 10px;line-height:1.45;margin-top:2px; }

    .course-footer { display:flex;align-items:center;justify-content:space-between;padding:10px 15px 13px;border-top:1px solid rgba(167,139,250,.08);gap:8px; }
    .actions { display:flex;gap:6px; }

    .btn-approve { display:flex;align-items:center;gap:5px;padding:7px 13px;border-radius:11px;background:linear-gradient(135deg,#6ee7b7,#1f9d6f);border:none;color:white;font-size:11.5px;font-weight:700;cursor:pointer;transition:all .2s;font-family:inherit;box-shadow:0 4px 12px rgba(31,157,111,.28); }
    .btn-approve:hover:not(:disabled) { box-shadow:0 6px 18px rgba(31,157,111,.4);transform:translateY(-1px); }
    .btn-approve:disabled { opacity:.5;cursor:not-allowed; }
    .btn-reject { display:flex;align-items:center;gap:5px;padding:7px 13px;border-radius:11px;background:rgba(242,92,120,.08);border:1px solid rgba(242,92,120,.22);color:#f25c78;font-size:11.5px;font-weight:700;cursor:pointer;transition:all .2s;font-family:inherit; }
    .btn-reject:hover:not(:disabled) { background:rgba(242,92,120,.15);border-color:rgba(242,92,120,.4);transform:translateY(-1px); }
    .btn-reject:disabled { opacity:.5;cursor:not-allowed; }
    .btn-approve-sm { padding:5px 11px;border-radius:9px;background:rgba(31,157,111,.1);border:1px solid rgba(31,157,111,.22);color:#1f9d6f;font-size:11px;font-weight:700;cursor:pointer;transition:all .2s;font-family:inherit; }
    .btn-approve-sm:hover { background:rgba(31,157,111,.18); }
    .btn-reject-sm { padding:5px 11px;border-radius:9px;background:rgba(242,92,120,.08);border:1px solid rgba(242,92,120,.2);color:#f25c78;font-size:11px;font-weight:700;cursor:pointer;transition:all .2s;font-family:inherit; }
    .btn-reject-sm:hover { background:rgba(242,92,120,.15); }

    /* Empty state */
    .empty-state { display:flex;flex-direction:column;align-items:center;gap:14px;padding:70px 20px;text-align:center; }

    /* Modal */
    .modal-backdrop { position:fixed;inset:0;background:rgba(34,31,44,.45);backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;z-index:1000;padding:20px; }
    .modal { background:white;border-radius:24px;padding:28px;width:100%;max-width:440px;box-shadow:0 24px 60px rgba(167,139,250,.28);border:1px solid rgba(167,139,250,.16); }
    .modal-title { font-family:'Fraunces',Georgia,serif;font-size:18px;font-weight:700;color:#221f2c;margin:0 0 6px; }
    .modal-sub { font-size:13px;color:#948da3;margin:0 0 18px;line-height:1.5; }
    .reject-textarea { width:100%;padding:12px 15px;border-radius:14px;border:1px solid rgba(167,139,250,.22);background:#f8f1fc;color:#221f2c;font-size:13.5px;font-family:inherit;outline:none;resize:vertical;transition:all .2s;box-sizing:border-box; }
    .reject-textarea:focus { border-color:#a78bfa;background:white;box-shadow:0 0 0 4px rgba(167,139,250,.14); }
    .reject-textarea::placeholder { color:#c4bdd6; }
    .modal-actions { display:flex;gap:10px;margin-top:18px; }
    .btn-cancel { flex:1;padding:11px;border-radius:13px;border:1px solid rgba(167,139,250,.22);background:transparent;color:#948da3;font-size:13.5px;font-weight:600;cursor:pointer;font-family:inherit;transition:all .2s; }
    .btn-cancel:hover { background:rgba(167,139,250,.06);color:#7c5ce0; }
    .btn-confirm-reject { flex:2;padding:11px;border-radius:13px;background:linear-gradient(135deg,#fb7299,#f25c78);border:none;color:white;font-size:13.5px;font-weight:700;cursor:pointer;font-family:inherit;transition:all .2s;box-shadow:0 6px 18px rgba(242,92,120,.3); }
    .btn-confirm-reject:hover:not(:disabled) { box-shadow:0 8px 24px rgba(242,92,120,.45);transform:translateY(-1px); }
    .btn-confirm-reject:disabled { opacity:.5;cursor:not-allowed; }
  `],
})
export class AdminCourses implements OnInit {
  loading   = signal(true);
  processing = signal(false);
  courses   = signal<AdminCourse[]>([]);
  activeFilter = signal<string>('PENDING_REVIEW');
  rejectTarget = signal<AdminCourse | null>(null);
  rejectReason = '';

  filters = [
    { key: 'PENDING_REVIEW', label: 'En attente' },
    { key: 'APPROVED',       label: 'Approuvés' },
    { key: 'REJECTED',       label: 'Rejetés' },
    { key: 'DRAFT',          label: 'Brouillons' },
    { key: 'ALL',            label: 'Tous' },
  ];

  filteredCourses() {
    const f = this.activeFilter();
    return f === 'ALL' ? this.courses() : this.courses().filter(c => c.status === f);
  }

  pendingCount() {
    return this.courses().filter(c => c.status === 'PENDING_REVIEW').length;
  }

  statusLabel(s: CourseStatus) {
    return ({ DRAFT: 'Brouillon', PENDING_REVIEW: 'En attente', APPROVED: 'Approuvé', REJECTED: 'Rejeté' } as any)[s] ?? s;
  }

  statusClass(s: CourseStatus) {
    return ({ DRAFT: 'status-draft', PENDING_REVIEW: 'status-pending', APPROVED: 'status-approved', REJECTED: 'status-rejected' } as any)[s] ?? '';
  }

  constructor(public auth: AuthService, private api: ApiService, private toast: ToastService) {}

  ngOnInit() {
    this.loadCourses();
  }

  loadCourses() {
    this.loading.set(true);
    this.api.get<AdminCourse[]>('/admin/courses').subscribe({
      next: data => { this.courses.set(data ?? []); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  approve(course: AdminCourse) {
    this.processing.set(true);
    this.api.put<any>(`/admin/courses/${course.id}/approve`, {}).subscribe({
      next: (res: any) => {
        this.processing.set(false);
        this.courses.update(list => list.map(c => c.id === course.id ? { ...c, status: 'APPROVED', published: true, rejectionReason: undefined } : c));
        this.toast.success(`"${course.title}" approuvé et publié.`);
      },
      error: () => { this.processing.set(false); this.toast.error('Erreur lors de l\'approbation.'); },
    });
  }

  openReject(course: AdminCourse) {
    this.rejectReason = '';
    this.rejectTarget.set(course);
  }

  closeReject() {
    this.rejectTarget.set(null);
  }

  confirmReject() {
    const course = this.rejectTarget();
    if (!course || !this.rejectReason.trim()) return;
    this.processing.set(true);
    this.api.put<any>(`/admin/courses/${course.id}/reject`, { reason: this.rejectReason }).subscribe({
      next: () => {
        this.processing.set(false);
        this.courses.update(list => list.map(c => c.id === course.id
          ? { ...c, status: 'REJECTED', published: false, rejectionReason: this.rejectReason } : c));
        this.toast.success(`"${course.title}" rejeté.`);
        this.closeReject();
      },
      error: () => { this.processing.set(false); this.toast.error('Erreur lors du rejet.'); },
    });
  }

  rejectPublished(course: AdminCourse) {
    this.openReject(course);
  }
}
