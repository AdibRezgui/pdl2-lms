import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth';
import { ApiService } from '../../../core/services/api';
import { Sidebar } from '../../../shared/sidebar/sidebar';

interface Enrollment {
  id: string;
  completed: boolean;
  badgeEarned: boolean;
  completedAt?: string;
  course: { title: string; category: string; level: string; trainerName?: string; };
}

@Component({
  selector: 'app-student-certificates',
  standalone: true,
  imports: [CommonModule, RouterLink, Sidebar],
  template: `
    <div class="flex h-screen overflow-hidden" style="background:linear-gradient(160deg,#f5fdfe 0%,#edf9fb 60%,#daf2f6 100%)">
      <app-sidebar [role]="role" [userName]="userName"></app-sidebar>
      <main class="flex-1 overflow-y-auto">

        <div class="page-hero">
          <div>
            <h1 class="font-display text-2xl font-bold" style="color:#1a2d3a">Mes certificats</h1>
            <p class="text-sm mt-0.5" style="color:#5a7a8a">{{ certificates().length }} cours complété{{ certificates().length !== 1 ? 's' : '' }}</p>
          </div>
          <div class="stat-pill" *ngIf="certificates().length > 0">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#f5a524" stroke-width="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
            <span class="stat-num">{{ certificates().length }}</span>
            <span class="stat-lbl">badge{{ certificates().length !== 1 ? 's' : '' }} obtenu{{ certificates().length !== 1 ? 's' : '' }}</span>
          </div>
        </div>

        <div class="page-body">
          <div *ngIf="loading()" class="grid grid-cols-2 gap-5">
            <div *ngFor="let _ of [1,2,3,4]" class="skeleton h-48 rounded-2xl"></div>
          </div>

          <div *ngIf="!loading() && certificates().length > 0" class="grid grid-cols-2 gap-5">
            <div *ngFor="let e of certificates()" class="cert-card">
              <!-- Decorative background -->
              <div class="cert-bg-deco"></div>

              <!-- Top: badge + course info -->
              <div class="cert-top">
                <div class="cert-badge-icon">
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.8">
                    <circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/>
                  </svg>
                </div>
                <div class="flex-1 min-w-0">
                  <p class="cert-title">{{ e.course.title }}</p>
                  <p class="cert-meta">{{ e.course.category }} • {{ levelLabel(e.course.level) }}</p>
                  <p class="cert-meta" *ngIf="e.course.trainerName">Formateur : {{ e.course.trainerName }}</p>
                </div>
                <!-- Star badge -->
                <div class="badge-star">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="#f5a524" stroke="#f5a524" stroke-width="1">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                </div>
              </div>

              <!-- Completion date -->
              <div class="cert-date" *ngIf="e.completedAt">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                Complété le {{ e.completedAt | date:'d MMMM yyyy' : '' : 'fr-FR' }}
              </div>

              <!-- Download button -->
              <button class="cert-download" (click)="downloadCertificate(e)">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                Télécharger le certificat
              </button>
            </div>
          </div>

          <div *ngIf="!loading() && certificates().length === 0" class="empty-state">
            <div class="empty-icon">
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#c4bdd6" stroke-width="1.5">
                <circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/>
              </svg>
            </div>
            <p class="font-bold text-lg font-display" style="color:#1a2d3a">Aucun certificat pour le moment</p>
            <p class="text-sm mt-1" style="color:#5a7a8a">Terminez un cours et réclamez votre badge pour obtenir votre certificat</p>
            <a routerLink="/student/evaluations" class="btn-primary mt-5">Voir mes badges</a>
          </div>
        </div>
      </main>
    </div>
  `,
  styles: [`
    .page-hero { display:flex; align-items:center; justify-content:space-between; padding:28px 32px 20px; border-bottom:1px solid rgba(0,180,198,.1); gap:16px; flex-wrap:wrap; background:rgba(255,253,251,.7); }
    .page-body { padding:24px 32px; }
    .stat-pill { display:flex; align-items:center; gap:6px; padding:7px 14px; border-radius:999px; background:rgba(255,255,255,.8); border:1px solid rgba(245,165,36,.2); box-shadow:0 2px 8px rgba(245,165,36,.1); }
    .stat-num { font-size:15px; font-weight:800; color:#1a2d3a; font-family:'Fraunces',Georgia,serif; line-height:1; }
    .stat-lbl { font-size:11px; color:#5a7a8a; font-weight:500; }

    /* Certificate card */
    .cert-card { background:rgba(255,255,255,.9); border:1px solid rgba(245,165,36,.22); border-radius:24px; padding:22px; position:relative; overflow:hidden; display:flex; flex-direction:column; gap:14px; transition:box-shadow .22s, transform .22s; box-shadow:0 2px 14px rgba(245,165,36,.08); }
    .cert-card:hover { box-shadow:0 8px 32px rgba(245,165,36,.18); transform:translateY(-2px); }
    .cert-bg-deco { position:absolute; top:-40px; right:-40px; width:160px; height:160px; border-radius:50%; background:radial-gradient(circle,rgba(245,165,36,.12),transparent 70%); pointer-events:none; }
    .cert-top { display:flex; align-items:flex-start; gap:14px; }
    .cert-badge-icon { width:52px; height:52px; border-radius:18px; background:linear-gradient(135deg,#f5a524,#00A8BC); display:flex; align-items:center; justify-content:center; flex-shrink:0; box-shadow:0 8px 22px rgba(245,165,36,.35); }
    .cert-title { font-size:15px; font-weight:700; color:#1a2d3a; font-family:'Fraunces',Georgia,serif; line-height:1.35; }
    .cert-meta { font-size:11px; color:#5a7a8a; margin-top:2px; }
    .badge-star { width:32px; height:32px; border-radius:10px; background:rgba(245,165,36,.1); border:1px solid rgba(245,165,36,.25); display:flex; align-items:center; justify-content:center; flex-shrink:0; }
    .cert-date { display:inline-flex; align-items:center; gap:6px; font-size:12px; font-weight:600; color:#1f9d6f; padding:6px 12px; border-radius:10px; background:rgba(31,157,111,.07); border:1px solid rgba(31,157,111,.18); align-self:flex-start; }
    .cert-download { display:flex; align-items:center; justify-content:center; gap:8px; width:100%; padding:12px; border-radius:14px; background:rgba(245,165,36,.1); border:1px solid rgba(245,165,36,.25); color:#d97706; font-size:13px; font-weight:700; cursor:pointer; transition:all .22s; font-family:inherit; margin-top:auto; }
    .cert-download:hover { background:rgba(245,165,36,.2); transform:translateY(-1px); box-shadow:0 6px 18px rgba(245,165,36,.2); }

    .empty-state { display:flex; flex-direction:column; align-items:center; gap:6px; padding:80px 20px; text-align:center; }
    .empty-icon { width:72px; height:72px; border-radius:24px; background:rgba(0,180,198,.07); display:flex; align-items:center; justify-content:center; margin-bottom:10px; }
    .btn-primary { display:inline-flex; align-items:center; gap:6px; padding:11px 22px; border-radius:14px; background:linear-gradient(135deg,#00B4C6,#00A8BC); border:none; color:#fff; font-size:13px; font-weight:700; cursor:pointer; font-family:inherit; transition:all .22s; box-shadow:0 4px 14px rgba(0,180,198,.3); text-decoration:none; }
    .btn-primary:hover { transform:translateY(-1px); }
    .skeleton { background:linear-gradient(90deg,rgba(245,165,36,.07) 25%,rgba(245,165,36,.14) 50%,rgba(245,165,36,.07) 75%); background-size:200% 100%; animation:shimmer 1.5s infinite; }
    @keyframes shimmer { to { background-position:-200% 0; } }
  `],
})
export class StudentCertificates implements OnInit {
  private auth = inject(AuthService);
  private api  = inject(ApiService);

