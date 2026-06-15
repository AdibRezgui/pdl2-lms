import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth';
import { ApiService } from '../../../core/services/api';
import { ToastService } from '../../../core/services/toast';
import { Sidebar } from '../../../shared/sidebar/sidebar';
import { AnimatedTextComponent } from '../../../shared/animated-text/animated-text';

interface Course {
  id: string; title: string; description: string; category: string;
  level: string; price: number; rating?: number; enrollmentCount?: number;
  trainerName?: string; thumbnail?: string; published: boolean;
}
interface Enrollment { id: string; course: Course; progress: number; completed: boolean }

const CAT_GRADIENTS: [string, string][] = [
  ['Programm', 'linear-gradient(160deg,#0f0c29 0%,#302b63 60%,#24243e 100%)'],
  ['Design',   'linear-gradient(160deg,#4e0080 0%,#a62d82 60%,#fc466b 100%)'],
  ['Market',   'linear-gradient(160deg,#c94b4b 0%,#4b134f 100%)'],
  ['Data',     'linear-gradient(160deg,#0f2027 0%,#203a43 60%,#24243e 100%)'],
  ['DevOps',   'linear-gradient(160deg,#003973 0%,#e5e5be 100%)'],
  ['Réseau',   'linear-gradient(160deg,#005c97 0%,#363795 100%)'],
  ['Sécurité', 'linear-gradient(160deg,#200122 0%,#6f0000 100%)'],
];
const DEFAULT_GRAD = 'linear-gradient(160deg,#1a2d3a 0%,#007A8A 100%)';

const LEVEL_COLORS: Record<string, string> = {
  BEGINNER:     'rgba(52,211,153,0.9)',
  INTERMEDIATE: 'rgba(251,191,36,0.9)',
  ADVANCED:     'rgba(239,68,68,0.9)',
};

const LEVEL_LABELS: Record<string, string> = {
  BEGINNER:     'Débutant',
  INTERMEDIATE: 'Intermédiaire',
  ADVANCED:     'Avancé',
};

