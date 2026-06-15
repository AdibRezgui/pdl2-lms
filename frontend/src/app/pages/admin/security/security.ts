import { Component, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { trigger, style, animate, transition } from '@angular/animations';
import { AuthService } from '../../../core/services/auth';
import { ApiService } from '../../../core/services/api';
import { Sidebar } from '../../../shared/sidebar/sidebar';

// ── Types ─────────────────────────────────────────────────────────────────────

type EventType = 'BRUTE_FORCE' | 'SQL_INJECTION' | 'XSS' | 'PATH_TRAVERSAL' | 'UNAUTHORIZED_ACCESS' | 'INVALID_TOKEN';
type Severity  = 'HIGH' | 'MEDIUM' | 'LOW';

interface SecurityEvent {
  id: string;
  type: EventType;
  severity: Severity;
  sourceIp: string;
  requestPath: string;
  httpMethod: string;
  payload: string;
  userAgent: string;
  createdAt: string;
}

interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

interface StatsMap { [key: string]: number }

// ── Component ─────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-admin-security',
  standalone: true,
  imports: [CommonModule, FormsModule, Sidebar],
  animations: [
    trigger('fadeUp', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(14px)' }),
        animate('300ms cubic-bezier(0.23,1,0.32,1)', style({ opacity: 1, transform: 'translateY(0)' })),
      ]),
    ]),
  ],
  template: `
    <div class="shell">
      <app-sidebar [role]="auth.role() ?? ''" [userName]="auth.user()?.name ?? ''" />

      <main class="main-area">
        <!-- Topbar -->
        <header class="topbar">
          <div>
            <h1 class="topbar-title">Sécurité <span class="gt">/ Incidents</span></h1>
            <p class="topbar-sub">Détection temps réel — dernière mise à jour {{ lastRefresh | date:'HH:mm:ss' }}</p>
          </div>
          <button class="refresh-btn" (click)="reload()" [disabled]="loading()">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"
                 stroke-linecap="round" stroke-linejoin="round" [class.spin]="loading()">
              <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
            </svg>
            Actualiser
          </button>
        </header>

        <div class="content">

          <!-- Stats cards -->
          <div @fadeUp class="stats-row">
            <div class="stat-card stat-total">
              <p class="stat-val">{{ stats()['total'] ?? 0 }}</p>
              <p class="stat-lbl">Total incidents</p>
            </div>
            <div class="stat-card stat-high">
              <p class="stat-val">{{ stats()['HIGH'] ?? 0 }}</p>
              <p class="stat-lbl">Sévérité HIGH</p>
            </div>
            <div class="stat-card stat-brute">
              <p class="stat-val">{{ stats()['BRUTE_FORCE'] ?? 0 }}</p>
              <p class="stat-lbl">Brute Force</p>
            </div>
            <div class="stat-card stat-sqli">
              <p class="stat-val">{{ stats()['SQL_INJECTION'] ?? 0 }}</p>
              <p class="stat-lbl">SQL Injection</p>
            </div>
            <div class="stat-card stat-xss">
              <p class="stat-val">{{ stats()['XSS'] ?? 0 }}</p>
              <p class="stat-lbl">XSS</p>
            </div>
            <div class="stat-card stat-unauth">
              <p class="stat-val">{{ stats()['UNAUTHORIZED_ACCESS'] ?? 0 }}</p>
              <p class="stat-lbl">Non autorisé</p>
            </div>
          </div>

          <!-- Filters -->
          <div @fadeUp class="filters-bar">
            <div class="filter-group">
              <label class="filter-label">Type</label>
              <div class="filter-tabs">
                <button *ngFor="let t of typeFilters"
                  class="filter-tab" [class.active]="activeType() === t.key"
                  (click)="setType(t.key)">{{ t.label }}</button>
              </div>
            </div>
            <div class="filter-group">
              <label class="filter-label">Sévérité</label>
              <div class="filter-tabs">
                <button *ngFor="let s of severityFilters"
                  class="filter-tab" [class.active]="activeSeverity() === s.key"
                  (click)="setSeverity(s.key)">{{ s.label }}</button>
              </div>
            </div>
          </div>

          <!-- Loading skeleton -->
          <div *ngIf="loading()" class="skeleton-list">
            <div *ngFor="let _ of [1,2,3,4,5]" class="skeleton-row"></div>
          </div>

          <!-- Empty state -->
          <div *ngIf="!loading() && events().length === 0" @fadeUp class="empty-state">
            <div class="empty-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#c4bdd6" stroke-width="1.5"
                   stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </div>
            <p class="empty-title">Aucun incident détecté</p>
            <p class="empty-sub">La plateforme est sécurisée pour les filtres sélectionnés.</p>
          </div>

          <!-- Events table -->
          <div *ngIf="!loading() && events().length > 0" @fadeUp class="events-table">
            <div class="table-head">
              <span class="col-date">Date</span>
              <span class="col-type">Type</span>
              <span class="col-ip">IP source</span>
              <span class="col-path">Endpoint</span>
              <span class="col-method">Méthode</span>
              <span class="col-payload">Payload</span>
            </div>
            <div *ngFor="let e of events()" @fadeUp class="table-row">
              <span class="col-date text-mono">{{ e.createdAt | date:'dd/MM HH:mm:ss' }}</span>
              <span class="col-type">
                <span class="type-badge" [ngClass]="typeCss(e.type)">{{ typeLabel(e.type) }}</span>
                <span class="sev-dot" [ngClass]="'sev-' + e.severity.toLowerCase()" [title]="e.severity"></span>
              </span>
              <span class="col-ip text-mono">{{ e.sourceIp }}</span>
              <span class="col-path text-mono">{{ e.requestPath }}</span>
              <span class="col-method">
                <span class="method-badge" [ngClass]="'method-' + e.httpMethod.toLowerCase()">{{ e.httpMethod }}</span>
              </span>
              <span class="col-payload" [title]="e.payload">{{ e.payload | slice:0:60 }}{{ (e.payload?.length ?? 0) > 60 ? '…' : '' }}</span>
            </div>
          </div>

          <!-- Pagination -->
          <div *ngIf="totalPages() > 1" class="pagination">
            <button class="page-btn" [disabled]="currentPage() === 0" (click)="goPage(currentPage() - 1)">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <span class="page-info">Page {{ currentPage() + 1 }} / {{ totalPages() }}</span>
            <button class="page-btn" [disabled]="currentPage() >= totalPages() - 1" (click)="goPage(currentPage() + 1)">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          </div>

        </div>
      </main>
    </div>
  `,
  styles: [`
    .shell { display:flex;height:100vh;overflow:hidden;background:linear-gradient(160deg,#f5fdfe 0%,#edf9fb 60%,#daf2f6 100%); }
    .main-area { flex:1;overflow-y:auto;display:flex;flex-direction:column; }

    /* Topbar */
    .topbar { display:flex;align-items:center;justify-content:space-between;padding:20px 28px;border-bottom:1px solid rgba(0,180,198,.12);background:rgba(255,253,251,.78);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);position:sticky;top:0;z-index:10;gap:16px;flex-wrap:wrap; }
    .topbar-title { font-family:'Fraunces',Georgia,serif;font-size:22px;font-weight:700;color:#1a2d3a;margin:0;letter-spacing:-.01em; }
    .topbar-sub   { font-size:12px;color:#5a7a8a;margin:3px 0 0; }
    .gt { background:linear-gradient(135deg,#f25c78,#f59e0b);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text; }
    .refresh-btn { display:flex;align-items:center;gap:7px;padding:9px 18px;border-radius:13px;background:rgba(0,180,198,.08);border:1px solid rgba(0,180,198,.22);color:#007A8A;font-size:13px;font-weight:700;cursor:pointer;transition:all .2s;font-family:inherit; }
    .refresh-btn:hover:not(:disabled) { background:rgba(0,180,198,.16);transform:translateY(-1px); }
    .refresh-btn:disabled { opacity:.5;cursor:not-allowed; }
    .spin { animation:spin .8s linear infinite; }
    @keyframes spin { to { transform:rotate(360deg); } }

    .content { padding:24px 28px;flex:1;display:flex;flex-direction:column;gap:20px; }

    /* Stats cards */
    .stats-row { display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:12px; }
    .stat-card { padding:16px 18px;border-radius:18px;border:1px solid transparent;background:rgba(255,255,255,.85);box-shadow:0 2px 12px rgba(0,0,0,.06);transition:transform .2s; }
    .stat-card:hover { transform:translateY(-2px); }
    .stat-val { font-family:'Fraunces',Georgia,serif;font-size:28px;font-weight:800;margin:0;line-height:1; }
    .stat-lbl { font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.05em;margin:6px 0 0;color:#5a7a8a; }
    .stat-total  { border-color:rgba(0,180,198,.2); }   .stat-total  .stat-val { color:#007A8A; }
    .stat-high   { border-color:rgba(242,92,120,.2); }  .stat-high   .stat-val { color:#f25c78; }
    .stat-brute  { border-color:rgba(245,158,11,.2); }  .stat-brute  .stat-val { color:#d97706; }
    .stat-sqli   { border-color:rgba(139,92,246,.2); }  .stat-sqli   .stat-val { color:#7c3aed; }
    .stat-xss    { border-color:rgba(236,72,153,.2); }  .stat-xss    .stat-val { color:#db2777; }
    .stat-unauth { border-color:rgba(59,130,246,.2); }  .stat-unauth .stat-val { color:#2563eb; }

    /* Filters */
    .filters-bar { display:flex;flex-wrap:wrap;gap:16px;padding:14px 18px;background:rgba(255,255,255,.7);border:1px solid rgba(0,180,198,.12);border-radius:16px; }
    .filter-group { display:flex;align-items:center;gap:10px;flex-wrap:wrap; }
    .filter-label { font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#8aaabb;white-space:nowrap; }
    .filter-tabs { display:flex;gap:5px;flex-wrap:wrap; }
    .filter-tab { padding:6px 13px;border-radius:999px;border:1px solid rgba(0,180,198,.18);background:transparent;color:#5a7a8a;font-size:12px;font-weight:600;cursor:pointer;transition:all .18s;font-family:inherit; }
    .filter-tab:hover  { border-color:rgba(0,180,198,.35);color:#007A8A; }
    .filter-tab.active { background:linear-gradient(135deg,rgba(0,180,198,.16),rgba(0,168,188,.09));border-color:rgba(0,180,198,.35);color:#007A8A; }

    /* Skeleton */
    .skeleton-list { display:flex;flex-direction:column;gap:8px; }
    .skeleton-row  { height:48px;border-radius:14px;background:linear-gradient(90deg,rgba(0,180,198,.06) 25%,rgba(0,180,198,.12) 50%,rgba(0,180,198,.06) 75%);background-size:200% 100%;animation:shimmer 1.4s infinite; }
    @keyframes shimmer { to { background-position:-200% 0; } }

    /* Empty */
    .empty-state { display:flex;flex-direction:column;align-items:center;gap:12px;padding:60px 20px;text-align:center; }
    .empty-icon  { width:64px;height:64px;border-radius:20px;background:rgba(0,180,198,.08);border:1px solid rgba(0,180,198,.16);display:flex;align-items:center;justify-content:center; }
    .empty-title { font-family:'Fraunces',Georgia,serif;font-size:17px;font-weight:700;color:#1a2d3a;margin:0; }
    .empty-sub   { font-size:13px;color:#5a7a8a;margin:0; }

    /* Table */
    .events-table { background:rgba(255,255,255,.85);border:1px solid rgba(0,180,198,.13);border-radius:20px;overflow:hidden;box-shadow:0 2px 16px rgba(0,180,198,.08); }
    .table-head   { display:grid;grid-template-columns:130px 160px 120px 1fr 80px 1fr;gap:0;padding:10px 18px;background:rgba(0,180,198,.06);border-bottom:1px solid rgba(0,180,198,.12); }
    .table-row    { display:grid;grid-template-columns:130px 160px 120px 1fr 80px 1fr;gap:0;padding:11px 18px;border-bottom:1px solid rgba(0,180,198,.06);align-items:center;transition:background .15s; }
    .table-row:last-child { border-bottom:none; }
    .table-row:hover { background:rgba(0,180,198,.04); }
    .table-head > span { font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#8aaabb; }
    .table-row > span  { font-size:12.5px;color:#2c3d4e;overflow:hidden;text-overflow:ellipsis;white-space:nowrap; }
    .text-mono { font-family:'Courier New',monospace;font-size:11.5px; }

    /* Type badge */
    .type-badge { font-size:10px;font-weight:800;padding:3px 9px;border-radius:999px;border:1px solid transparent;display:inline-block; }
    .badge-brute  { background:rgba(245,158,11,.12);color:#d97706;border-color:rgba(245,158,11,.3); }
    .badge-sqli   { background:rgba(139,92,246,.1);color:#7c3aed;border-color:rgba(139,92,246,.3); }
    .badge-xss    { background:rgba(236,72,153,.1);color:#db2777;border-color:rgba(236,72,153,.3); }
    .badge-path   { background:rgba(249,115,22,.1);color:#ea580c;border-color:rgba(249,115,22,.3); }
    .badge-unauth { background:rgba(59,130,246,.1);color:#2563eb;border-color:rgba(59,130,246,.3); }
    .badge-token  { background:rgba(148,163,184,.1);color:#475569;border-color:rgba(148,163,184,.3); }

    /* Severity dot */
    .sev-dot { display:inline-block;width:7px;height:7px;border-radius:50%;margin-left:7px;vertical-align:middle; }
    .sev-high   { background:#f25c78;box-shadow:0 0 0 2px rgba(242,92,120,.25); }
    .sev-medium { background:#f59e0b;box-shadow:0 0 0 2px rgba(245,158,11,.25); }
    .sev-low    { background:#1f9d6f;box-shadow:0 0 0 2px rgba(31,157,111,.2); }

    /* Method badge */
    .method-badge { font-size:10px;font-weight:800;padding:2px 8px;border-radius:6px;display:inline-block; }
    .method-get    { background:rgba(31,157,111,.12);color:#1f9d6f; }
    .method-post   { background:rgba(59,130,246,.12);color:#2563eb; }
    .method-put    { background:rgba(245,158,11,.12);color:#d97706; }
    .method-delete { background:rgba(242,92,120,.12);color:#f25c78; }

    /* Column sizes match header + rows */
    .col-date    { }
    .col-type    { display:flex;align-items:center; }
    .col-ip      { }
    .col-path    { }
    .col-method  { }
    .col-payload { color:#5a7a8a !important;font-size:11.5px !important; }

    /* Pagination */
    .pagination { display:flex;align-items:center;justify-content:center;gap:12px; }
    .page-btn   { width:34px;height:34px;border-radius:10px;border:1px solid rgba(0,180,198,.2);background:transparent;display:flex;align-items:center;justify-content:center;cursor:pointer;color:#5a7a8a;transition:all .2s; }
    .page-btn:hover:not(:disabled) { background:rgba(0,180,198,.1);color:#007A8A; }
    .page-btn:disabled { opacity:.4;cursor:not-allowed; }
    .page-info { font-size:13px;color:#5a7a8a;font-weight:600; }
  `],
})
export class AdminSecurity implements OnInit, OnDestroy {

