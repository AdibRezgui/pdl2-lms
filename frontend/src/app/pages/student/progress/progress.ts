import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth';
import { ApiService } from '../../../core/services/api';
import { Sidebar } from '../../../shared/sidebar/sidebar';

interface Attempt {
  id: string; score: number; passed: boolean;
  quiz: { title: string };
  completedAt: string;
}
interface Enrollment {
  course: { title: string; category: string };
  progress: number; completed: boolean;
}
interface AiAnalysis {
  overallLevel: string;
  averageProgress: number;
  weakAreas: string[];
  strongAreas: string[];
  stalledCourses: string[];
  categoryScores: Record<string, number>;
  recommendations: string[];
}

@Component({
  selector: 'app-student-progress',
  standalone: true,
  imports: [CommonModule, RouterLink, Sidebar],
  template: `
    <div class="shell">
      <app-sidebar [role]="role" [userName]="userName"></app-sidebar>
      <main class="main">

        <!-- Header -->
        <header class="pg-hd">
          <div>
            <h1 class="pg-title">Ma progression</h1>
            <p class="pg-sub">Suivi de vos performances et analyse intelligente</p>
          </div>
          <div class="pg-hd-right" *ngIf="analysis()">
            <div class="level-chip" [class]="'level-' + levelKey()">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
              Niveau IA : {{ analysis()!.overallLevel }}
            </div>
          </div>
        </header>

        <div class="pg-body">

          <!-- Stats row -->
          <div class="stats-row">
            <div class="stat-card stat-teal">
              <div class="stat-ic"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg></div>
              <div><p class="stat-val">{{ enrollments().length }}</p><p class="stat-lbl">Cours inscrits</p></div>
            </div>
            <div class="stat-card stat-green">
              <div class="stat-ic"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg></div>
              <div><p class="stat-val" style="color:#1f9d6f">{{ completedCount() }}</p><p class="stat-lbl">Terminés</p></div>
            </div>
            <div class="stat-card stat-blue">
              <div class="stat-ic"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg></div>
              <div><p class="stat-val" style="color:#0099AE">{{ attempts().length }}</p><p class="stat-lbl">Quiz passés</p></div>
            </div>
            <div class="stat-card stat-amber">
              <div class="stat-ic"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg></div>
              <div><p class="stat-val" style="color:#f5a524">{{ avgScore() }}%</p><p class="stat-lbl">Score moyen</p></div>
            </div>
          </div>

          <!-- Course progress -->
          <div class="card mb-4">
            <h2 class="card-title">Progression par cours</h2>
            <div *ngIf="loading()" class="space-y-3">
              <div *ngFor="let _ of [1,2,3]" class="h-10 rounded-xl skeleton"></div>
            </div>
            <div *ngIf="!loading()" class="courses-list">
              <div *ngFor="let e of enrollments()" class="course-row">
                <div class="course-row-top">
                  <div>
                    <span class="course-name">{{ e.course.title }}</span>
                    <span class="cat-chip">{{ e.course.category }}</span>
                  </div>
                  <span class="pct-badge" [style.color]="e.completed ? '#1f9d6f' : '#0099AE'">{{ e.progress }}%</span>
                </div>
                <div class="progress-track">
                  <div class="progress-fill"
                    [style.width.%]="e.progress"
                    [style.background]="e.completed ? 'linear-gradient(90deg,#6ee7b7,#34d399)' : 'linear-gradient(90deg,#00B4C6,#0099AE)'">
                  </div>
                </div>
              </div>
              <div *ngIf="enrollments().length === 0" class="empty-msg">Aucun cours inscrit</div>
            </div>
          </div>

          <!-- ════ AI ANALYSIS PANEL ════ -->
          <div class="ai-panel" *ngIf="!loading()">
            <div class="ai-panel-head">
              <div class="ai-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><rect x="2" y="8" width="20" height="12" rx="2"/><path d="M12 8V4H8"/><path d="M6 12h.01M12 12h.01M18 12h.01"/></svg>
              </div>
              <div>
                <h2 class="ai-panel-title">Analyse IA de votre apprentissage</h2>
                <p class="ai-panel-sub">Recommandations personnalisées basées sur vos résultats réels</p>
              </div>
              <div class="ai-badge">LIVE</div>
            </div>

            <!-- AI Loading -->
            <div *ngIf="analyzingAI()" class="ai-loading">
              <div class="ai-spinner"></div>
              <span>Analyse en cours…</span>
            </div>

            <!-- AI Results -->
            <ng-container *ngIf="!analyzingAI() && analysis()">

              <!-- Level + Progress -->
              <div class="ai-level-row">
                <div class="ai-level-card" [class]="'ai-level-' + levelKey()">
                  <div class="ai-level-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                  </div>
                  <div>
                    <p class="ai-level-lbl">Niveau détecté</p>
                    <p class="ai-level-val">{{ analysis()!.overallLevel }}</p>
                  </div>
                </div>
                <div class="ai-avg-card">
                  <p class="ai-level-lbl">Progression moyenne</p>
                  <p class="ai-level-val" style="color:#00B4C6">{{ analysis()!.averageProgress }}%</p>
                </div>
              </div>

              <!-- Areas grid -->
              <div class="ai-areas" *ngIf="(analysis()!.weakAreas.length + analysis()!.strongAreas.length) > 0">
                <!-- Weak areas -->
                <div class="area-block" *ngIf="analysis()!.weakAreas.length > 0">
                  <div class="area-header area-weak">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                    Zones à renforcer
                  </div>
                  <div class="area-chips">
                    <span class="chip chip-weak" *ngFor="let a of analysis()!.weakAreas">{{ a }}</span>
                  </div>
                </div>
                <!-- Strong areas -->
                <div class="area-block" *ngIf="analysis()!.strongAreas.length > 0">
                  <div class="area-header area-strong">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
                    Points forts
                  </div>
                  <div class="area-chips">
                    <span class="chip chip-strong" *ngFor="let a of analysis()!.strongAreas">{{ a }}</span>
                  </div>
                </div>
              </div>

              <!-- Category scores -->
              <div class="cat-scores" *ngIf="categoryScoreEntries().length > 0">
                <h3 class="scores-title">Score par domaine</h3>
                <div *ngFor="let entry of categoryScoreEntries()" class="cat-score-row">
                  <span class="cat-name">{{ entry[0] }}</span>
                  <div class="cat-bar-track">
                    <div class="cat-bar-fill"
                      [style.width.%]="entry[1]"
                      [style.background]="entry[1] >= 75 ? 'linear-gradient(90deg,#6ee7b7,#34d399)' : entry[1] >= 60 ? 'linear-gradient(90deg,#00B4C6,#0099AE)' : 'linear-gradient(90deg,#fb92ae,#f25c78)'">
                    </div>
                  </div>
                  <span class="cat-score-pct" [style.color]="entry[1] >= 75 ? '#1f9d6f' : entry[1] >= 60 ? '#0099AE' : '#f25c78'">{{ entry[1] }}%</span>
                </div>
              </div>

              <!-- Adaptive recommendations -->
              <div class="ai-recs">
                <h3 class="recs-title">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
                  Recommandations adaptatives
                </h3>
                <div class="rec-list">
                  <div class="rec-item" *ngFor="let tip of analysis()!.recommendations; let i = index">
                    <div class="rec-num">{{ i + 1 }}</div>
                    <p class="rec-text">{{ tip }}</p>
                  </div>
                </div>
              </div>

              <!-- Stalled courses alert -->
              <div class="stalled-alert" *ngIf="analysis()!.stalledCourses.length > 0">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                <div>
                  <strong>Cours non démarrés :</strong>
                  {{ analysis()!.stalledCourses.join(', ') }}
                </div>
              </div>

            </ng-container>

            <!-- No data yet -->
            <div class="ai-no-data" *ngIf="!analyzingAI() && !analysis()">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(0,180,198,.4)" stroke-width="1.5"><rect x="2" y="8" width="20" height="12" rx="2"/><path d="M12 8V4H8"/></svg>
              <p>Passez vos premiers quiz pour obtenir une analyse personnalisée de votre niveau.</p>
            </div>
          </div>

          <!-- Quiz history -->
          <div class="card">
            <h2 class="card-title">Historique des évaluations</h2>
            <div *ngIf="attempts().length === 0" class="empty-msg">Aucun quiz passé</div>
            <div class="quiz-list">
              <div *ngFor="let a of attempts()" class="quiz-row">
                <div class="quiz-badge" [style.background]="a.passed ? 'linear-gradient(135deg,#6ee7b7,#34d399)' : 'linear-gradient(135deg,#fb92ae,#f25c78)'">
                  <svg *ngIf="a.passed"  width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                  <svg *ngIf="!a.passed" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </div>
                <div class="quiz-info">
                  <p class="quiz-title">{{ a.quiz.title }}</p>
                  <p class="quiz-date">{{ a.completedAt | date:'dd/MM/yyyy' }}</p>
                </div>
                <div class="quiz-score">
                  <p class="quiz-pct" [style.color]="a.passed ? '#1f9d6f' : '#f25c78'">{{ a.score }}%</p>
                  <p class="quiz-status" [style.color]="a.passed ? '#1f9d6f' : '#f25c78'">{{ a.passed ? 'Réussi' : 'Échoué' }}</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  `,
  styles: [`
    .shell { display:flex;height:100vh;overflow:hidden;background:linear-gradient(160deg,#f5fdfe 0%,#edf9fb 60%,#daf2f6 100%); }
    .main  { flex:1;overflow-y:auto; }

    /* Header */
    .pg-hd { display:flex;align-items:center;justify-content:space-between;padding:24px 32px 18px;border-bottom:1px solid rgba(0,180,198,.1);background:rgba(255,253,251,.78);backdrop-filter:blur(20px);position:sticky;top:0;z-index:10; }
    .pg-title { font-family:'Fraunces',Georgia,serif;font-size:22px;font-weight:800;color:#1a2d3a;margin:0; }
    .pg-sub   { font-size:13px;color:#5a7a8a;margin:2px 0 0; }
    .pg-hd-right { display:flex;align-items:center;gap:10px; }
    .level-chip { display:inline-flex;align-items:center;gap:6px;padding:7px 14px;border-radius:999px;font-size:12px;font-weight:700; }
    .level-beginner   { background:rgba(0,180,198,.12);border:1px solid rgba(0,180,198,.25);color:#007A8A; }
    .level-intermediate { background:rgba(245,165,36,.12);border:1px solid rgba(245,165,36,.25);color:#d97706; }
    .level-advanced   { background:rgba(31,157,111,.12);border:1px solid rgba(31,157,111,.25);color:#1f9d6f; }

    .pg-body { padding:24px 32px;display:flex;flex-direction:column;gap:18px; }

    /* Stats */
    .stats-row { display:grid;grid-template-columns:repeat(4,1fr);gap:14px; }
    .stat-card { display:flex;align-items:center;gap:14px;padding:18px;border-radius:18px;background:rgba(255,255,255,.88);border:1px solid rgba(0,180,198,.12);box-shadow:0 2px 10px rgba(0,180,198,.07);transition:transform .2s; }
    .stat-card:hover { transform:translateY(-2px); }
    .stat-ic { width:44px;height:44px;border-radius:13px;display:flex;align-items:center;justify-content:center;flex-shrink:0; }
    .stat-teal  .stat-ic { background:rgba(0,180,198,.12);color:#00B4C6; }
    .stat-green .stat-ic { background:rgba(31,157,111,.12);color:#1f9d6f; }
    .stat-blue  .stat-ic { background:rgba(0,153,174,.12);color:#0099AE; }
    .stat-amber .stat-ic { background:rgba(245,165,36,.12);color:#f5a524; }
    .stat-val { font-family:'Fraunces',Georgia,serif;font-size:28px;font-weight:800;color:#1a2d3a;margin:0;line-height:1; }
    .stat-lbl { font-size:11.5px;color:#5a7a8a;margin:3px 0 0; }

    /* Card */
    .card { background:rgba(255,255,255,.88);border:1px solid rgba(0,180,198,.12);border-radius:20px;padding:22px;box-shadow:0 2px 10px rgba(0,180,198,.06); }
    .card-title { font-family:'Fraunces',Georgia,serif;font-size:15px;font-weight:700;color:#1a2d3a;margin:0 0 16px; }
    .mb-4 { margin-bottom:0; }

    /* Course progress */
    .courses-list { display:flex;flex-direction:column;gap:14px; }
    .course-row { }
    .course-row-top { display:flex;align-items:center;justify-content:space-between;margin-bottom:7px; }
    .course-name { font-size:13.5px;font-weight:600;color:#1a2d3a;margin-right:8px; }
    .cat-chip { font-size:10.5px;padding:2px 9px;border-radius:999px;background:rgba(0,180,198,.12);color:#007A8A;font-weight:600; }
    .pct-badge { font-size:13px;font-weight:700; }
    .progress-track { height:7px;border-radius:7px;background:rgba(0,0,0,.07);overflow:hidden; }
    .progress-fill  { height:100%;border-radius:7px;transition:width 1s cubic-bezier(.16,1,.3,1); }

    /* ══ AI Panel ══════════════════════════════════════════════════════ */
    .ai-panel {
      border-radius:22px;padding:24px;
      background:linear-gradient(160deg,rgba(12,22,40,.93),rgba(18,32,55,.88));
      border:1px solid rgba(0,180,198,.2);
      box-shadow:0 8px 36px rgba(0,0,0,.2);
      position:relative;overflow:hidden;
    }
    .ai-panel::before { content:'';position:absolute;inset:0;background-image:radial-gradient(circle at 1px 1px,rgba(0,180,198,.04) 1px,transparent 0);background-size:24px 24px;pointer-events:none; }
    .ai-panel::after  { content:'';position:absolute;top:-80px;right:-80px;width:220px;height:220px;border-radius:50%;background:radial-gradient(circle,rgba(0,180,198,.14),transparent 70%);pointer-events:none; }

    .ai-panel-head { display:flex;align-items:center;gap:14px;margin-bottom:22px;position:relative;z-index:1; }
    .ai-icon { width:46px;height:46px;border-radius:14px;background:linear-gradient(135deg,#00B4C6,#007A8A);display:flex;align-items:center;justify-content:center;flex-shrink:0;box-shadow:0 6px 18px rgba(0,180,198,.4); }
    .ai-panel-title { font-family:'Fraunces',Georgia,serif;font-size:16px;font-weight:800;color:#e8f4f8;margin:0 0 3px; }
    .ai-panel-sub   { font-size:12px;color:rgba(255,255,255,.38);margin:0; }
    .ai-badge { margin-left:auto;padding:4px 10px;border-radius:999px;background:rgba(0,180,198,.15);border:1px solid rgba(0,180,198,.3);color:#00B4C6;font-size:10px;font-weight:700;letter-spacing:.06em;animation:pulse-badge 2s ease-in-out infinite; }
    @keyframes pulse-badge { 0%,100% { opacity:1; } 50% { opacity:.55; } }

    /* Loading */
    .ai-loading { display:flex;align-items:center;gap:12px;padding:20px;color:rgba(0,180,198,.7);font-size:13px;position:relative;z-index:1; }
    .ai-spinner { width:20px;height:20px;border:2.5px solid rgba(0,180,198,.2);border-top-color:#00B4C6;border-radius:50%;animation:spin .7s linear infinite;flex-shrink:0; }
    @keyframes spin { to { transform:rotate(360deg); } }

    /* Level row */
    .ai-level-row { display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:18px;position:relative;z-index:1; }
    .ai-level-card,.ai-avg-card { display:flex;align-items:center;gap:12px;padding:14px;border-radius:14px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.09); }
    .ai-level-beginner    { border-color:rgba(0,180,198,.3);background:rgba(0,180,198,.08); }
    .ai-level-intermediate{ border-color:rgba(245,165,36,.3);background:rgba(245,165,36,.08); }
    .ai-level-advanced    { border-color:rgba(31,157,111,.3);background:rgba(31,157,111,.08); }
    .ai-level-icon { width:36px;height:36px;border-radius:10px;background:rgba(0,180,198,.15);display:flex;align-items:center;justify-content:center;color:#00B4C6;flex-shrink:0; }
    .ai-level-beginner     .ai-level-icon { color:#00B4C6; }
    .ai-level-intermediate .ai-level-icon { color:#f5a524; }
    .ai-level-advanced     .ai-level-icon { color:#1f9d6f; }
    .ai-level-lbl { font-size:10.5px;color:rgba(255,255,255,.4);margin:0 0 2px; }
    .ai-level-val { font-family:'Fraunces',Georgia,serif;font-size:18px;font-weight:800;color:#e8f4f8;margin:0; }

    /* Areas */
    .ai-areas { display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:18px;position:relative;z-index:1; }
    .area-block { padding:14px;border-radius:14px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08); }
    .area-header { display:flex;align-items:center;gap:6px;font-size:11.5px;font-weight:700;margin-bottom:10px; }
    .area-weak   { color:#f25c78; }
    .area-strong { color:#1f9d6f; }
    .area-chips  { display:flex;flex-wrap:wrap;gap:6px; }
    .chip { padding:4px 10px;border-radius:999px;font-size:11px;font-weight:600; }
    .chip-weak   { background:rgba(242,92,120,.12);border:1px solid rgba(242,92,120,.25);color:#f25c78; }
    .chip-strong { background:rgba(31,157,111,.12);border:1px solid rgba(31,157,111,.25);color:#1f9d6f; }

    /* Category scores */
    .cat-scores { margin-bottom:18px;position:relative;z-index:1; }
    .scores-title { font-size:12px;font-weight:700;color:rgba(255,255,255,.5);text-transform:uppercase;letter-spacing:.06em;margin:0 0 12px; }
    .cat-score-row { display:flex;align-items:center;gap:10px;margin-bottom:8px; }
    .cat-name { font-size:12px;color:rgba(255,255,255,.6);min-width:90px;font-weight:500; }
    .cat-bar-track { flex:1;height:6px;border-radius:6px;background:rgba(255,255,255,.08);overflow:hidden; }
    .cat-bar-fill { height:100%;border-radius:6px;transition:width 1.2s cubic-bezier(.16,1,.3,1); }
    .cat-score-pct { font-size:11.5px;font-weight:700;min-width:34px;text-align:right; }

    /* Recommendations */
    .ai-recs { position:relative;z-index:1; }
    .recs-title { display:flex;align-items:center;gap:7px;font-size:12px;font-weight:700;color:rgba(255,255,255,.5);text-transform:uppercase;letter-spacing:.06em;margin:0 0 12px; }
    .rec-list { display:flex;flex-direction:column;gap:9px; }
    .rec-item { display:flex;align-items:flex-start;gap:10px;padding:12px;border-radius:13px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08); }
    .rec-num  { width:22px;height:22px;border-radius:7px;background:rgba(0,180,198,.18);border:1px solid rgba(0,180,198,.28);color:#00B4C6;font-size:11px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0; }
    .rec-text { font-size:12.5px;color:rgba(255,255,255,.7);margin:0;line-height:1.55; }

    /* Stalled alert */
    .stalled-alert { display:flex;align-items:flex-start;gap:10px;padding:12px 14px;border-radius:13px;background:rgba(245,165,36,.06);border:1px solid rgba(245,165,36,.18);color:rgba(245,165,36,.8);font-size:12.5px;margin-top:14px;position:relative;z-index:1; }
    .stalled-alert strong { color:#f5a524; }

    /* No data */
    .ai-no-data { display:flex;flex-direction:column;align-items:center;gap:10px;padding:28px;text-align:center;position:relative;z-index:1; }
    .ai-no-data p { font-size:13px;color:rgba(255,255,255,.35);margin:0;max-width:320px; }

    /* Quiz history */
    .quiz-list { display:flex;flex-direction:column;gap:10px; }
    .quiz-row  { display:flex;align-items:center;gap:14px;padding:13px;border-radius:15px;background:rgba(0,180,198,.04);border:1px solid rgba(0,180,198,.1);transition:all .2s; }
    .quiz-row:hover { border-color:rgba(0,180,198,.25);background:rgba(0,180,198,.08); }
    .quiz-badge { width:38px;height:38px;border-radius:12px;display:flex;align-items:center;justify-content:center;flex-shrink:0; }
    .quiz-info  { flex:1; }
    .quiz-title { font-size:13px;font-weight:600;color:#1a2d3a;margin:0 0 2px; }
    .quiz-date  { font-size:11px;color:#5a7a8a;margin:0; }
    .quiz-score { text-align:right; }
    .quiz-pct   { font-size:15px;font-weight:800;margin:0;font-family:'Fraunces',Georgia,serif; }
    .quiz-status{ font-size:10.5px;font-weight:600;margin:0; }

    /* Utils */
    .empty-msg { text-align:center;padding:28px;font-size:13px;color:#5a7a8a; }
    .skeleton  { background:linear-gradient(90deg,rgba(0,180,198,.08) 25%,rgba(0,180,198,.15) 50%,rgba(0,180,198,.08) 75%);background-size:200% 100%;animation:shimmer 1.5s infinite;border-radius:12px; }
    @keyframes shimmer { to { background-position:-200% 0; } }
    .space-y-3 > * + * { margin-top:12px; }
    .h-10 { height:40px; }
  `],
})
export class StudentProgress implements OnInit {
  loading     = signal(true);
  analyzingAI = signal(true);
  enrollments = signal<Enrollment[]>([]);
  attempts    = signal<Attempt[]>([]);
  analysis    = signal<AiAnalysis | null>(null);

