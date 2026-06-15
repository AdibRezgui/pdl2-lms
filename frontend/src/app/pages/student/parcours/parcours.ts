import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth';
import { ApiService } from '../../../core/services/api';
import { Sidebar } from '../../../shared/sidebar/sidebar';

interface Enrollment {
  id: string; progress: number; completed: boolean;
  course: { id: string; title: string; category: string; level: string; trainerName: string };
}
interface AiAnalysis {
  overallLevel: string; averageProgress: number;
  weakAreas: string[]; strongAreas: string[]; stalledCourses: string[];
  categoryScores: Record<string, number>; recommendations: string[];
}
interface Recommendation { id: string; title: string; category: string; level: string; trainerName: string; reason?: string }

@Component({
  selector: 'app-student-parcours',
  standalone: true,
  imports: [CommonModule, RouterLink, Sidebar],
  template: `
    <div class="flex h-screen overflow-hidden" style="background:linear-gradient(160deg,#f5fdfe 0%,#edf9fb 60%,#daf2f6 100%)">
      <app-sidebar [role]="role" [userName]="userName" />

      <main class="flex-1 overflow-y-auto p-7">
        <header class="mb-7 reveal">
          <h1 class="font-display text-2xl font-bold" style="color:#1a2d3a">Mon Parcours <span class="gt">Personnalisé</span></h1>
          <p class="text-sm mt-0.5" style="color:#5a7a8a">Votre chemin d'apprentissage adapté par l'IA</p>
        </header>

        <!-- AI Level Card -->
        <div *ngIf="analysis()" class="level-card reveal stagger-1 mb-6">
          <div class="level-left">
            <div class="level-badge">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            </div>
            <div>
              <p class="text-xs font-semibold" style="color:#5a7a8a; letter-spacing:.04em; text-transform:uppercase">Votre niveau actuel</p>
              <p class="font-display font-bold text-2xl" style="color:#1a2d3a">{{ analysis()!.overallLevel }}</p>
              <p class="text-xs mt-1" style="color:#5a7a8a">Progression moyenne : {{ analysis()!.averageProgress }}%</p>
            </div>
          </div>
          <div class="level-areas">
            <div *ngIf="analysis()!.strongAreas.length > 0">
              <p class="text-xs font-semibold mb-2" style="color:#1f9d6f">Points forts</p>
              <div class="flex flex-wrap gap-2">
                <span *ngFor="let a of analysis()!.strongAreas" class="area-tag strong">{{ a }}</span>
              </div>
            </div>
            <div *ngIf="analysis()!.weakAreas.length > 0" class="mt-3">
              <p class="text-xs font-semibold mb-2" style="color:#f25c78">Domaines à renforcer</p>
              <div class="flex flex-wrap gap-2">
                <span *ngFor="let a of analysis()!.weakAreas" class="area-tag weak">{{ a }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- AI loading skeleton for level card -->
        <div *ngIf="loadingAnalysis()" class="skeleton h-28 rounded-2xl mb-6 reveal stagger-1"></div>

        <div class="two-col">
          <!-- LEFT: Active path -->
          <section class="reveal stagger-2">
            <h2 class="section-title mb-4">Parcours en cours</h2>

            <div *ngIf="loadingEnrollments()" class="space-y-3">
              <div *ngFor="let _ of [1,2,3]" class="skeleton h-24 rounded-2xl"></div>
            </div>

            <div *ngIf="!loadingEnrollments() && activeEnrollments().length === 0" class="card p-8 text-center">
              <svg class="mx-auto mb-3" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#c4bdd6" stroke-width="1.5"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
              <p class="font-semibold" style="color:#1a2d3a">Aucun cours en cours</p>
              <a routerLink="/student/courses" class="btn-primary mt-3 inline-flex">Explorer les cours</a>
            </div>

            <div class="path-timeline">
              <div *ngFor="let enr of activeEnrollments(); let i = index; let last = last" class="path-step">
                <div class="step-connector" *ngIf="!last"></div>
                <div class="step-dot" [class.step-done]="enr.completed" [class.step-active]="!enr.completed && enr.progress > 0" [class.step-pending]="enr.progress === 0">
                  <svg *ngIf="enr.completed" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
                  <span *ngIf="!enr.completed" class="text-xs font-bold text-white">{{ i + 1 }}</span>
                </div>
                <div class="step-card card p-4">
                  <div class="flex items-start justify-between mb-2">
                    <div>
                      <p class="text-sm font-bold" style="color:#1a2d3a">{{ enr.course.title }}</p>
                      <p class="text-xs" style="color:#5a7a8a">{{ enr.course.category }} · {{ levelLabel(enr.course.level) }}</p>
                    </div>
                    <span *ngIf="enr.completed" class="badge-completed">Terminé</span>
                    <span *ngIf="!enr.completed && isStalledCourse(enr)" class="badge-stalled">À reprendre</span>
                  </div>
                  <div class="flex items-center gap-3">
                    <div class="path-prog-track flex-1">
                      <div class="path-prog-fill" [style.width.%]="enr.progress"
                        [style.background]="enr.progress >= 80 ? 'linear-gradient(90deg,#6ee7b7,#1f9d6f)' : enr.progress >= 40 ? 'linear-gradient(90deg,#00B4C6,#00A8BC)' : 'linear-gradient(90deg,#fda4af,#f25c78)'">
                      </div>
                    </div>
                    <span class="text-xs font-bold" style="color:#0099AE;min-width:32px">{{ enr.progress }}%</span>
                    <a [routerLink]="'/student/learn/' + enr.course.id" class="continue-btn">
                      {{ enr.completed ? 'Revoir' : (enr.progress > 0 ? 'Continuer' : 'Commencer') }}
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <!-- RIGHT: AI Recommendations + tips -->
          <section class="reveal stagger-3">
            <h2 class="section-title mb-4">Prochaines étapes recommandées</h2>

            <div *ngIf="loadingRecs()" class="space-y-3">
              <div *ngFor="let _ of [1,2,3]" class="skeleton h-20 rounded-2xl"></div>
            </div>

            <div class="space-y-3">
              <div *ngFor="let rec of recommendations(); let i = index" class="rec-card card p-4 lift-on-hover">
                <div class="flex items-start gap-3">
                  <div class="rec-num">{{ i + 1 }}</div>
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-bold mb-0.5" style="color:#1a2d3a">{{ rec.title }}</p>
                    <p class="text-xs" style="color:#5a7a8a">{{ rec.category }} · {{ levelLabel(rec.level) }}</p>
                    <p *ngIf="rec.reason" class="text-xs mt-1 italic" style="color:#00B4C6">{{ rec.reason }}</p>
                  </div>
                  <a routerLink="/student/courses" class="enroll-btn">Explorer</a>
                </div>
              </div>

              <div *ngIf="!loadingRecs() && recommendations().length === 0" class="card p-6 text-center">
                <p class="text-sm" style="color:#5a7a8a">L'IA analyse votre profil pour vous proposer des cours</p>
              </div>
            </div>

            <!-- AI Tips -->
            <div *ngIf="analysis() && analysis()!.recommendations.length > 0" class="mt-6">
              <h2 class="section-title mb-4">Conseils de l'IA</h2>
              <div class="space-y-2">
                <div *ngFor="let tip of analysis()!.recommendations" class="tip-card">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00B4C6" stroke-width="2" style="flex-shrink:0;margin-top:1px"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  <p class="text-xs" style="color:#2c3d4e">{{ tip }}</p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  `,
  styles: [`
    .gt { background:linear-gradient(135deg,#00B4C6,#00A8BC);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text; }
    .section-title { font-family:'Fraunces',Georgia,serif; font-weight:700; font-size:16px; color:#1a2d3a; }
    .level-card { display:flex; align-items:flex-start; gap:24px; padding:24px; border-radius:24px; background:linear-gradient(135deg,rgba(0,180,198,.12),rgba(0,168,188,.08)); border:1px solid rgba(0,180,198,.22); }
    @media(max-width:768px){.level-card{flex-direction:column;gap:16px}}
    .level-left { display:flex; align-items:center; gap:14px; min-width:200px; }
    .level-badge { width:44px; height:44px; border-radius:14px; background:linear-gradient(135deg,#00B4C6,#00A8BC); display:flex; align-items:center; justify-content:center; flex-shrink:0; box-shadow:0 8px 20px rgba(0,180,198,.35); }
    .level-areas { flex:1; }
    .area-tag { font-size:11px; padding:4px 12px; border-radius:999px; font-weight:600; }
    .area-tag.strong { background:rgba(110,231,183,.18); color:#1f9d6f; border:1px solid rgba(110,231,183,.3); }
    .area-tag.weak { background:rgba(242,92,120,.1); color:#f25c78; border:1px solid rgba(242,92,120,.2); }
    .two-col { display:grid; grid-template-columns:1fr 340px; gap:24px; align-items:start; }
    @media(max-width:1000px){.two-col{grid-template-columns:1fr}}
    .path-timeline { display:flex; flex-direction:column; gap:0; }
    .path-step { display:flex; gap:16px; position:relative; }
    .step-connector { position:absolute; left:14px; top:32px; bottom:-12px; width:2px; background:linear-gradient(180deg,rgba(0,180,198,.4),rgba(0,180,198,.1)); z-index:0; }
    .step-dot { width:28px; height:28px; border-radius:50%; display:flex; align-items:center; justify-content:center; flex-shrink:0; margin-top:14px; z-index:1; }
    .step-done { background:linear-gradient(135deg,#6ee7b7,#1f9d6f); box-shadow:0 4px 12px rgba(110,231,183,.4); }
    .step-active { background:linear-gradient(135deg,#00B4C6,#00A8BC); box-shadow:0 4px 12px rgba(0,180,198,.4); }
    .step-pending { background:rgba(0,180,198,.18); border:2px solid rgba(0,180,198,.3); }
    .step-card { flex:1; margin-bottom:12px; }
    .path-prog-track { height:6px; border-radius:99px; background:rgba(0,180,198,.15); overflow:hidden; }
    .path-prog-fill { height:100%; border-radius:99px; transition:width .5s cubic-bezier(.23,1,.32,1); }
    .badge-completed { font-size:10px; padding:3px 10px; border-radius:999px; background:rgba(110,231,183,.16); color:#1f9d6f; font-weight:700; white-space:nowrap; }
    .badge-stalled { font-size:10px; padding:3px 10px; border-radius:999px; background:rgba(245,165,36,.14); color:#e2940f; font-weight:700; white-space:nowrap; }
    .continue-btn { padding:7px 14px; border-radius:10px; background:linear-gradient(135deg,#00B4C6,#00A8BC); color:white; font-size:12px; font-weight:600; text-decoration:none; white-space:nowrap; flex-shrink:0; transition:opacity .2s; }
    .continue-btn:hover { opacity:.88; }
    .rec-card { }
    .rec-num { width:28px; height:28px; border-radius:9px; background:linear-gradient(135deg,rgba(0,180,198,.2),rgba(0,168,188,.14)); border:1px solid rgba(0,180,198,.22); display:flex; align-items:center; justify-content:center; font-size:12px; font-weight:800; color:#0099AE; flex-shrink:0; }
    .enroll-btn { padding:7px 14px; border-radius:10px; background:rgba(0,180,198,.12); border:1px solid rgba(0,180,198,.22); color:#007A8A; font-size:12px; font-weight:600; text-decoration:none; white-space:nowrap; flex-shrink:0; transition:all .22s; }
    .enroll-btn:hover { background:rgba(0,180,198,.22); }
    .tip-card { display:flex; gap:8px; padding:10px 14px; border-radius:13px; background:rgba(0,180,198,.06); border:1px solid rgba(0,180,198,.12); }
  `],
})
export class StudentParcours implements OnInit {
  loadingEnrollments = signal(true);
  loadingRecs = signal(true);
  loadingAnalysis = signal(true);
  enrollments = signal<Enrollment[]>([]);
  recommendations = signal<Recommendation[]>([]);
  analysis = signal<AiAnalysis | null>(null);