@Component({
  selector: 'app-student-courses',
  standalone: true,
  imports: [CommonModule, FormsModule, Sidebar, AnimatedTextComponent],
  template: `
    <div class="shell">
      <app-sidebar [role]="role" [userName]="userName" />

      <main class="main-area">

        <!-- ── Page header ── -->
        <header class="page-header">
          <app-animated-text
            prefix="Catalogue "
            name="des Cours"
            [subtitle]="allCourses().length + ' cours disponibles · ' + enrollments().length + ' inscrits'" />

          <div class="search-row">
            <div class="search-wrap">
              <svg class="search-ico" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input [(ngModel)]="search" placeholder="Rechercher un cours…" class="search-input" />
            </div>
          </div>
        </header>

        <!-- ── Category pills ── -->
        <div class="cat-scroll">
          <button (click)="categoryFilter=''" [class.cat-active]="categoryFilter===''" class="cat-pill">Toutes</button>
          <button *ngFor="let c of categories()"
                  (click)="categoryFilter=c" [class.cat-active]="categoryFilter===c"
                  class="cat-pill">{{ c }}</button>
        </div>

        <!-- ── Tabs ── -->
        <div class="tabs-row">
          <button (click)="tab='all'"      [class.tab-on]="tab==='all'"      class="tab-btn">Tous les cours</button>
          <button (click)="tab='enrolled'" [class.tab-on]="tab==='enrolled'" class="tab-btn">
            Mes cours
            <span *ngIf="enrollments().length > 0" class="tab-badge">{{ enrollments().length }}</span>
          </button>
        </div>

        <div class="gc-sections">

          <!-- ── Loading skeletons ── -->
          <div *ngIf="loading()" class="gc-tall-grid">
            <div *ngFor="let _ of [1,2,3,4,5,6,7,8]" class="gc-skeleton"></div>
          </div>

          <!-- ── Continue learning: accordion ── -->
          <section *ngIf="!loading() && tab==='all' && enrolledInProgress().length > 0" class="gc-section">
            <div class="strip-head">
              <span class="strip-label">
                <span class="strip-dot"></span>
                Continuer l'apprentissage
              </span>
            </div>
            <div class="cont-wrap">
              <div class="cont-row">
                <div *ngFor="let e of enrolledInProgress(); let i = index"
                     class="cont-panel"
                     [class.cont-active]="activeContinueIndex() === i"
                     (mouseenter)="activeContinueIndex.set(i)">

                  <div class="cont-bg" [style]="bgStyle(e.course)"></div>
                  <div class="cont-overlay"></div>

                  <!-- Collapsed rotated label -->
                  <span class="cont-label">{{ e.course.title }}</span>

                  <!-- Completed badge -->
                  <div *ngIf="e.completed" class="gc-done-badge">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
                    Terminé
                  </div>

                  <!-- Expanded content -->
                  <div class="cont-content">
                    <span class="cont-chip">{{ e.course.category }}</span>
                    <p class="cont-title">{{ e.course.title }}</p>
                    <div class="cont-author">
                      <div class="gc-av" [style.background]="avatarBg(e.course.category)">{{ (e.course.trainerName || 'F').charAt(0).toUpperCase() }}</div>
                      <span class="cont-aname">{{ e.course.trainerName || 'Formateur' }}</span>
                    </div>
                    <div class="cont-prog-wrap">
                      <div class="cont-prog-head">
                        <span class="cont-prog-lbl">Progression</span>
                        <span class="cont-prog-pct">{{ e.progress }}%</span>
                      </div>
                      <div class="cont-prog"><div class="cont-prog-fill" [style.width.%]="e.progress"></div></div>
                    </div>
                    <button class="cont-btn" (click)="$event.stopPropagation(); goLearn(e.course.id)">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                      {{ e.progress > 0 ? 'Continuer' : 'Commencer' }}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <!-- ── Main display ── -->
          <section *ngIf="!loading()" class="gc-section">
            <div class="strip-head">
              <span class="strip-label">
                {{ tab === 'enrolled' ? 'Mes cours inscrits' : (categoryFilter || 'Tous les cours') }}
                <span class="strip-count">{{ tab === 'enrolled' ? filteredEnrollments().length : filtered().length }}</span>
              </span>
            </div>

            <!-- Empty state -->
            <div *ngIf="(tab === 'enrolled' ? filteredEnrollments().length : filtered().length) === 0" class="empty-state">
              <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="rgba(0,180,198,0.35)" stroke-width="1.5">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <p>Aucun cours trouvé</p>
            </div>

            <!-- ── TOUS: tall image cards with slide-up reveal ── -->
            <div class="gc-tall-grid" *ngIf="tab === 'all' && filtered().length > 0">
              <div *ngFor="let c of filtered(); let i = index"
                   class="gc-tall-card"
                   [style.animation-delay]="(i * 40) + 'ms'"
                   (click)="onCardAction(c)">

                <!-- BG image -->
                <div class="gc-tall-bg" [style]="bgStyle(c)"></div>
                <!-- Persistent overlay -->
                <div class="gc-tall-overlay"></div>

                <!-- Top-left: category chip -->
                <div class="gc-tall-top">
                  <span class="gc-tall-cat">{{ c.category }}</span>
                  <span *ngIf="c.level" class="gc-tall-lvl" [style.background]="levelColor(c.level)">{{ formatLevel(c.level) }}</span>
                </div>

                <!-- Completed badge -->
                <div *ngIf="getEnrollment(c.id)?.completed" class="gc-done-badge">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
                  Terminé
                </div>

                <!-- Slide-up panel -->
                <div class="gc-tall-panel">
                  <!-- Always visible area (bottom 72px) -->
                  <div class="gc-tall-static">
                    <p class="gc-tall-title-s">{{ c.title }}</p>
                  </div>

                  <!-- Reveal section (hidden by default, revealed on hover) -->
                  <div class="gc-tall-reveal">
                    <p class="gc-tall-desc">{{ c.description }}</p>

                    <div class="gc-tall-author">
                      <div class="gc-av" [style.background]="avatarBg(c.category)">{{ (c.trainerName || 'F').charAt(0).toUpperCase() }}</div>
                      <div>
                        <div class="gc-tall-aname">{{ c.trainerName || 'Formateur' }}</div>
                        <div class="gc-tall-asub">{{ c.enrollmentCount || 0 }} apprenants</div>
                      </div>
                    </div>

                    <button class="gc-tall-action"
                            [class.gc-tall-enrolled]="!!getEnrollment(c.id)"
                            [class.gc-tall-loading]="enrolling() === c.id"
                            (click)="onCardAction(c); $event.stopPropagation()">
                      <svg *ngIf="enrolling() === c.id" class="gc-spin" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                      <svg *ngIf="enrolling() !== c.id && !!getEnrollment(c.id)" width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                      <svg *ngIf="enrolling() !== c.id && !getEnrollment(c.id)" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                      {{ enrolling() === c.id ? 'Inscription…' : getActionLabel(c) }}
                    </button>

                    <!-- Enrollment progress bar -->
                    <div class="gc-tall-progress" *ngIf="getEnrollment(c.id)">
                      <div class="gc-tall-fill" [style.width.%]="getEnrollment(c.id)!.progress"></div>
                      <span class="gc-tall-pct">{{ getEnrollment(c.id)!.progress }}%</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            <!-- ── MES COURS: enrolled accordion ── -->
            <div *ngIf="tab === 'enrolled' && filteredEnrollments().length > 0" class="enr-wrap">
              <div class="enr-row">
                <div *ngFor="let e of filteredEnrollments(); let i = index"
                     class="enr-panel"
                     [class.enr-active]="activeEnrollIndex() === i"
                     (mouseenter)="activeEnrollIndex.set(i)">

                  <div class="enr-bg" [style]="bgStyle(e.course)"></div>
                  <div class="enr-overlay"></div>

                  <!-- Collapsed label -->
                  <span class="enr-label">{{ e.course.title }}</span>

                  <!-- Category chip (active only) -->
                  <div class="enr-chips">
                    <span class="enr-chip-cat">{{ e.course.category }}</span>
                    <span *ngIf="e.course.level" class="enr-chip-lvl" [style.background]="levelColor(e.course.level)">{{ formatLevel(e.course.level) }}</span>
                  </div>

                  <!-- Completed badge -->
                  <div *ngIf="e.completed" class="gc-done-badge">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
                    Terminé
                  </div>

                  <!-- Expanded content -->
                  <div class="enr-content">
                    <p class="enr-title">{{ e.course.title }}</p>
                    <p class="enr-desc">{{ e.course.description }}</p>

                    <div class="enr-author">
                      <div class="gc-av" [style.background]="avatarBg(e.course.category)">{{ (e.course.trainerName || 'F').charAt(0).toUpperCase() }}</div>
                      <div>
                        <div class="enr-aname">{{ e.course.trainerName || 'Formateur' }}</div>
                        <div class="enr-asub">{{ e.course.enrollmentCount || 0 }} apprenants</div>
                      </div>
                    </div>

                    <!-- Progress bar -->
                    <div class="enr-prog-wrap">
                      <div class="enr-prog-head">
                        <span class="enr-prog-label">Progression</span>
                        <span class="enr-prog-pct">{{ e.progress }}%</span>
                      </div>
                      <div class="enr-prog">
                        <div class="enr-prog-fill" [style.width.%]="e.progress"></div>
                      </div>
                    </div>

                    <button class="enr-btn" (click)="$event.stopPropagation(); goLearn(e.course.id)">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                      {{ e.progress > 0 ? 'Continuer' : 'Commencer' }}
                    </button>
                  </div>
                </div>
              </div>
            </div>

          </section>
        </div>
      </main>
    </div>
  `,
  styles: [`
    /* ── Shell ── */
    .shell { display:flex; height:100vh; overflow:hidden; background:linear-gradient(160deg,#f0fbfd 0%,#e8f8fb 60%,#d6f2f7 100%); }
    .main-area { flex:1; overflow-y:auto; display:flex; flex-direction:column; }

    /* ── Header ── */
    .page-header { display:flex; align-items:flex-start; justify-content:space-between; padding:26px 30px 0; flex-wrap:wrap; gap:16px; }
    .search-row { display:flex; gap:10px; align-items:center; }
    .search-wrap { position:relative; display:flex; align-items:center; }
    .search-ico { position:absolute; left:12px; color:#7a9aaa; pointer-events:none; }
    .search-input { padding:10px 14px 10px 34px; border:1.5px solid rgba(0,180,198,.2); border-radius:14px; background:rgba(255,255,255,.85); backdrop-filter:blur(8px); font-size:13px; font-family:inherit; color:#1a2d3a; width:240px; transition:border-color .2s,box-shadow .2s; }
    .search-input:focus { outline:none; border-color:rgba(0,180,198,.5); box-shadow:0 0 0 4px rgba(0,180,198,.08); }
    .search-input::placeholder { color:#7a9aaa; }

    /* ── Category pills ── */
    .cat-scroll { display:flex; gap:8px; padding:16px 30px 0; overflow-x:auto; scrollbar-width:none; flex-wrap:nowrap; }
    .cat-scroll::-webkit-scrollbar { display:none; }
    .cat-pill { flex-shrink:0; padding:7px 16px; border-radius:999px; border:1.5px solid rgba(0,180,198,.2); background:rgba(255,255,255,.8); color:#5a7a8a; font-size:12.5px; font-weight:600; cursor:pointer; font-family:inherit; transition:all .22s cubic-bezier(.16,1,.3,1); }
    .cat-pill:hover { border-color:rgba(0,180,198,.45); color:#007A8A; }
    .cat-active { background:linear-gradient(135deg,#00B4C6,#007A8A) !important; border-color:transparent !important; color:#fff !important; box-shadow:0 6px 18px rgba(0,180,198,.35); }

    /* ── Tabs ── */
    .tabs-row { display:flex; gap:6px; padding:16px 30px 0; width:fit-content; }
    .tab-btn { display:flex; align-items:center; gap:6px; padding:9px 20px; border-radius:12px; border:1.5px solid rgba(0,180,198,.15); background:rgba(255,255,255,.7); color:#5a7a8a; font-size:13px; font-weight:600; cursor:pointer; font-family:inherit; transition:all .25s cubic-bezier(.16,1,.3,1); }
    .tab-btn:hover { color:#1a2d3a; border-color:rgba(0,180,198,.35); }
    .tab-on { background:linear-gradient(135deg,#00B4C6,#007A8A) !important; border-color:transparent !important; color:#fff !important; box-shadow:0 6px 18px rgba(0,180,198,.3); }
    .tab-badge { display:inline-flex; align-items:center; justify-content:center; min-width:18px; height:18px; border-radius:999px; background:rgba(0,180,198,.2); color:#007A8A; font-size:10px; font-weight:700; padding:0 5px; }
    .tab-on .tab-badge { background:rgba(255,255,255,.3); color:#fff; }

    /* ── Sections ── */
    .gc-sections { display:flex; flex-direction:column; gap:20px; padding:22px 30px 36px; }
    .gc-section { display:flex; flex-direction:column; gap:16px; }
    .strip-head { display:flex; align-items:center; justify-content:space-between; }
    .strip-label { display:flex; align-items:center; gap:8px; font-family:'Fraunces',Georgia,serif; font-size:16px; font-weight:700; color:#1a2d3a; }
    .strip-dot { width:9px; height:9px; border-radius:50%; background:linear-gradient(135deg,#00B4C6,#007A8A); box-shadow:0 0 8px rgba(0,180,198,.5); animation:dot-pulse 2s ease-in-out infinite; }
    @keyframes dot-pulse { 0%,100%{box-shadow:0 0 8px rgba(0,180,198,.5)} 50%{box-shadow:0 0 18px rgba(0,180,198,.8)} }
    .strip-count { font-size:12px; font-weight:700; color:#fff; background:linear-gradient(135deg,#00B4C6,#007A8A); padding:2px 8px; border-radius:999px; }

    /* ── TALL CARDS (Tous les cours) ── */
    .gc-tall-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(240px,1fr)); gap:14px; }
    .gc-tall-card { position:relative; height:310px; border-radius:22px; overflow:hidden; cursor:pointer; animation:gc-in .4s both; }
    @keyframes gc-in { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:none} }
    .gc-tall-card:hover .gc-tall-bg { transform:scale(1.07); }
    .gc-tall-bg { position:absolute; inset:0; background-size:cover; background-position:center; transition:transform 550ms cubic-bezier(.16,1,.3,1); }
    .gc-tall-overlay { position:absolute; inset:0; background:linear-gradient(to top,rgba(0,0,0,.9) 0%,rgba(0,0,0,.4) 50%,rgba(0,0,0,.08) 100%); }

    /* Top chips */
    .gc-tall-top { position:absolute; top:12px; left:12px; z-index:3; display:flex; gap:5px; }
    .gc-tall-cat { font-size:10px; font-weight:700; padding:3px 9px; border-radius:999px; background:rgba(0,180,198,.82); backdrop-filter:blur(6px); color:#fff; }
    .gc-tall-lvl { font-size:10px; font-weight:700; padding:3px 9px; border-radius:999px; color:#fff; }

    /* Slide-up panel */
    .gc-tall-panel {
      position:absolute; left:0; right:0; bottom:0;
      display:flex; flex-direction:column;
      transform:translateY(calc(100% - 72px));
      transition:transform 420ms cubic-bezier(.16,1,.3,1);
      background:linear-gradient(to top,rgba(0,0,0,.97) 55%,transparent 100%);
      z-index:4;
    }
    .gc-tall-card:hover .gc-tall-panel { transform:translateY(0); }

    /* Always-visible strip (bottom 72px) */
    .gc-tall-static { padding:14px 14px 14px; }
    .gc-tall-title-s { font-family:'Fraunces',Georgia,serif; font-size:14px; font-weight:700; color:#fff; line-height:1.3; margin:0; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }

    /* Hidden reveal content */
    .gc-tall-reveal { padding:0 14px 16px; display:flex; flex-direction:column; gap:9px; opacity:0; transition:opacity 300ms 80ms; pointer-events:none; }
    .gc-tall-card:hover .gc-tall-reveal { opacity:1; pointer-events:all; }
    .gc-tall-desc { font-size:12px; color:rgba(255,255,255,.72); line-height:1.5; margin:0; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
    .gc-tall-author { display:flex; align-items:center; gap:8px; }
    .gc-av { width:30px; height:30px; border-radius:50%; flex-shrink:0; display:flex; align-items:center; justify-content:center; font-size:11px; font-weight:800; color:#fff; border:1.5px solid rgba(255,255,255,.4); }
    .gc-tall-aname { font-size:12px; font-weight:700; color:#fff; }
    .gc-tall-asub { font-size:10px; color:rgba(255,255,255,.6); }
    .gc-tall-action {
      display:inline-flex; align-items:center; gap:6px;
      padding:8px 16px; border-radius:12px; border:none;
      background:linear-gradient(135deg,#00B4C6,#007A8A);
      color:#fff; font-size:12px; font-weight:700;
      cursor:pointer; font-family:inherit;
      box-shadow:0 3px 12px rgba(0,180,198,.4);
      transition:all .22s; width:fit-content;
    }
    .gc-tall-action:hover { box-shadow:0 5px 20px rgba(0,180,198,.6); transform:translateY(-1px); }
    .gc-tall-enrolled { background:rgba(255,255,255,.9) !important; color:#007A8A !important; box-shadow:0 3px 12px rgba(0,0,0,.2) !important; }
    .gc-tall-loading { opacity:.7; pointer-events:none; }
    .gc-tall-progress { display:flex; align-items:center; gap:8px; }
    .gc-tall-fill { flex:1; height:3px; background:linear-gradient(90deg,#00B4C6,#34d399); border-radius:999px; box-shadow:0 0 6px rgba(0,180,198,.7); }
    .gc-tall-pct { font-size:10px; font-weight:700; color:#34d399; flex-shrink:0; }

    /* ── ENROLLED ACCORDION ── */
    .enr-wrap { overflow-x:auto; padding-bottom:12px; }
    .enr-row { display:flex; flex-direction:row; gap:10px; min-width:max-content; align-items:stretch; }

    .enr-panel {
      position:relative; width:72px; height:460px;
      border-radius:24px; overflow:hidden; cursor:pointer; flex-shrink:0;
      transition:width 700ms cubic-bezier(.16,1,.3,1), box-shadow 400ms;
      box-shadow:0 4px 18px rgba(0,0,0,.2);
    }
    .enr-panel:hover { box-shadow:0 8px 36px rgba(0,0,0,.3); }
    .enr-active { width:380px; }

    .enr-bg { position:absolute; inset:0; background-size:cover; background-position:center; transition:transform 700ms cubic-bezier(.16,1,.3,1); }
    .enr-active .enr-bg { transform:scale(1.05); }
    .enr-overlay { position:absolute; inset:0; background:linear-gradient(to top,rgba(0,0,0,.94) 0%,rgba(0,0,0,.5) 45%,rgba(0,0,0,.12) 75%,transparent 100%); }

    .enr-label { position:absolute; left:50%; bottom:110px; z-index:3; transform:translateX(-50%) rotate(90deg); color:#fff; font-size:12px; font-weight:700; white-space:nowrap; font-family:'Fraunces',Georgia,serif; text-shadow:0 1px 8px rgba(0,0,0,.8); transition:opacity 280ms; pointer-events:none; }
    .enr-active .enr-label { opacity:0; }

    .enr-chips { position:absolute; top:14px; left:14px; right:14px; z-index:3; display:flex; gap:5px; flex-wrap:wrap; opacity:0; transition:opacity 300ms 200ms; pointer-events:none; }
    .enr-active .enr-chips { opacity:1; }
    .enr-chip-cat { font-size:10px; font-weight:700; padding:3px 9px; border-radius:999px; background:rgba(0,180,198,.45); border:1px solid rgba(255,255,255,.3); backdrop-filter:blur(8px); color:#fff; white-space:nowrap; }
    .enr-chip-lvl { font-size:10px; font-weight:700; padding:3px 9px; border-radius:999px; border:1px solid rgba(255,255,255,.3); backdrop-filter:blur(8px); color:#fff; white-space:nowrap; }

    .enr-content { position:absolute; bottom:0; left:0; right:0; padding:16px 18px 20px; z-index:4; display:flex; flex-direction:column; gap:10px; opacity:0; transform:translateY(18px); transition:opacity 360ms 160ms,transform 360ms 160ms; pointer-events:none; }
    .enr-active .enr-content { opacity:1; transform:none; pointer-events:all; }

    .enr-title { font-family:'Fraunces',Georgia,serif; font-size:16px; font-weight:800; color:#fff; line-height:1.3; margin:0; }
    .enr-desc { font-size:12px; color:rgba(255,255,255,.7); line-height:1.5; margin:0; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
    .enr-author { display:flex; align-items:center; gap:9px; }
    .enr-aname { font-size:12px; font-weight:700; color:#fff; }
    .enr-asub { font-size:10px; color:rgba(255,255,255,.6); }

    .enr-prog-wrap { display:flex; flex-direction:column; gap:5px; }
    .enr-prog-head { display:flex; align-items:center; justify-content:space-between; }
    .enr-prog-label { font-size:11px; color:rgba(255,255,255,.7); font-weight:600; }
    .enr-prog-pct { font-size:11px; font-weight:700; color:#34d399; }
    .enr-prog { height:4px; background:rgba(255,255,255,.15); border-radius:999px; overflow:hidden; }
    .enr-prog-fill { height:100%; background:linear-gradient(90deg,#00B4C6,#34d399); border-radius:999px; transition:width .6s cubic-bezier(.16,1,.3,1); box-shadow:0 0 6px rgba(0,180,198,.6); }

    .enr-btn {
      display:inline-flex; align-items:center; gap:6px;
      padding:9px 18px; border-radius:14px; border:none;
      background:linear-gradient(135deg,#00B4C6,#007A8A);
      color:#fff; font-size:13px; font-weight:700;
      cursor:pointer; font-family:inherit; width:fit-content;
      box-shadow:0 3px 14px rgba(0,180,198,.4);
      transition:all .22s;
    }
    .enr-btn:hover { box-shadow:0 5px 20px rgba(0,180,198,.6); transform:translateY(-1px); }

    /* ── CONTINUE LEARNING ACCORDION ── */
    .cont-wrap { overflow-x:auto; padding-bottom:8px; }
    .cont-row { display:flex; flex-direction:row; gap:10px; min-width:max-content; align-items:stretch; }
    .cont-panel {
      position:relative; width:68px; height:260px;
      border-radius:22px; overflow:hidden; cursor:pointer; flex-shrink:0;
      transition:width 700ms cubic-bezier(.16,1,.3,1), box-shadow 400ms;
      box-shadow:0 4px 16px rgba(0,0,0,.18);
    }
    .cont-panel:hover { box-shadow:0 8px 32px rgba(0,0,0,.26); }
    .cont-active { width:340px; }
    .cont-bg { position:absolute; inset:0; background-size:cover; background-position:center; transition:transform 700ms cubic-bezier(.16,1,.3,1); }
    .cont-active .cont-bg { transform:scale(1.05); }
    .cont-overlay { position:absolute; inset:0; background:linear-gradient(to top,rgba(0,0,0,.92) 0%,rgba(0,0,0,.5) 45%,rgba(0,0,0,.1) 75%,transparent 100%); }
    .cont-label { position:absolute; left:50%; bottom:80px; z-index:3; transform:translateX(-50%) rotate(90deg); color:#fff; font-size:11px; font-weight:700; white-space:nowrap; font-family:'Fraunces',Georgia,serif; text-shadow:0 1px 8px rgba(0,0,0,.8); transition:opacity 280ms; pointer-events:none; }
    .cont-active .cont-label { opacity:0; }
    .cont-content { position:absolute; bottom:0; left:0; right:0; padding:14px 16px 16px; z-index:4; display:flex; flex-direction:column; gap:8px; opacity:0; transform:translateY(16px); transition:opacity 340ms 150ms,transform 340ms 150ms; pointer-events:none; }
    .cont-active .cont-content { opacity:1; transform:none; pointer-events:all; }
    .cont-chip { font-size:10px; font-weight:700; padding:3px 9px; border-radius:999px; background:rgba(0,180,198,.45); border:1px solid rgba(255,255,255,.3); backdrop-filter:blur(8px); color:#fff; width:fit-content; }
    .cont-title { font-family:'Fraunces',Georgia,serif; font-size:15px; font-weight:800; color:#fff; line-height:1.3; margin:0; }
    .cont-author { display:flex; align-items:center; gap:8px; }
    .cont-aname { font-size:12px; font-weight:700; color:rgba(255,255,255,.85); }
    .cont-prog-wrap { display:flex; flex-direction:column; gap:4px; }
    .cont-prog-head { display:flex; align-items:center; justify-content:space-between; }
    .cont-prog-lbl { font-size:10px; color:rgba(255,255,255,.65); font-weight:600; }
    .cont-prog-pct { font-size:10px; font-weight:700; color:#34d399; }
    .cont-prog { height:3px; background:rgba(255,255,255,.15); border-radius:999px; overflow:hidden; }
    .cont-prog-fill { height:100%; background:linear-gradient(90deg,#00B4C6,#34d399); border-radius:999px; transition:width .6s cubic-bezier(.16,1,.3,1); box-shadow:0 0 5px rgba(0,180,198,.6); }
    .cont-btn { display:inline-flex; align-items:center; gap:6px; padding:7px 14px; border-radius:11px; border:none; background:rgba(255,255,255,.92); color:#007A8A; font-size:12px; font-weight:700; cursor:pointer; font-family:inherit; width:fit-content; box-shadow:0 2px 8px rgba(0,0,0,.18); transition:all .2s; }
    .cont-btn:hover { background:#fff; box-shadow:0 4px 14px rgba(0,0,0,.25); transform:translateY(-1px); }

    /* ── Skeletons & empty ── */
    .gc-skeleton { border-radius:22px; height:310px; background:linear-gradient(90deg,rgba(0,180,198,.06) 25%,rgba(0,180,198,.12) 50%,rgba(0,180,198,.06) 75%); background-size:200% 100%; animation:skel 1.4s linear infinite; }
    @keyframes skel { to { background-position:-200% 0; } }
    .empty-state { display:flex; flex-direction:column; align-items:center; justify-content:center; gap:12px; padding:56px 0; }
    .empty-state p { font-size:14px; font-weight:600; color:#5a7a8a; margin:0; }

    .gc-done-badge { position:absolute; top:10px; right:10px; z-index:5; display:flex; align-items:center; gap:4px; font-size:10px; font-weight:700; color:#fff; background:rgba(52,211,153,.92); padding:3px 9px; border-radius:999px; backdrop-filter:blur(4px); }

    .gc-spin { animation:gc-spin .8s linear infinite; }
    @keyframes gc-spin { to { transform:rotate(360deg); } }
  `],
})
export class StudentCourses implements OnInit {

