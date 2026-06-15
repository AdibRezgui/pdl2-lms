import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { trigger, style, animate, transition } from '@angular/animations';
import { AuthService } from '../../../core/services/auth';
import { ApiService } from '../../../core/services/api';
import { Sidebar } from '../../../shared/sidebar/sidebar';
import { GradientPillNav, PillNavItem } from '../../../shared/gradient-pill-nav/gradient-pill-nav';
import { AnimatedTextComponent } from '../../../shared/animated-text/animated-text';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, Sidebar, GradientPillNav, AnimatedTextComponent],
  animations: [
    trigger('fadeUp', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(18px)' }),
        animate('380ms cubic-bezier(0.23,1,0.32,1)', style({ opacity: 1, transform: 'translateY(0)' })),
      ]),
    ]),
  ],
  template: `
    <div class="shell">
      <app-sidebar [role]="auth.role() ?? ''" [userName]="auth.user()?.name ?? ''" />

      <main class="main-area">
        <header class="topbar reveal">
          <div>
            <app-animated-text
              prefix="Administration "
              name="Système"
              subtitle="Vue globale de la plateforme EduAI" />
          </div>
          <div class="flex items-center gap-2">
            <a routerLink="/admin/users" class="btn-secondary">Gérer les utilisateurs</a>
            <a routerLink="/admin/analytics" class="btn-primary">Analytics</a>
          </div>
        </header>

        <div class="content">
          <!-- Stats -->
          <div class="stats-row reveal stagger-1">
            <div *ngFor="let s of stats" class="stat-card lift-on-hover">
              <div class="stat-icon" [style.background]="s.bg" [style.boxShadow]="'0 6px 20px '+s.glow">
                <span [innerHTML]="s.svg"></span>
              </div>
              <div>
                <p class="stat-value">{{ s.value }}</p>
                <p class="stat-label">{{ s.label }}</p>
              </div>
            </div>
          </div>

          <div class="three-col">
            <!-- Recent users -->
            <section class="card p-5 reveal stagger-2" style="grid-column:span 2">
              <div class="flex items-center justify-between mb-5">
                <h2 class="section-title">Utilisateurs récents</h2>
                <a routerLink="/admin/users" class="text-xs font-semibold underline-draw" style="color:#00B4C6">Voir tout →</a>
              </div>
              <table class="data-table" *ngIf="!loading()">
                <thead>
                  <tr><th>Utilisateur</th><th>Rôle</th><th>Statut</th><th>Inscrit le</th></tr>
                </thead>
                <tbody>
                  <tr *ngFor="let u of recentUsers()">
                    <td>
                      <div class="flex items-center gap-2.5">
                        <div class="user-av" [style.background]="roleColor(u.role)">{{ u.name?.charAt(0) ?? 'U' }}</div>
                        <div>
                          <p class="text-sm font-semibold" style="color:#1a2d3a">{{ u.name }}</p>
                          <p class="text-xs" style="color:#5a7a8a">{{ u.email }}</p>
                        </div>
                      </div>
                    </td>
                    <td><span class="badge badge-primary text-xs">{{ roleLabel(u.role) }}</span></td>
                    <td>
                      <span class="badge" [class.badge-success]="u.active" [class.badge-error]="!u.active">
                        {{ u.active ? 'Actif' : 'Inactif' }}
                      </span>
                    </td>
                    <td class="text-xs" style="color:#5a7a8a">{{ u.createdAt | date:'dd/MM/yyyy' }}</td>
                  </tr>
                </tbody>
              </table>
              <div *ngIf="loading()" class="space-y-3">
                <div *ngFor="let _ of [1,2,3,4]" class="skeleton h-12 rounded-xl"></div>
              </div>
            </section>

            <!-- Platform health -->
            <section class="flex flex-col gap-4 reveal stagger-3">
              <div class="card p-5">
                <h2 class="section-title mb-4">Santé du système</h2>
                <div class="flex flex-col gap-3">
                  <div *ngFor="let h of health" class="health-row">
                    <div class="flex items-center gap-2.5">
                      <div class="h-dot" [style.background]="h.ok ? '#6ee7b7' : '#f25c78'" [style.boxShadow]="h.ok ? '0 0 6px rgba(110,231,183,.6)' : '0 0 6px rgba(242,92,120,.6)'"></div>
                      <span class="text-sm" style="color:#2c3d4e">{{ h.label }}</span>
                    </div>
                    <span class="text-xs font-bold" [style.color]="h.ok ? '#1f9d6f' : '#f25c78'">{{ h.status }}</span>
                  </div>
                </div>
              </div>

              <div class="card p-5">
                <h2 class="section-title mb-5">Actions rapides</h2>
                <app-gradient-pill-nav [items]="pillActions" [columns]="3" />
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  `,
  styles: [`
    .shell { display:flex;height:100vh;overflow:hidden;background:linear-gradient(160deg,#f5fdfe 0%,#edf9fb 60%,#daf2f6 100%); }
    .main-area { flex:1;overflow-y:auto;display:flex;flex-direction:column; }
    .topbar { display:flex;align-items:center;justify-content:space-between;padding:22px 30px;border-bottom:1px solid rgba(0,180,198,.12);background:rgba(255,253,251,.78);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);position:sticky;top:0;z-index:10; }
    .topbar-title { font-family:'Fraunces',Georgia,serif;font-size:22px;font-weight:700;color:#1a2d3a;margin:0;letter-spacing:-.01em; }
    .topbar-sub { font-size:13px;color:#5a7a8a;margin:3px 0 0; }
    .gt { background:linear-gradient(135deg,#00B4C6,#00A8BC);background-size:200% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;animation:shimmer-flow 5s linear infinite; }
    .content { padding:26px 30px;display:flex;flex-direction:column;gap:22px; }
    .stats-row { display:grid;grid-template-columns:repeat(4,1fr);gap:16px; }
    @media(max-width:1100px){.stats-row{grid-template-columns:repeat(2,1fr)}}
    .stat-card { display:flex;align-items:center;gap:14px;padding:18px;border-radius:22px;background:rgba(255,255,255,.6);border:1px solid rgba(0,180,198,.14);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);box-shadow:0 8px 28px rgba(0,180,198,.12);position:relative;cursor:default; }
    .stat-alert { border-color:rgba(245,165,36,.35) !important;background:rgba(255,250,240,.7) !important;cursor:pointer !important; }
    .stat-alert:hover { box-shadow:0 8px 28px rgba(245,165,36,.2) !important; }
    .alert-dot { position:absolute;top:12px;right:14px;width:9px;height:9px;border-radius:50%;background:#f5a524;box-shadow:0 0 0 3px rgba(245,165,36,.25);animation:pulse-dot 1.8s ease-in-out infinite; }
    @keyframes pulse-dot { 0%,100%{box-shadow:0 0 0 3px rgba(245,165,36,.25)} 50%{box-shadow:0 0 0 6px rgba(245,165,36,.12)} }
    .stat-icon { width:42px;height:42px;border-radius:14px;display:flex;align-items:center;justify-content:center;flex-shrink:0; }
    .stat-value { font-size:26px;font-weight:800;color:#1a2d3a;line-height:1;font-family:'Fraunces',Georgia,serif; }
    .stat-label { font-size:12px;color:#5a7a8a;margin-top:4px; }
    .section-title { font-family:'Fraunces',Georgia,serif;font-weight:700;color:#1a2d3a; }
    .three-col { display:grid;grid-template-columns:1fr 280px;gap:20px;align-items:start; }
    @media(max-width:1000px){.three-col{grid-template-columns:1fr}}
    .user-av { width:32px;height:32px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;color:white;flex-shrink:0; }
    .health-row { display:flex;align-items:center;justify-content:space-between;padding:10px 13px;border-radius:13px;background:rgba(0,180,198,.045);border:1px solid rgba(0,180,198,.1); }
    .h-dot { width:8px;height:8px;border-radius:50%; }
    .quick-link { display:flex;align-items:center;gap:10px;padding:11px 13px;border-radius:14px;background:rgba(0,180,198,.045);border:1px solid rgba(0,180,198,.1);text-decoration:none;color:#5a7a8a;font-size:13px;font-weight:500;transition:all .22s cubic-bezier(.16,1,.3,1); }
    .quick-link:hover { background:rgba(0,180,198,.1);border-color:rgba(0,180,198,.28);color:#007A8A;transform:translateX(3px); }
  `],
})
export class AdminDashboard implements OnInit {
  loading = signal(true);
  recentUsers = signal<any[]>([]);