  get role() { return this.auth.user()?.role ?? 'STUDENT'; }
  get userName() { return this.auth.user()?.name ?? ''; }

  activeEnrollments = computed(() =>
    [...this.enrollments()].sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      return a.progress - b.progress;
    })
  );

  constructor(private auth: AuthService, private api: ApiService) {}

  ngOnInit() {
    this.api.get<Enrollment[]>('/enrollments/me').subscribe({
      next: data => { this.enrollments.set(data ?? []); this.loadingEnrollments.set(false); },
      error: () => this.loadingEnrollments.set(false),
    });

    this.api.get<any>('/ai/recommend').subscribe({
      next: res => {
        const recs: Recommendation[] = (res?.recommendations ?? []).map((r: any) => ({
          id: r.id ?? '', title: r.title ?? '', category: r.category ?? '',
          level: r.level ?? '', trainerName: r.trainerName ?? '', reason: r.reason ?? '',
        }));
        this.recommendations.set(recs);
        this.loadingRecs.set(false);
      },
      error: () => this.loadingRecs.set(false),
    });

    this.api.get<any>('/ai/analyze').subscribe({
      next: res => { this.analysis.set(res as AiAnalysis); this.loadingAnalysis.set(false); },
      error: () => this.loadingAnalysis.set(false),
    });
  }

  isStalledCourse(enr: Enrollment): boolean {
    return enr.progress < 20 && !enr.completed;
  }

  levelLabel(level: string): string {
    return { BEGINNER: 'Débutant', INTERMEDIATE: 'Intermédiaire', ADVANCED: 'Avancé' }[level] ?? level;
  }
}
