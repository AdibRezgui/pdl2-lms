import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth';
import { ApiService } from '../../../core/services/api';
import { Sidebar } from '../../../shared/sidebar/sidebar';

interface Course { id: string; title: string; category: string; level: string; thumbnail?: string; trainerName?: string; }
interface Enrollment { id: string; course: Course; progress: number; completed: boolean; badgeEarned: boolean; enrolledAt?: string; completedAt?: string; }
interface Recommendation { id: string; title: string; category: string; level: string; }

@Component({
  selector: 'app-student-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, Sidebar],
  template: `
<div class="sd-shell">
  <app-sidebar [role]="auth.role() ?? ''" [userName]="auth.user()?.name ?? ''" />

  <main class="sd-main">

    <!-- ── HEADER ─────────────────────────────────────────────────── -->
    <header class="sd-hd">
      <div class="sd-hd-left">
        <div class="sd-hd-av">
          <img *ngIf="userAvatar" [src]="userAvatar" alt="avatar" class="sd-hd-av-img" />
          <span *ngIf="!userAvatar">{{ initials }}</span>
        </div>
        <div>
          <h1 class="sd-hd-title">Bonjour, <span class="sd-hd-name">{{ firstName }}</span> 👋</h1>
          <p class="sd-hd-sub">Continuez votre apprentissage et atteignez vos objectifs</p>
        </div>
      </div>
      <div class="sd-hd-right">
        <div class="sd-search">
          <svg class="sd-search-ic" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input class="sd-search-inp" type="text" placeholder="Rechercher un cours…" />
        </div>
        <button class="sd-notif-btn" aria-label="Notifications">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
        </button>
        <a routerLink="/student/courses" class="sd-cta-btn">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Explorer les cours
        </a>
      </div>
    </header>

    <div class="sd-body">

      <!-- ── HERO ──────────────────────────────────────────────────── -->
      <section class="sd-hero">

        <!-- Left: resume card -->
        <div class="sd-hero-l" *ngIf="!loading() && hero()">
          <div class="sd-hero-bg" [style]="heroBgStyle()"></div>
          <div class="sd-hero-overlay"></div>
          <div class="sd-hero-content">
            <span class="sd-hero-tag">
              <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor"><path d="M5 3l14 9-14 9V3z"/></svg>
              Reprendre là où vous vous êtes arrêté
            </span>
            <h2 class="sd-hero-title">{{ hero()!.course.title }}</h2>
            <p class="sd-hero-meta">{{ hero()!.course.category }} · {{ levelLabel(hero()!.course.level) }}</p>
            <div class="sd-hero-pbar">
              <div class="sd-hero-pfill" [style.width.%]="hero()!.progress"></div>
            </div>
            <p class="sd-hero-prow">{{ hero()!.progress }}% complété</p>
            <a [routerLink]="['/student/learn', hero()!.course.id]" class="sd-hero-btn">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M5 3l14 9-14 9V3z"/></svg>
              Continuer le cours
            </a>
          </div>
        </div>

        <div class="sd-hero-l sd-hero-empty" *ngIf="!loading() && !hero()">
          <div style="text-align:center;padding:36px 24px">
            <div class="sd-hero-empty-ic">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
            </div>
            <h2 class="sd-hero-title" style="font-size:20px;margin-bottom:8px">Commencez votre apprentissage</h2>
            <p style="color:rgba(255,255,255,.55);font-size:13px;margin:0 0 20px">Explorez notre catalogue et inscrivez-vous à votre premier cours</p>
            <a routerLink="/student/courses" class="sd-hero-btn">Découvrir les cours</a>
          </div>
        </div>

        <div class="sd-hero-l sd-skel" *ngIf="loading()" style="min-height:200px"></div>

        <!-- Right: gamification pills -->
        <div class="sd-hero-r">

          <div class="sd-hpill" *ngIf="loading()">
            <div class="sd-skel" style="height:100%;border-radius:12px;min-height:72px"></div>
          </div>

          <ng-container *ngIf="!loading()">
            <div class="sd-hpill">
              <div class="sd-hpill-ic sd-hpill-yellow">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
              </div>
              <div class="sd-hpill-body">
                <p class="sd-hpill-lbl">Points XP</p>
                <p class="sd-hpill-val">{{ xp() }}</p>
                <p class="sd-hpill-sub">+{{ active().length * 10 }} cette semaine</p>
              </div>
            </div>
            <div class="sd-hpill">
              <div class="sd-hpill-ic sd-hpill-teal">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg>
              </div>
              <div class="sd-hpill-body">
                <p class="sd-hpill-lbl">Niveau actuel</p>
                <p class="sd-hpill-val">{{ level() }}</p>
                <div class="sd-hpill-bar"><div class="sd-hpill-bar-fill" [style.width.%]="levelPct()"></div></div>
                <p class="sd-hpill-sub">Prochain : {{ nextLevelName() }}</p>
              </div>
            </div>
            <div class="sd-hpill">
              <div class="sd-hpill-ic sd-hpill-orange">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
              </div>
              <div class="sd-hpill-body">
                <p class="sd-hpill-lbl">Cours actifs</p>
                <p class="sd-hpill-val">{{ active().length }}</p>
                <p class="sd-hpill-sub">{{ done().length }} terminé{{ done().length !== 1 ? 's' : '' }}</p>
              </div>
            </div>
          </ng-container>
        </div>
      </section>

      <!-- ── STATS ─────────────────────────────────────────────────── -->
      <div class="sd-stats">
        <div class="sd-stat sd-stat-teal">
          <div class="sd-stat-ic">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
          </div>
          <div class="sd-stat-body">
            <p class="sd-stat-val">{{ loading() ? '—' : active().length }}</p>
            <p class="sd-stat-lbl">Cours actifs</p>
          </div>
          <span class="sd-stat-badge sd-badge-teal">En cours</span>
        </div>
        <div class="sd-stat sd-stat-green">
          <div class="sd-stat-ic">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <div class="sd-stat-body">
            <p class="sd-stat-val">{{ loading() ? '—' : done().length }}</p>
            <p class="sd-stat-lbl">Cours terminés</p>
          </div>
          <span class="sd-stat-badge sd-badge-green">Complétés</span>
        </div>
        <div class="sd-stat sd-stat-purple">
          <div class="sd-stat-ic">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
          </div>
          <div class="sd-stat-body">
            <p class="sd-stat-val">{{ loading() ? '—' : avgProgress() + '%' }}</p>
            <p class="sd-stat-lbl">Progression moy.</p>
          </div>
          <span class="sd-stat-badge sd-badge-purple">Global</span>
        </div>
        <div class="sd-stat sd-stat-amber">
          <div class="sd-stat-ic">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg>
          </div>
          <div class="sd-stat-body">
            <p class="sd-stat-val">{{ loading() ? '—' : certs().length }}</p>
            <p class="sd-stat-lbl">Certificats</p>
          </div>
          <span class="sd-stat-badge sd-badge-amber">Badges</span>
        </div>
      </div>

      <!-- ── 2-COL: Continue + Aside ───────────────────────────────── -->
      <div class="sd-2col">

        <!-- Continue Learning -->
        <section class="sd-card">
          <div class="sd-card-hd">
            <h2 class="sd-card-title">Continuer l'apprentissage</h2>
            <a routerLink="/student/courses" class="sd-link-all">Voir tout →</a>
          </div>

          <div class="sd-cg" *ngIf="loading()">
            <div *ngFor="let _ of [1,2,3,4]" class="sd-skel" style="height:188px;border-radius:16px"></div>
          </div>

          <div class="sd-empty" *ngIf="!loading() && active().length === 0">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
            <p>Aucun cours en cours</p>
            <a routerLink="/student/courses" class="sd-btn-ghost">Commencer maintenant</a>
          </div>

          <div class="sd-cg" *ngIf="!loading() && active().length > 0">
            <div class="sd-cc" *ngFor="let e of active().slice(0, 4); let i = index"
                 [style.animation-delay]="(i * 80) + 'ms'">
              <div class="sd-cc-img">
                <div class="sd-cc-bg" [style]="bgStyle(e.course)"></div>
                <div class="sd-cc-fade"></div>
                <span class="sd-cc-cat">{{ e.course.category }}</span>
                <div class="sd-cc-hov">
                  <a [routerLink]="['/student/learn', e.course.id]" class="sd-cc-hov-btn">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M5 3l14 9-14 9V3z"/></svg>
                    Continuer
                  </a>
                </div>
              </div>
              <div class="sd-cc-body">
                <p class="sd-cc-title">{{ e.course.title }}</p>
                <p class="sd-cc-trainer" *ngIf="e.course.trainerName">{{ e.course.trainerName }}</p>
                <div class="sd-cc-prow">
                  <div class="sd-cc-pbar"><div class="sd-cc-pfill" [style.width.%]="e.progress"></div></div>
                  <span class="sd-cc-pct">{{ e.progress }}%</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- Aside -->
        <div class="sd-aside">

          <!-- AI Card -->
          <div class="sd-ai">
            <div class="sd-ai-glow"></div>
            <div class="sd-ai-head">
              <div class="sd-ai-bot">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><rect x="2" y="8" width="20" height="12" rx="2"/><path d="M12 8V4H8"/><path d="M6 12h.01M12 12h.01M18 12h.01"/></svg>
              </div>
              <div>
                <div style="display:flex;align-items:center;gap:6px">
                  <span class="sd-ai-title">Assistant IA</span>
                  <span class="sd-ai-beta">BETA</span>
                </div>
                <p class="sd-ai-sub">Posez-moi une question sur vos cours</p>
              </div>
            </div>
            <a routerLink="/student/chat" class="sd-ai-inp">
              <span>Ex: Explique-moi les fonctions en Python…</span>
              <div class="sd-ai-send">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
              </div>
            </a>
            <div class="sd-ai-chips">
              <a routerLink="/student/chat" class="sd-ai-chip">Expliquer un concept</a>
              <a routerLink="/student/chat" class="sd-ai-chip">Aide sur un exercice</a>
              <a routerLink="/student/chat" class="sd-ai-chip">Résumer une leçon</a>
            </div>
          </div>

          <!-- Recommendations -->
          <div class="sd-card">
            <div class="sd-card-hd">
              <h2 class="sd-card-title">Recommandé pour vous</h2>
              <a routerLink="/student/courses" class="sd-link-all">Voir tout →</a>
            </div>
            <p class="sd-empty-txt" *ngIf="!loading() && recs().length === 0">Aucune recommandation</p>
            <div class="sd-recs">
              <div class="sd-rec" *ngFor="let r of recs(); let i = index" [style.animation-delay]="(i * 60) + 'ms'">
                <div class="sd-rec-dot" [style.background]="catGradient(r.category)"></div>
                <div class="sd-rec-body">
                  <p class="sd-rec-title">{{ r.title }}</p>
                  <p class="sd-rec-meta">{{ r.category }} · {{ levelLabel(r.level) }}</p>
                </div>
                <a routerLink="/student/courses" class="sd-rec-arr">→</a>
              </div>
            </div>
          </div>

        </div>
      </div>

      <!-- ── BOTTOM 3-COL ──────────────────────────────────────────── -->
      <div class="sd-3col">

        <!-- Activity Timeline -->
        <section class="sd-card">
          <div class="sd-card-hd">
            <h2 class="sd-card-title">Activité récente</h2>
            <a routerLink="/student/progress" class="sd-link-all">Voir tout →</a>
          </div>
          <div *ngIf="loading()">
            <div *ngFor="let _ of [1,2,3]" class="sd-skel" style="height:48px;border-radius:12px;margin-bottom:8px"></div>
          </div>
          <p class="sd-empty-txt" *ngIf="!loading() && recentActivity().length === 0">Aucune activité récente</p>
          <div class="sd-tl">
            <div class="sd-tl-item" *ngFor="let a of recentActivity(); let last = last">
              <div class="sd-tl-left">
                <div class="sd-tl-dot" [class.sd-tl-done]="a.type === 'completed'" [class.sd-tl-prog]="a.type === 'progress'"></div>
                <div class="sd-tl-line" *ngIf="!last"></div>
              </div>
              <div class="sd-tl-body">
                <p class="sd-tl-lbl">{{ a.label }}</p>
                <p class="sd-tl-sub">{{ a.sub }}{{ a.date ? ' · ' + formatDate(a.date) : '' }}</p>
              </div>
            </div>
          </div>
        </section>

        <!-- Certificates -->
        <section class="sd-card">
          <div class="sd-card-hd">
            <h2 class="sd-card-title">Mes certificats</h2>
            <a routerLink="/student/certificates" class="sd-link-all">Voir tout →</a>
          </div>
          <div class="sd-empty" *ngIf="!loading() && certs().length === 0" style="padding:20px">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg>
            <p>Aucun certificat encore</p>
          </div>
          <div class="sd-certs">
            <div class="sd-cert" *ngFor="let c of certs().slice(0, 4)">
              <div class="sd-cert-badge">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg>
              </div>
              <div class="sd-cert-body">
                <p class="sd-cert-title">{{ c.course.title }}</p>
                <p class="sd-cert-meta">{{ c.course.category }}{{ c.completedAt ? ' · ' + formatDate(c.completedAt) : '' }}</p>
              </div>
              <a routerLink="/student/certificates" class="sd-cert-arr">→</a>
            </div>
          </div>
        </section>

        <!-- Progress chart -->
        <section class="sd-card">
          <div class="sd-card-hd">
            <h2 class="sd-card-title">Progression par cours</h2>
          </div>
          <p class="sd-empty-txt" *ngIf="!loading() && enrollments().length === 0">Inscrivez-vous à un cours pour voir votre progression</p>
          <div class="sd-chart">
            <div class="sd-chart-row" *ngFor="let e of enrollments().slice(0, 6); let i = index">
              <span class="sd-chart-lbl">{{ shortTitle(e.course.title) }}</span>
              <div class="sd-chart-track">
                <div class="sd-chart-fill"
                     [style.width.%]="e.progress"
                     [style.background]="barGradient(i)"
                     [style.animation-delay]="(i * 120) + 'ms'">
                </div>
              </div>
              <span class="sd-chart-pct">{{ e.progress }}%</span>
            </div>
          </div>
        </section>

      </div>
    </div>
  </main>
</div>
  `,
  styles: [`
    /* ── Layout ──────────────────────────────────────────────────── */
    .sd-shell { display:flex; height:100vh; overflow:hidden; }
    .sd-main {
      flex:1; overflow-y:auto; position:relative;
      background: #f0f4f8;
    }

    /* ── Header ──────────────────────────────────────────────────── */
    .sd-hd {
      position:sticky; top:0; z-index:20;
      display:flex; align-items:center; justify-content:space-between;
      padding:13px 28px; gap:12px;
      background:#fff;
      border-bottom:1px solid #e2e8f0;
      box-shadow: 0 1px 3px rgba(0,0,0,.04);
    }
    .sd-hd-left { display:flex; align-items:center; gap:12px; min-width:0; }
    .sd-hd-av {
      width:40px; height:40px; border-radius:50%; flex-shrink:0;
      background:linear-gradient(135deg,#14B8A6,#0d9488);
      display:flex; align-items:center; justify-content:center;
      overflow:hidden; border:2px solid rgba(255,255,255,.7);
      box-shadow:0 3px 10px rgba(20,184,166,.3);
      font-size:13px; font-weight:700; color:white;
    }
    .sd-hd-av-img { width:100%; height:100%; object-fit:cover; }
    .sd-hd-title { font-family:'Fraunces',Georgia,serif; font-size:17px; font-weight:700; color:#1a2035; margin:0; line-height:1.2; }
    .sd-hd-name  { color:#14B8A6; }
    .sd-hd-sub   { font-size:12px; color:rgba(26,32,53,.48); margin:2px 0 0; }
    .sd-hd-right { display:flex; align-items:center; gap:9px; flex-shrink:0; }
    .sd-search   { position:relative; display:flex; align-items:center; }
    .sd-search-ic { position:absolute; left:10px; color:rgba(26,32,53,.38); pointer-events:none; }
    .sd-search-inp {
      padding:7px 13px 7px 30px; border-radius:20px;
      border:1px solid #e2e8f0;
      background:#f8fafc;
      font-size:12.5px; color:#1a2035; outline:none; width:200px;
      transition:all .2s;
    }
    .sd-search-inp:focus { border-color:rgba(20,184,166,.5); background:#fff; box-shadow:0 0 0 3px rgba(20,184,166,.1); }
    .sd-search-inp::placeholder { color:#94a3b8; }
    .sd-notif-btn {
      width:36px; height:36px; border-radius:50%;
      border:1px solid #e2e8f0; background:#f8fafc;
      display:flex; align-items:center; justify-content:center;
      cursor:pointer; color:#64748b; transition:all .2s;
    }
    .sd-notif-btn:hover { background:#fff; color:#14B8A6; border-color:rgba(20,184,166,.4); }
    .sd-cta-btn {
      display:flex; align-items:center; gap:5px;
      padding:8px 16px; border-radius:20px;
      background:linear-gradient(135deg,#14B8A6,#0d9488);
      color:white; font-size:12.5px; font-weight:600; text-decoration:none;
      box-shadow:0 4px 14px rgba(20,184,166,.38);
      transition:all .22s cubic-bezier(.16,1,.3,1); white-space:nowrap;
    }
    .sd-cta-btn:hover { transform:translateY(-2px); box-shadow:0 8px 20px rgba(20,184,166,.45); }

    /* ── Body ────────────────────────────────────────────────────── */
    .sd-body {
      padding:22px 28px 48px;
      display:flex; flex-direction:column; gap:18px;
      max-width:1380px; margin:0 auto; width:100%; box-sizing:border-box;
    }

    /* ── Hero ────────────────────────────────────────────────────── */
    .sd-hero { display:grid; grid-template-columns:1fr 268px; gap:14px; animation:sd-in .5s both; }
    .sd-hero-l {
      position:relative; border-radius:20px; overflow:hidden;
      min-height:196px; border:1px solid rgba(255,255,255,.28);
      display:flex; flex-direction:column;
    }
    .sd-hero-bg {
      position:absolute; inset:0;
      transform:scale(1.04); transition:transform 8s ease;
    }
    .sd-hero-l:hover .sd-hero-bg { transform:scale(1); }
    .sd-hero-overlay {
      position:absolute; inset:0;
      background:linear-gradient(to right, rgba(10,15,30,.88) 0%, rgba(10,15,30,.62) 55%, rgba(10,15,30,.18) 100%);
    }
    .sd-hero-content {
      position:relative; z-index:2; padding:26px 30px;
      flex:1; display:flex; flex-direction:column; justify-content:flex-end;
    }
    .sd-hero-tag {
      display:inline-flex; align-items:center; gap:5px;
      padding:3px 9px; border-radius:20px; margin-bottom:9px; width:fit-content;
      background:rgba(20,184,166,.22); border:1px solid rgba(20,184,166,.38);
      color:#5eead4; font-size:10.5px; font-weight:600;
    }
    .sd-hero-title {
      font-family:'Fraunces',Georgia,serif; font-size:24px; font-weight:800;
      color:white; margin:0 0 4px; line-height:1.2; text-shadow:0 2px 8px rgba(0,0,0,.3);
    }
    .sd-hero-meta  { font-size:12.5px; color:rgba(255,255,255,.55); margin:0 0 14px; }
    .sd-hero-pbar  { height:5px; border-radius:5px; background:rgba(255,255,255,.18); overflow:hidden; margin-bottom:5px; max-width:300px; }
    .sd-hero-pfill { height:100%; border-radius:5px; background:linear-gradient(90deg,#14B8A6,#5eead4); transition:width 1s cubic-bezier(.16,1,.3,1); }
    .sd-hero-prow  { font-size:11.5px; color:rgba(255,255,255,.5); margin:0 0 17px; }
    .sd-hero-btn {
      display:inline-flex; align-items:center; gap:6px;
      padding:9px 18px; border-radius:20px; width:fit-content;
      background:linear-gradient(135deg,#14B8A6,#0d9488);
      color:white; font-size:13px; font-weight:600; text-decoration:none;
      box-shadow:0 4px 16px rgba(20,184,166,.4);
      transition:all .22s cubic-bezier(.16,1,.3,1);
    }
    .sd-hero-btn:hover { transform:translateY(-2px); box-shadow:0 8px 22px rgba(20,184,166,.5); }
    .sd-hero-empty { background:linear-gradient(135deg,#1a2035,#2d3748); align-items:center; justify-content:center; }
    .sd-hero-empty-ic {
      width:68px; height:68px; border-radius:18px; margin:0 auto 14px;
      background:rgba(20,184,166,.14); border:1px solid rgba(20,184,166,.28);
      display:flex; align-items:center; justify-content:center; color:#5eead4;
    }

    /* ── Gamification pills ──────────────────────────────────────── */
    .sd-hero-r { display:flex; flex-direction:column; gap:11px; }
    .sd-hpill {
      flex:1; display:flex; align-items:center; gap:11px;
      padding:13px 15px; border-radius:15px;
      background:#fff; border:1px solid #e2e8f0;
      box-shadow:0 2px 8px rgba(0,0,0,.06);
      animation:sd-in .5s both;
    }
    .sd-hpill-ic { width:38px; height:38px; border-radius:11px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
    .sd-hpill-yellow { background:linear-gradient(135deg,#fbbf24,#f59e0b); }
    .sd-hpill-teal   { background:linear-gradient(135deg,#14B8A6,#0d9488); }
    .sd-hpill-orange { background:linear-gradient(135deg,#f97316,#ea580c); }
    .sd-hpill-body   { flex:1; min-width:0; }
    .sd-hpill-lbl    { font-size:10.5px; color:rgba(26,32,53,.46); margin:0; font-weight:500; }
    .sd-hpill-val    { font-family:'Fraunces',Georgia,serif; font-size:19px; font-weight:800; color:#1a2035; margin:1px 0 1px; line-height:1; }
    .sd-hpill-sub    { font-size:10.5px; color:rgba(26,32,53,.42); margin:0; }
    .sd-hpill-bar    { height:4px; border-radius:4px; background:rgba(0,0,0,.1); overflow:hidden; margin:3px 0 2px; }
    .sd-hpill-bar-fill { height:100%; border-radius:4px; background:linear-gradient(90deg,#14B8A6,#5eead4); transition:width 1.2s cubic-bezier(.16,1,.3,1); }

    /* ── Stats row ───────────────────────────────────────────────── */
    .sd-stats { display:grid; grid-template-columns:repeat(4,1fr); gap:13px; animation:sd-in .5s .08s both; }
    .sd-stat {
      display:flex; align-items:center; gap:13px;
      padding:17px 18px; border-radius:17px;
      background:#fff; border:1px solid #e2e8f0;
      box-shadow:0 2px 8px rgba(0,0,0,.05);
      transition:all .25s cubic-bezier(.16,1,.3,1); position:relative; overflow:hidden;
    }
    .sd-stat:hover { transform:translateY(-3px); box-shadow:0 12px 30px rgba(0,0,0,.1); }
    .sd-stat-ic { width:44px; height:44px; border-radius:13px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
    .sd-stat-teal   .sd-stat-ic { background:rgba(20,184,166,.14);  color:#14B8A6; }
    .sd-stat-green  .sd-stat-ic { background:rgba(34,197,94,.14);   color:#22C55E; }
    .sd-stat-purple .sd-stat-ic { background:rgba(139,92,246,.14);  color:#8b5cf6; }
    .sd-stat-amber  .sd-stat-ic { background:rgba(245,158,11,.14);  color:#f59e0b; }
    .sd-stat-body  { flex:1; min-width:0; }
    .sd-stat-val   { font-family:'Fraunces',Georgia,serif; font-size:26px; font-weight:800; color:#1a2035; margin:0; line-height:1; }
    .sd-stat-lbl   { font-size:11.5px; color:rgba(26,32,53,.5); margin:4px 0 0; }
    .sd-stat-badge { font-size:10px; font-weight:600; padding:3px 7px; border-radius:20px; white-space:nowrap; }
    .sd-badge-teal   { background:rgba(20,184,166,.12);  color:#0d9488; }
    .sd-badge-green  { background:rgba(34,197,94,.12);   color:#16a34a; }
    .sd-badge-purple { background:rgba(139,92,246,.12);  color:#7c3aed; }
    .sd-badge-amber  { background:rgba(245,158,11,.12);  color:#d97706; }

    /* ── 2-col grid ──────────────────────────────────────────────── */
    .sd-2col { display:grid; grid-template-columns:1fr 290px; gap:15px; animation:sd-in .5s .16s both; }
    .sd-aside { display:flex; flex-direction:column; gap:15px; }

    /* ── Card shell ──────────────────────────────────────────────── */
    .sd-card {
      border-radius:19px; padding:18px;
      background:#fff; border:1px solid #e2e8f0;
      box-shadow:0 2px 8px rgba(0,0,0,.05);
    }
    .sd-card-hd { display:flex; align-items:center; justify-content:space-between; margin-bottom:15px; }
    .sd-card-title { font-family:'Fraunces',Georgia,serif; font-size:15px; font-weight:700; color:#1a2035; margin:0; }
    .sd-link-all { font-size:11.5px; font-weight:600; color:#14B8A6; text-decoration:none; transition:opacity .2s; }
    .sd-link-all:hover { opacity:.65; }

    /* ── Course cards ────────────────────────────────────────────── */
    .sd-cg { display:grid; grid-template-columns:repeat(auto-fill,minmax(190px,1fr)); gap:13px; }
    .sd-cc {
      border-radius:15px; overflow:hidden;
      border:1px solid rgba(0,0,0,.08); background:#fff;
      transition:all .25s cubic-bezier(.16,1,.3,1);
      animation:sd-in .4s both; cursor:pointer;
    }
    .sd-cc:hover { transform:translateY(-4px); box-shadow:0 16px 38px rgba(0,0,0,.12); border-color:rgba(20,184,166,.28); }
    .sd-cc-img { position:relative; aspect-ratio:16/9; overflow:hidden; }
    .sd-cc-bg { position:absolute; inset:0; transition:transform .4s ease; }
    .sd-cc:hover .sd-cc-bg { transform:scale(1.06); }
    .sd-cc-fade { position:absolute; inset:0; background:linear-gradient(to bottom,transparent 40%,rgba(0,0,0,.38) 100%); }
    .sd-cc-cat {
      position:absolute; top:7px; left:7px; z-index:2;
      padding:2px 7px; border-radius:20px;
      background:rgba(0,0,0,.48); backdrop-filter:blur(6px);
      color:white; font-size:9.5px; font-weight:600;
    }
    .sd-cc-hov {
      position:absolute; inset:0; z-index:3;
      background:rgba(20,184,166,.14); backdrop-filter:blur(3px);
      display:flex; align-items:center; justify-content:center;
      opacity:0; transition:opacity .25s;
    }
    .sd-cc:hover .sd-cc-hov { opacity:1; }
    .sd-cc-hov-btn {
      display:flex; align-items:center; gap:5px; padding:8px 16px; border-radius:20px;
      background:linear-gradient(135deg,#14B8A6,#0d9488); color:white;
      font-size:12.5px; font-weight:600; text-decoration:none;
      box-shadow:0 4px 14px rgba(20,184,166,.48); transition:transform .18s;
    }
    .sd-cc-hov-btn:hover { transform:scale(1.04); }
    .sd-cc-body    { padding:11px; }
    .sd-cc-title   { font-size:13px; font-weight:600; color:#1a2035; margin:0 0 2px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    .sd-cc-trainer { font-size:10.5px; color:rgba(26,32,53,.45); margin:0 0 7px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    .sd-cc-prow    { display:flex; align-items:center; gap:7px; }
    .sd-cc-pbar    { flex:1; height:4px; border-radius:4px; background:rgba(0,0,0,.08); overflow:hidden; }
    .sd-cc-pfill   { height:100%; border-radius:4px; background:linear-gradient(90deg,#14B8A6,#5eead4); transition:width 1s cubic-bezier(.16,1,.3,1); }
    .sd-cc-pct     { font-size:10.5px; font-weight:700; color:#14B8A6; min-width:26px; text-align:right; }

    /* ── AI card ─────────────────────────────────────────────────── */
    .sd-ai {
      position:relative; overflow:hidden; padding:18px; border-radius:19px;
      background:linear-gradient(135deg,rgba(15,23,42,.92),rgba(30,41,59,.88));
      border:1px solid rgba(20,184,166,.22); box-shadow:0 4px 18px rgba(0,0,0,.18);
    }
    .sd-ai-glow {
      position:absolute; width:130px; height:130px; bottom:-50px; right:-40px; border-radius:50%;
      background:radial-gradient(circle,rgba(20,184,166,.32),transparent 70%); pointer-events:none;
    }
    .sd-ai-head  { display:flex; align-items:center; gap:10px; margin-bottom:12px; }
    .sd-ai-bot   { width:38px; height:38px; border-radius:11px; background:linear-gradient(135deg,#14B8A6,#0d9488); display:flex; align-items:center; justify-content:center; flex-shrink:0; box-shadow:0 3px 10px rgba(20,184,166,.38); }
    .sd-ai-title { font-size:13.5px; font-weight:700; color:white; }
    .sd-ai-beta  { font-size:9px; font-weight:700; color:#14B8A6; padding:2px 5px; border-radius:4px; background:rgba(20,184,166,.18); border:1px solid rgba(20,184,166,.28); }
    .sd-ai-sub   { font-size:11px; color:rgba(255,255,255,.46); margin:1px 0 0; }
    .sd-ai-inp {
      display:flex; align-items:center; justify-content:space-between; gap:8px;
      padding:9px 11px; border-radius:11px; margin-bottom:11px;
      background:rgba(255,255,255,.07); border:1px solid rgba(255,255,255,.11);
      text-decoration:none; transition:all .2s;
    }
    .sd-ai-inp:hover { background:rgba(255,255,255,.12); border-color:rgba(20,184,166,.38); }
    .sd-ai-inp span { font-size:11.5px; color:rgba(255,255,255,.35); flex:1; }
    .sd-ai-send { width:24px; height:24px; border-radius:7px; background:linear-gradient(135deg,#14B8A6,#0d9488); display:flex; align-items:center; justify-content:center; color:white; flex-shrink:0; }
    .sd-ai-chips { display:flex; flex-wrap:wrap; gap:5px; }
    .sd-ai-chip {
      padding:4px 9px; border-radius:20px;
      background:rgba(255,255,255,.08); border:1px solid rgba(255,255,255,.11);
      color:rgba(255,255,255,.65); font-size:10.5px; font-weight:500;
      text-decoration:none; transition:all .18s; cursor:pointer;
    }
    .sd-ai-chip:hover { background:rgba(20,184,166,.18); border-color:rgba(20,184,166,.38); color:#5eead4; }

    /* ── Recommendations ─────────────────────────────────────────── */
    .sd-recs { display:flex; flex-direction:column; gap:7px; }
    .sd-rec {
      display:flex; align-items:center; gap:9px; padding:9px;
      border-radius:11px; background:rgba(20,184,166,.04); border:1px solid rgba(20,184,166,.1);
      transition:all .2s; animation:sd-in .4s both;
    }
    .sd-rec:hover { background:rgba(20,184,166,.09); border-color:rgba(20,184,166,.22); transform:translateX(3px); }
    .sd-rec-dot  { width:8px; height:8px; border-radius:50%; flex-shrink:0; }
    .sd-rec-body { flex:1; min-width:0; }
    .sd-rec-title{ font-size:12.5px; font-weight:600; color:#1a2035; margin:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    .sd-rec-meta { font-size:10.5px; color:rgba(26,32,53,.46); margin:1px 0 0; }
    .sd-rec-arr  { font-size:13px; color:#14B8A6; font-weight:600; text-decoration:none; }

    /* ── 3-col bottom ────────────────────────────────────────────── */
    .sd-3col { display:grid; grid-template-columns:repeat(3,1fr); gap:15px; animation:sd-in .5s .24s both; }

    /* ── Timeline ────────────────────────────────────────────────── */
    .sd-tl { display:flex; flex-direction:column; }
    .sd-tl-item { display:flex; gap:11px; padding-bottom:10px; }
    .sd-tl-left { display:flex; flex-direction:column; align-items:center; flex-shrink:0; width:18px; }
    .sd-tl-dot  { width:18px; height:18px; border-radius:50%; flex-shrink:0; }
    .sd-tl-done { background:rgba(34,197,94,.16); border:2px solid #22C55E; }
    .sd-tl-prog { background:rgba(20,184,166,.16); border:2px solid #14B8A6; }
    .sd-tl-line { flex:1; width:2px; background:rgba(0,0,0,.08); margin:2px 0; }
    .sd-tl-body { flex:1; padding-top:1px; }
    .sd-tl-lbl  { font-size:12.5px; font-weight:600; color:#1a2035; margin:0 0 2px; }
    .sd-tl-sub  { font-size:11px; color:rgba(26,32,53,.46); margin:0; }

    /* ── Certificates ────────────────────────────────────────────── */
    .sd-certs { display:flex; flex-direction:column; gap:7px; }
    .sd-cert {
      display:flex; align-items:center; gap:9px; padding:9px;
      border-radius:11px;
      background:linear-gradient(135deg,rgba(245,158,11,.08),rgba(251,191,36,.04));
      border:1px solid rgba(245,158,11,.18); transition:all .2s;
    }
    .sd-cert:hover { border-color:rgba(245,158,11,.38); transform:translateX(2px); }
    .sd-cert-badge { width:32px; height:32px; border-radius:9px; background:linear-gradient(135deg,#f59e0b,#d97706); display:flex; align-items:center; justify-content:center; flex-shrink:0; box-shadow:0 3px 9px rgba(245,158,11,.28); }
    .sd-cert-body  { flex:1; min-width:0; }
    .sd-cert-title { font-size:12.5px; font-weight:600; color:#1a2035; margin:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    .sd-cert-meta  { font-size:10.5px; color:rgba(26,32,53,.46); margin:2px 0 0; }
    .sd-cert-arr   { font-size:13px; color:#f59e0b; font-weight:600; text-decoration:none; }

    /* ── Progress chart ──────────────────────────────────────────── */
    .sd-chart { display:flex; flex-direction:column; gap:10px; }
    .sd-chart-row { display:flex; align-items:center; gap:9px; }
    .sd-chart-lbl { font-size:11px; color:rgba(26,32,53,.52); width:78px; flex-shrink:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    .sd-chart-track { flex:1; height:7px; border-radius:7px; background:rgba(0,0,0,.07); overflow:hidden; }
    .sd-chart-fill  { height:100%; border-radius:7px; transition:width 1s cubic-bezier(.16,1,.3,1); animation:sd-bar .9s both; }
    .sd-chart-pct   { font-size:10.5px; font-weight:700; color:rgba(26,32,53,.55); min-width:28px; text-align:right; }
    @keyframes sd-bar { from { width:0 !important; } }

    /* ── Skeleton ────────────────────────────────────────────────── */
    .sd-skel {
      background:linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%);
      background-size:200% 100%; animation:sd-shimmer 1.5s infinite; border-radius:12px;
    }
    @keyframes sd-shimmer { from { background-position:200% 0; } to { background-position:-200% 0; } }

    /* ── Empty ───────────────────────────────────────────────────── */
    .sd-empty { display:flex; flex-direction:column; align-items:center; gap:8px; padding:28px; color:rgba(26,32,53,.35); text-align:center; }
    .sd-empty svg { color:rgba(26,32,53,.22); }
    .sd-empty p { font-size:12.5px; margin:0; }
    .sd-empty-txt { font-size:12px; color:rgba(26,32,53,.4); padding:6px 0; }
    .sd-btn-ghost { display:inline-block; padding:6px 14px; border-radius:18px; border:1.5px solid rgba(20,184,166,.38); color:#14B8A6; font-size:12px; font-weight:600; text-decoration:none; transition:all .2s; margin-top:4px; }
    .sd-btn-ghost:hover { background:rgba(20,184,166,.08); }

    /* ── Animation ───────────────────────────────────────────────── */
    @keyframes sd-in {
      from { opacity:0; transform:translateY(14px); }
      to   { opacity:1; transform:translateY(0); }
    }

    /* ── Responsive ──────────────────────────────────────────────── */
    @media(max-width:1200px) {
      .sd-3col { grid-template-columns:1fr 1fr; }
    }
    @media(max-width:960px) {
      .sd-hero  { grid-template-columns:1fr; }
      .sd-hero-r{ flex-direction:row; }
      .sd-stats { grid-template-columns:repeat(2,1fr); }
      .sd-2col  { grid-template-columns:1fr; }
      .sd-3col  { grid-template-columns:1fr; }
    }
    @media(max-width:600px) {
      .sd-body  { padding:14px 14px 40px; gap:14px; }
      .sd-hd    { padding:11px 14px; flex-wrap:wrap; }
      .sd-hero-r{ flex-direction:column; }
      .sd-search-inp { width:140px; }
    }
  `],
})
export class StudentDashboard implements OnInit {
  loading     = signal(true);
  enrollments = signal<Enrollment[]>([]);
  recs        = signal<Recommendation[]>([]);