  get role()     { return this.auth.user()?.role ?? 'STUDENT'; }
  get userName() { return this.auth.user()?.name ?? ''; }

  completedCount = computed(() => this.enrollments().filter(e => e.completed).length);
  avgScore = computed(() => {
    const a = this.attempts();
    if (!a.length) return 0;
    return Math.round(a.reduce((s, x) => s + x.score, 0) / a.length);
  });

  levelKey = computed(() => {
    const lvl = this.analysis()?.overallLevel ?? '';
    if (lvl === 'Avancé') return 'advanced';
    if (lvl === 'Intermédiaire') return 'intermediate';
    return 'beginner';
  });

  categoryScoreEntries = computed(() => {
    const scores = this.analysis()?.categoryScores ?? {};
    return Object.entries(scores).sort((a, b) => b[1] - a[1]);
  });

  constructor(private auth: AuthService, private api: ApiService) {}

  ngOnInit() {
    this.api.get<Enrollment[]>('/enrollments/me').subscribe({
      next: data => { this.enrollments.set(data ?? []); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
    this.api.get<Attempt[]>('/quizzes/attempts/me').subscribe({
      next: data => this.attempts.set(data ?? []),
      error: () => {},
    });
    this.api.get<AiAnalysis>('/ai/analyze').subscribe({
      next: data => {
        if (data && (data.weakAreas || data.strongAreas || data.recommendations)) {
          this.analysis.set(data);
        }
        this.analyzingAI.set(false);
      },
      error: () => this.analyzingAI.set(false),
    });
  }
}