  stats = [
    { label: 'Utilisateurs',      value: '—', bg: 'rgba(0,180,198,.16)', glow: 'rgba(0,180,198,.22)', svg: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0099AE" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>' },
    { label: 'Cours publiés',      value: '—', bg: 'rgba(110,231,183,.18)', glow: 'rgba(110,231,183,.24)', svg: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1f9d6f" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>' },
    { label: 'Inscriptions',       value: '—', bg: 'rgba(0,168,188,.14)', glow: 'rgba(0,168,188,.2)', svg: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00A8BC" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>' },
    { label: 'Total cours',        value: '—', bg: 'rgba(245,165,36,.14)',  glow: 'rgba(245,165,36,.2)',  svg: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f5a524" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>' },
  ];

  health = [
    { label: 'API Backend',     ok: true,  status: 'Opérationnel' },
    { label: 'Base de données', ok: true,  status: 'Connectée' },
    { label: 'Service IA',      ok: true,  status: 'En ligne' },
    { label: 'Stockage',        ok: true,  status: 'Disponible' },
  ];

  pillActions: PillNavItem[] = [
    {
      label: 'Utilisateurs', path: '/admin/users',
      gradientFrom: '#00B4C6', gradientTo: '#007A8A',
      svg: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
    },
    {
      label: 'Validation',   path: '/admin/courses',
      gradientFrom: '#f5a524', gradientTo: '#d97706',
      svg: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/><polyline points="9 11 12 14 16 9"/></svg>',
    },
    {
      label: 'Analytics',    path: '/admin/analytics',
      gradientFrom: '#6366f1', gradientTo: '#4f46e5',
      svg: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>',
    },
  ];

  roleLabel(r: string) { return { STUDENT: 'Stagiaire', TRAINER: 'Formateur', ADMIN: 'Admin' }[r] ?? r; }
  roleColor(r: string) { return { STUDENT: 'linear-gradient(135deg,#00B4C6,#0099AE)', TRAINER: 'linear-gradient(135deg,#00A8BC,#f25c78)', ADMIN: 'linear-gradient(135deg,#f5a524,#e2940f)' }[r] ?? 'rgba(0,180,198,.18)'; }

  constructor(public auth: AuthService, private api: ApiService, private http: HttpClient) {}

  ngOnInit() {
    this.http.get<any>('/api/actuator/health').subscribe({
      next: (res: any) => {
        const dbOk = res?.components?.db?.status === 'UP';
        const diskOk = res?.components?.diskSpace?.status === 'UP';
        this.health[0] = { ...this.health[0], ok: res?.status === 'UP', status: res?.status === 'UP' ? 'Opérationnel' : 'Indisponible' };
        this.health[1] = { ...this.health[1], ok: dbOk, status: dbOk ? 'Connectée' : 'Déconnectée' };
        this.health[3] = { ...this.health[3], ok: diskOk, status: diskOk ? 'Disponible' : 'Limité' };
      },
      error: () => {
        this.health[0] = { ...this.health[0], ok: false, status: 'Indisponible' };
        this.health[1] = { ...this.health[1], ok: false, status: 'Inconnue' };
        this.health[3] = { ...this.health[3], ok: false, status: 'Inconnue' };
      },
    });

    this.api.get<any>('/ai/recommend').subscribe({
      next: () => { this.health[2] = { ...this.health[2], ok: true, status: 'En ligne' }; },
      error: () => { this.health[2] = { ...this.health[2], ok: false, status: 'Indisponible' }; },
    });

    this.api.get<any>('/admin/stats').subscribe({
      next: (res: any) => {
        const d = res ?? {};
        this.stats[0].value = String(d.totalUsers ?? 0);
        this.stats[1].value = String(d.publishedCourses ?? 0);
        this.stats[2].value = String(d.totalEnrollments ?? 0);
        this.stats[3].value = String(d.totalCourses ?? 0);
      },
      error: () => {},
    });

    this.api.get<any>('/admin/users?size=8&sort=createdAt,desc').subscribe({
      next: (res: any) => { this.recentUsers.set(res?.content ?? res ?? []); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }
}