  active = computed(() => this.enrollments().filter(e => !e.completed));
  done   = computed(() => this.enrollments().filter(e => e.completed));
  certs  = computed(() => this.enrollments().filter(e => e.completed && e.badgeEarned));

  avgProgress = computed(() => {
    const all = this.enrollments();
    if (!all.length) return 0;
    return Math.round(all.reduce((s, e) => s + e.progress, 0) / all.length);
  });

  xp = computed(() =>
    this.done().length * 150 + Math.round(this.active().reduce((s, e) => s + e.progress, 0))
  );

  level = computed(() => {
    const x = this.xp();
    if (x >= 1500) return 'Expert';
    if (x >= 500)  return 'Intermédiaire';
    return 'Débutant';
  });

  levelPct = computed(() => {
    const x = this.xp();
    if (x >= 1500) return 100;
    if (x >= 500)  return Math.min(100, Math.round((x - 500) / 10));
    return Math.min(100, Math.round(x / 5));
  });

  nextLevelName = computed(() => (this.xp() >= 500 ? 'Expert' : 'Intermédiaire'));

  hero = computed(() => this.active()[0] ?? null);

  recentActivity = computed(() => {
    const acts: { type: string; label: string; sub: string; date: string }[] = [];
    this.done().slice(0, 3).forEach(e =>
      acts.push({ type: 'completed', label: `Cours terminé : ${e.course.title}`, sub: e.course.category, date: e.completedAt ?? '' })
    );
    this.active().slice(0, 3).forEach(e =>
      acts.push({ type: 'progress',  label: `En cours : ${e.course.title}`, sub: `${e.progress}% complété`, date: e.enrolledAt ?? '' })
    );
    return acts.slice(0, 5);
  });