  loading   = signal(true);
  enrolling = signal<string | null>(null);
  allCourses  = signal<Course[]>([]);
  enrollments = signal<Enrollment[]>([]);
  activeEnrollIndex   = signal(0);
  activeContinueIndex = signal(0);
  search         = '';
  tab            = 'all';
  categoryFilter = '';

  get role()     { return this.auth.user()?.role ?? 'STUDENT'; }
  get userName() { return this.auth.user()?.name ?? ''; }

  categories = computed(() =>
    [...new Set(this.allCourses().map(c => c.category).filter(Boolean))].sort()
  );

  enrolledInProgress = computed(() =>
    this.enrollments().filter(e => !e.completed)
  );

  filtered = computed(() => {
    let list = this.allCourses();
    if (this.search) {
      const s = this.search.toLowerCase();
      list = list.filter(c => c.title.toLowerCase().includes(s) || c.category?.toLowerCase().includes(s));
    }
    if (this.categoryFilter) list = list.filter(c => c.category === this.categoryFilter);
    return list;
  });

  filteredEnrollments = computed(() => {
    let list = this.enrollments();
    if (this.search) {
      const s = this.search.toLowerCase();
      list = list.filter(e => e.course.title.toLowerCase().includes(s) || e.course.category?.toLowerCase().includes(s));
    }
    if (this.categoryFilter) list = list.filter(e => e.course.category === this.categoryFilter);
    return list;
  });