  loading   = signal(true);
  events    = signal<SecurityEvent[]>([]);
  stats     = signal<StatsMap>({});
  activeType     = signal<string>('');
  activeSeverity = signal<string>('');
  currentPage    = signal(0);
  totalPages     = signal(0);
  lastRefresh    = new Date();

  private refreshTimer?: ReturnType<typeof setInterval>;

  typeFilters = [
    { key: '',                   label: 'Tous' },
    { key: 'BRUTE_FORCE',        label: 'Brute Force' },
    { key: 'SQL_INJECTION',      label: 'SQL Injection' },
    { key: 'XSS',                label: 'XSS' },
    { key: 'PATH_TRAVERSAL',     label: 'Path Traversal' },
    { key: 'UNAUTHORIZED_ACCESS',label: 'Non autorisé' },
    { key: 'INVALID_TOKEN',      label: 'Token invalide' },
  ];

  severityFilters = [
    { key: '',       label: 'Tous' },
    { key: 'HIGH',   label: 'HIGH' },
    { key: 'MEDIUM', label: 'MEDIUM' },
    { key: 'LOW',    label: 'LOW' },
  ];

  constructor(public auth: AuthService, private api: ApiService) {}

  ngOnInit() {
    this.reload();
    this.loadStats();
    this.refreshTimer = setInterval(() => { this.reload(); this.loadStats(); }, 30_000);
  }