  get firstName()  { return (this.auth.user()?.name ?? 'Apprenant').split(' ')[0]; }
  get userAvatar() { return this.auth.user()?.avatar ?? null; }
  get initials()   {
    const n = this.auth.user()?.name ?? 'A';
    return n.split(' ').map((p: string) => p[0]).slice(0, 2).join('').toUpperCase();
  }

  heroBgStyle(): string {
    const h = this.hero();
    if (!h) return 'background: linear-gradient(135deg,#1a2035,#2d3748)';
    if (h.course.thumbnail) {
      const url = h.course.thumbnail.startsWith('http') ? h.course.thumbnail : '/api' + h.course.thumbnail;
      return `background-image: url('${url}'); background-size: cover; background-position: center;`;
    }
    return `background: ${this.catGradient(h.course.category)}`;
  }

  bgStyle(c: Course): string {
    if (c.thumbnail) {
      const url = c.thumbnail.startsWith('http') ? c.thumbnail : '/api' + c.thumbnail;
      return `background-image: url('${url}'); background-size: cover; background-position: center;`;
    }
    return `background: ${this.catGradient(c.category)}`;
  }

  catGradient(cat: string): string {
    const map: Record<string, string> = {
      'IA':                'linear-gradient(135deg,#667eea,#764ba2)',
      'Data':              'linear-gradient(135deg,#f093fb,#f5576c)',
      'Dev':               'linear-gradient(135deg,#4facfe,#00f2fe)',
      'DevOps':            'linear-gradient(135deg,#43e97b,#38f9d7)',
      'Développement Web': 'linear-gradient(135deg,#4facfe,#00f2fe)',
      'Réseau':            'linear-gradient(135deg,#fa709a,#fee140)',
      'Sécurité':          'linear-gradient(135deg,#f6d365,#fda085)',
      'Cybersécurité':     'linear-gradient(135deg,#f6d365,#fda085)',
      'Cloud':             'linear-gradient(135deg,#a8edea,#fed6e3)',
    };
    return map[cat] ?? 'linear-gradient(135deg,#14B8A6,#0d9488)';
  }