  loading      = signal(true);
  certificates = signal<Enrollment[]>([]);

  get role()     { return this.auth.user()?.role ?? 'STUDENT'; }
  get userName() { return this.auth.user()?.name ?? ''; }
  get studentName() { return this.auth.user()?.name ?? 'Étudiant'; }

  ngOnInit() {
    this.api.get<Enrollment[]>('/enrollments/me').subscribe({
      next: data => {
        this.certificates.set((data ?? []).filter(e => e.badgeEarned));
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  levelLabel(level: string): string {
    return ({ BEGINNER: 'Débutant', INTERMEDIATE: 'Intermédiaire', ADVANCED: 'Avancé' } as any)[level] ?? level;
  }

  downloadCertificate(e: Enrollment) {
    const win = window.open('', '_blank');
    if (!win) return;
    const date = e.completedAt
      ? new Date(e.completedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
      : new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
    win.document.write(this.buildCertificateHtml(e, date));
    win.document.close();
    setTimeout(() => win.print(), 600);
  }

  private buildCertificateHtml(e: Enrollment, date: string): string {
    const student = this.studentName;
    const course  = e.course.title;
    const cat     = e.course.category ?? '';
    const level   = this.levelLabel(e.course.level ?? '');
    const trainer = e.course.trainerName ?? 'EduAI';

    return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<title>Certificat — ${course}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,400;0,700;1,400&family=Inter:wght@400;600&display=swap');
  * { margin:0; padding:0; box-sizing:border-box; }
  html, body { width:297mm; height:210mm; }
  body { font-family:'Inter',sans-serif; background:#fff; display:flex; align-items:center; justify-content:center; }
  .cert { width:297mm; height:210mm; position:relative; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:20mm 24mm; overflow:hidden; }

  /* Decorative border */
  .border-outer { position:absolute; inset:8mm; border:2.5px solid rgba(245,165,36,.35); border-radius:10mm; pointer-events:none; }
  .border-inner  { position:absolute; inset:11mm; border:1px solid rgba(0,180,198,.22); border-radius:8mm; pointer-events:none; }

  /* Corner ornaments */
  .corner { position:absolute; width:14mm; height:14mm; }
  .tl { top:10mm; left:10mm; border-top:3px solid #f5a524; border-left:3px solid #f5a524; border-radius:3mm 0 0 0; }
  .tr { top:10mm; right:10mm; border-top:3px solid #f5a524; border-right:3px solid #f5a524; border-radius:0 3mm 0 0; }
  .bl { bottom:10mm; left:10mm; border-bottom:3px solid #f5a524; border-left:3px solid #f5a524; border-radius:0 0 0 3mm; }
  .br { bottom:10mm; right:10mm; border-bottom:3px solid #f5a524; border-right:3px solid #f5a524; border-radius:0 0 3mm 0; }

  /* BG gradient blobs */
  .blob1 { position:absolute; top:-20mm; right:-20mm; width:80mm; height:80mm; background:radial-gradient(circle,rgba(245,165,36,.12),transparent 70%); border-radius:50%; }
  .blob2 { position:absolute; bottom:-20mm; left:-20mm; width:80mm; height:80mm; background:radial-gradient(circle,rgba(0,180,198,.1),transparent 70%); border-radius:50%; }

  .logo { font-family:'Fraunces',Georgia,serif; font-size:13pt; font-weight:700; color:#00B4C6; letter-spacing:.08em; margin-bottom:6mm; }
  .divider { width:20mm; height:2px; background:linear-gradient(90deg,#f5a524,#00A8BC); border-radius:2px; margin:4mm 0; }
  .headline { font-family:'Fraunces',Georgia,serif; font-size:10pt; color:#5a7a8a; letter-spacing:.15em; text-transform:uppercase; }
  .student-name { font-family:'Fraunces',Georgia,serif; font-size:32pt; font-weight:700; color:#1a2d3a; margin:4mm 0 3mm; line-height:1.1; text-align:center; }
  .sub { font-size:10pt; color:#5a7a8a; margin-bottom:5mm; }
  .course-name { font-family:'Fraunces',Georgia,serif; font-size:18pt; font-weight:700; color:#007A8A; text-align:center; max-width:180mm; line-height:1.3; margin-bottom:3mm; }
  .course-meta { font-size:9pt; color:#5a7a8a; margin-bottom:7mm; }
  .score-badge { display:inline-flex; align-items:center; gap:2mm; background:rgba(245,165,36,.12); border:1px solid rgba(245,165,36,.3); border-radius:8mm; padding:2mm 5mm; font-size:10pt; font-weight:700; color:#d97706; margin-bottom:8mm; }
  .footer { display:flex; align-items:flex-end; justify-content:space-between; width:100%; margin-top:auto; padding-top:4mm; border-top:1px solid rgba(0,180,198,.15); }
  .sig-block { display:flex; flex-direction:column; align-items:center; gap:1mm; }
  .sig-line { width:35mm; height:1px; background:#1a2d3a; margin-bottom:1mm; }
  .sig-name { font-size:9pt; font-weight:700; color:#1a2d3a; }
  .sig-role { font-size:8pt; color:#5a7a8a; }
  .cert-date { font-size:9pt; color:#5a7a8a; text-align:right; }
  .cert-id { font-size:7pt; color:#c4bdd6; }
  @media print {
    html, body { width:297mm; height:210mm; }
    @page { size:A4 landscape; margin:0; }
  }
</style>
</head>
<body>
<div class="cert">
  <div class="blob1"></div><div class="blob2"></div>
  <div class="border-outer"></div><div class="border-inner"></div>
  <div class="corner tl"></div><div class="corner tr"></div>
  <div class="corner bl"></div><div class="corner br"></div>

  <div class="logo">EduAI Pro</div>
  <div class="headline">Certificat de complétion</div>
  <div class="divider"></div>
  <div class="sub">Ce certificat est décerné à</div>
  <div class="student-name">${this.escHtml(student)}</div>
  <div class="sub">pour avoir complété avec succès la formation</div>
  <div class="course-name">${this.escHtml(course)}</div>
  <div class="course-meta">${this.escHtml(cat)} &nbsp;•&nbsp; ${this.escHtml(level)}</div>
  <div class="score-badge">
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#d97706" stroke-width="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
    Badge obtenu — Score ≥ 70%
  </div>

  <div class="footer">
    <div class="sig-block">
      <div class="sig-line"></div>
      <div class="sig-name">${this.escHtml(trainer)}</div>
      <div class="sig-role">Formateur</div>
    </div>
    <div style="text-align:center">
      <div class="sig-line" style="margin:0 auto 1mm"></div>
      <div class="sig-name">EduAI Pro</div>
      <div class="sig-role">Plateforme de formation</div>
    </div>
    <div class="cert-date">
      <div style="font-weight:600;color:#1a2d3a">Délivré le ${this.escHtml(date)}</div>
      <div class="cert-id">ID: ${e.id.substring(0,8).toUpperCase()}</div>
    </div>
  </div>
</div>
</body>
</html>`;
  }

  private escHtml(s: string): string {
    return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }
}