  getEnrollment(courseId: string) {
    return this.enrollments().find(e => e.course.id === courseId);
  }

  constructor(
    private auth:   AuthService,
    private api:    ApiService,
    private toast:  ToastService,
    private router: Router,
  ) {}

  ngOnInit() {
    this.api.get<any>('/courses?size=100').subscribe({
      next: data => this.allCourses.set(data?.content ?? []),
      error: () => {},
    });
    this.api.get<Enrollment[]>('/enrollments/me').subscribe({
      next: data => { this.enrollments.set(data ?? []); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  enroll(courseId: string) {
    this.enrolling.set(courseId);
    this.api.post<Enrollment>('/enrollments', { courseId }).subscribe({
      next: enr => {
        this.enrollments.update(list => [...list, enr]);
        this.enrolling.set(null);
        this.toast.success('Inscription confirmée !', 'Bienvenue');
      },
      error: () => {
        this.enrolling.set(null);
        this.toast.error("Échec de l'inscription.", 'Erreur');
      },
    });
  }

  goLearn(courseId: string) {
    this.router.navigate(['/student/learn', courseId]);
  }

  onCardAction(course: Course) {
    const enr = this.getEnrollment(course.id);
    if (enr) { this.goLearn(course.id); }
    else      { this.enroll(course.id); }
  }

  getActionLabel(course: Course): string {
    const enr = this.getEnrollment(course.id);
    if (!enr)             return "S'inscrire";
    if (enr.progress > 0) return 'Continuer';
    return 'Commencer';
  }

  scrollStrip(el: HTMLDivElement, dir: number) {
    el?.scrollBy({ left: dir * 560, behavior: 'smooth' });
  }

  bgStyle(course: Course): string {
    if (course.thumbnail) {
      const url = course.thumbnail.startsWith('http') ? course.thumbnail : '/api' + course.thumbnail;
      return `background-image: url('${url}'); background-size: cover; background-position: center;`;
    }
    const grad = CAT_GRADIENTS.find(([k]) => course.category?.includes(k))?.[1] ?? DEFAULT_GRAD;
    return `background: ${grad};`;
  }

  avatarBg(category: string): string {
    const grad = CAT_GRADIENTS.find(([k]) => category?.includes(k))?.[1] ?? DEFAULT_GRAD;
    return grad.match(/#[0-9a-fA-F]{6}/g)?.[0] ?? '#007A8A';
  }

  levelColor(level: string): string {
    return LEVEL_COLORS[level] ?? 'rgba(0,180,198,0.9)';
  }

  formatLevel(level: string): string {
    return LEVEL_LABELS[level] ?? level;
  }
}