  levelLabel(l: string): string {
    const m: Record<string, string> = { BEGINNER: 'Débutant', INTERMEDIATE: 'Intermédiaire', ADVANCED: 'Avancé' };
    return m[l] ?? l;
  }

  formatDate(d?: string): string {
    if (!d) return '';
    try { return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }); }
    catch { return ''; }
  }

  shortTitle(t: string): string { return t.length > 11 ? t.slice(0, 11) + '…' : t; }

  barGradient(i: number): string {
    return [
      'linear-gradient(90deg,#14B8A6,#5eead4)',
      'linear-gradient(90deg,#8b5cf6,#a78bfa)',
      'linear-gradient(90deg,#f59e0b,#fbbf24)',
      'linear-gradient(90deg,#22C55E,#86efac)',
      'linear-gradient(90deg,#f97316,#fb923c)',
      'linear-gradient(90deg,#ec4899,#f9a8d4)',
    ][i % 6];
  }

  constructor(public auth: AuthService, private api: ApiService) {}

  ngOnInit() {
    this.api.get<Enrollment[]>('/enrollments/me').subscribe({
      next: (res: any) => { this.enrollments.set(res ?? []); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
    this.api.get<any>('/ai/recommend').subscribe({
      next: (res: any) => this.recs.set((res?.recommendations ?? []).slice(0, 4)),
      error: () => {},
    });
  }
}