  ngOnDestroy() {
    if (this.refreshTimer) clearInterval(this.refreshTimer);
  }

  setType(key: string) {
    this.activeType.set(key);
    this.currentPage.set(0);
    this.reload();
  }

  setSeverity(key: string) {
    this.activeSeverity.set(key);
    this.currentPage.set(0);
    this.reload();
  }

  goPage(p: number) {
    this.currentPage.set(p);
    this.reload();
  }

  reload() {
    this.loading.set(true);
    const params = this.buildParams();
    this.api.get<PageResponse<SecurityEvent>>(`/admin/security-events${params}`).subscribe({
      next: page => {
        this.events.set(page?.content ?? []);
        this.totalPages.set(page?.totalPages ?? 0);
        this.lastRefresh = new Date();
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  private loadStats() {
    this.api.get<StatsMap>('/admin/security-events/stats').subscribe({
      next: s => this.stats.set(s ?? {}),
      error: () => {},
    });
  }

  private buildParams(): string {
    const p: string[] = [`page=${this.currentPage()}`, 'size=25'];
    if (this.activeType())     p.push(`type=${this.activeType()}`);
    if (this.activeSeverity()) p.push(`severity=${this.activeSeverity()}`);
    return '?' + p.join('&');
  }

  typeLabel(t: EventType): string {
    const map: Record<EventType, string> = {
      BRUTE_FORCE: 'Brute Force', SQL_INJECTION: 'SQL Injection',
      XSS: 'XSS', PATH_TRAVERSAL: 'Path Traversal',
      UNAUTHORIZED_ACCESS: 'Non autorisé', INVALID_TOKEN: 'Token invalide',
    };
    return map[t] ?? t;
  }

  typeCss(t: EventType): string {
    const map: Record<EventType, string> = {
      BRUTE_FORCE: 'badge-brute', SQL_INJECTION: 'badge-sqli',
      XSS: 'badge-xss', PATH_TRAVERSAL: 'badge-path',
      UNAUTHORIZED_ACCESS: 'badge-unauth', INVALID_TOKEN: 'badge-token',
    };
    return map[t] ?? '';
  }
}
