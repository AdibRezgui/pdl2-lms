import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { trigger, style, animate, transition } from '@angular/animations';
import { AuthService } from '../../../core/services/auth';
import { Sidebar } from '../../../shared/sidebar/sidebar';

const GRAFANA_DASHBOARD_URL = 'http://localhost:3001/d/eduai-docker-v2?kiosk&theme=light&refresh=30s';

@Component({
  selector: 'app-admin-monitoring',
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
            <h1 class="topbar-title">Monitoring <span class="gt">Infrastructure</span></h1>
            <p class="topbar-sub">Métriques temps réel des conteneurs Docker — actualisées toutes les 30 s</p>
          </div>
          <a href="http://localhost:3001" target="_blank" rel="noopener" class="open-btn">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
            </svg>
            Ouvrir Grafana
          </a>
        </header>

        <div class="content">

          <!-- Intro card -->
          <div @fadeUp class="intro-card">
            <div class="intro-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
              </svg>
            </div>
            <div>
              <p class="intro-title">Tableau de bord Docker</p>
              <p class="intro-text">
                CPU, RAM et réseau de tous les conteneurs collectés par <strong>cAdvisor</strong> et
                stockés dans <strong>Prometheus</strong>. Des alertes email sont configurées pour vous
                prévenir automatiquement en cas de surcharge.
              </p>
            </div>
          </div>

          <!-- Grafana iframe -->
          <div @fadeUp class="iframe-card">
            <div class="iframe-header">
              <span class="live-dot"></span>
              <span class="live-label">Live</span>
              <span class="iframe-path">eduai-docker-v2</span>
            </div>
            <div class="iframe-wrap">
              <iframe
                [src]="grafanaUrl"
                class="grafana-iframe"
                frameborder="0"
                allowfullscreen
                title="Monitoring Infrastructure – Grafana">
              </iframe>
            </div>
          </div>

        </div>
      </main>
    </div>
  `,
  styles: [`
    .shell { display:flex;height:100vh;overflow:hidden;background:linear-gradient(160deg,#f5fdfe 0%,#edf9fb 60%,#daf2f6 100%); }
    .main-area { flex:1;overflow-y:auto;display:flex;flex-direction:column; }

    .topbar {
      display:flex;align-items:center;justify-content:space-between;
      padding:20px 28px;border-bottom:1px solid rgba(0,180,198,.12);
      background:rgba(255,253,251,.78);backdrop-filter:blur(20px);
      -webkit-backdrop-filter:blur(20px);position:sticky;top:0;z-index:10;
      gap:16px;flex-wrap:wrap;
    }
    .topbar-title { font-family:'Fraunces',Georgia,serif;font-size:22px;font-weight:700;color:#1a2d3a;margin:0;letter-spacing:-.01em; }
    .topbar-sub   { font-size:13px;color:#5a7a8a;margin:3px 0 0; }
    .gt { background:linear-gradient(135deg,#00B4C6,#00A8BC);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text; }

    .open-btn {
      display:flex;align-items:center;gap:7px;
      padding:9px 18px;border-radius:13px;
      background:linear-gradient(135deg,rgba(0,180,198,.12),rgba(0,168,188,.08));
      border:1px solid rgba(0,180,198,.28);color:#007A8A;
      font-size:13px;font-weight:700;text-decoration:none;
      transition:all .22s;white-space:nowrap;
    }
    .open-btn:hover { background:linear-gradient(135deg,rgba(0,180,198,.22),rgba(0,168,188,.15));transform:translateY(-1px);box-shadow:0 6px 20px rgba(0,180,198,.22); }

    .content { padding:24px 28px;flex:1;display:flex;flex-direction:column;gap:18px; }

    /* Intro card */
    .intro-card {
      display:flex;align-items:flex-start;gap:16px;
      padding:18px 22px;border-radius:18px;
      background:rgba(255,255,255,.8);border:1px solid rgba(0,180,198,.16);
      box-shadow:0 2px 12px rgba(0,180,198,.08);
    }
    .intro-icon {
      width:44px;height:44px;border-radius:14px;flex-shrink:0;
      background:linear-gradient(135deg,rgba(0,180,198,.15),rgba(0,168,188,.09));
      border:1px solid rgba(0,180,198,.22);
      display:flex;align-items:center;justify-content:center;color:#007A8A;
    }
    .intro-title { font-family:'Fraunces',Georgia,serif;font-size:15px;font-weight:700;color:#1a2d3a;margin:0 0 5px; }
    .intro-text  { font-size:13px;color:#5a7a8a;margin:0;line-height:1.6; }
    .intro-text strong { color:#007A8A;font-weight:700; }

    /* Iframe card */
    .iframe-card {
      flex:1;min-height:640px;
      border-radius:22px;overflow:hidden;
      background:rgba(255,255,255,.85);
      border:1px solid rgba(0,180,198,.14);
      box-shadow:0 4px 24px rgba(0,180,198,.12);
      display:flex;flex-direction:column;
    }
    .iframe-header {
      display:flex;align-items:center;gap:8px;
      padding:11px 18px;
      border-bottom:1px solid rgba(0,180,198,.12);
      background:rgba(245,253,254,.9);
    }
    .live-dot {
      width:8px;height:8px;border-radius:50%;
      background:#1f9d6f;
      box-shadow:0 0 0 2px rgba(31,157,111,.25);
      animation:pulse 2s ease-in-out infinite;
    }
    @keyframes pulse {
      0%,100% { box-shadow:0 0 0 2px rgba(31,157,111,.25); }
      50%      { box-shadow:0 0 0 5px rgba(31,157,111,.0); }
    }
    .live-label { font-size:11px;font-weight:800;color:#1f9d6f;text-transform:uppercase;letter-spacing:.06em; }
    .iframe-path { font-size:11.5px;color:#8aaabb;margin-left:4px; }

    .iframe-wrap { flex:1;position:relative; }
    .grafana-iframe { position:absolute;inset:0;width:100%;height:100%;border:none;display:block; }
  `],
})
export class AdminMonitoring {
  grafanaUrl: SafeResourceUrl;

  constructor(public auth: AuthService, private sanitizer: DomSanitizer) {
    this.grafanaUrl = this.sanitizer.bypassSecurityTrustResourceUrl(GRAFANA_DASHBOARD_URL);
  }
}
