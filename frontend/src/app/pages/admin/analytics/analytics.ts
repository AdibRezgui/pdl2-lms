import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth';
import { ApiService } from '../../../core/services/api';
import { Sidebar } from '../../../shared/sidebar/sidebar';

interface AdminStats {
  totalUsers: number; totalCourses: number; publishedCourses: number;
  totalEnrollments: number; completionRate: number;
  totalStudents: number; totalTrainers: number;
  pendingCourses: number;
}
interface CourseStats { id: string; title: string; category: string; enrollmentCount: number; rating: number; published: boolean }

@Component({
  selector: 'app-admin-analytics',
  standalone: true,
  imports: [CommonModule, Sidebar],
  template: `
    <div class="flex h-screen overflow-hidden" style="background:linear-gradient(160deg,#f5fdfe 0%,#edf9fb 60%,#daf2f6 100%)">
      <app-sidebar [role]="role" [userName]="userName"></app-sidebar>
      <main class="flex-1 overflow-y-auto p-7">
        <div class="mb-6 reveal">
          <h1 class="font-display text-2xl font-bold" style="color:#1a2d3a">Analytics plateforme</h1>
          <p class="text-sm mt-0.5" style="color:#5a7a8a">Statistiques globales et performances</p>
        </div>

        <!-- Stats grid -->
        <div class="grid grid-cols-3 gap-4 mb-6 reveal stagger-1">
          <div class="card p-6 lift-on-hover">
            <p class="text-xs mb-3" style="color:#5a7a8a">Répartition utilisateurs</p>
            <div class="space-y-3">
              <div class="flex items-center justify-between">
                <span class="text-sm" style="color:#5a7a8a">Stagiaires</span>
                <span class="text-sm font-bold" style="color:#1a2d3a">{{ stats()?.totalStudents ?? 0 }}</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-sm" style="color:#5a7a8a">Formateurs</span>
                <span class="text-sm font-bold" style="color:#1a2d3a">{{ stats()?.totalTrainers ?? 0 }}</span>
              </div>
              <div class="flex items-center justify-between" style="border-top:1px solid rgba(0,180,198,.12);padding-top:12px">
                <span class="text-sm font-medium" style="color:#1a2d3a">Total</span>
                <span class="text-sm font-bold" style="color:#0099AE">{{ stats()?.totalUsers ?? 0 }}</span>
              </div>
            </div>
          </div>
          <div class="card p-6 lift-on-hover">
            <p class="text-xs mb-3" style="color:#5a7a8a">Cours & inscriptions</p>
            <div class="space-y-3">
              <div class="flex items-center justify-between">
                <span class="text-sm" style="color:#5a7a8a">Cours publiés</span>
                <span class="text-sm font-bold" style="color:#1a2d3a">{{ stats()?.publishedCourses ?? 0 }}</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-sm" style="color:#5a7a8a">En attente de validation</span>
                <span class="text-sm font-bold" style="color:#d97706">{{ stats()?.pendingCourses ?? 0 }}</span>
              </div>
              <div class="flex items-center justify-between" style="border-top:1px solid rgba(0,180,198,.12);padding-top:12px">
                <span class="text-sm" style="color:#5a7a8a">Inscriptions totales</span>
                <span class="text-sm font-bold" style="color:#1f9d6f">{{ stats()?.totalEnrollments ?? 0 }}</span>
              </div>
            </div>
          </div>
          <div class="card p-6 lift-on-hover">
            <p class="text-xs mb-3" style="color:#5a7a8a">Taux de complétion</p>
            <div class="completion-ring-wrap">
              <svg viewBox="0 0 64 64" class="completion-ring">
                <circle cx="32" cy="32" r="26" fill="none" stroke="rgba(0,180,198,.14)" stroke-width="6"/>
                <circle cx="32" cy="32" r="26" fill="none" stroke="url(#cg)" stroke-width="6"
                  stroke-linecap="round" stroke-dasharray="163.4"
                  [attr.stroke-dashoffset]="163.4 - (163.4 * (stats()?.completionRate ?? 0) / 100)"
                  transform="rotate(-90 32 32)"/>
                <defs>
                  <linearGradient id="cg" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stop-color="#00B4C6"/>
                    <stop offset="100%" stop-color="#00A8BC"/>
                  </linearGradient>
                </defs>
              </svg>
              <div class="completion-label">
                <span class="completion-pct">{{ stats()?.completionRate ?? 0 }}%</span>
                <span class="completion-sub">complétés</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Top courses -->
        <div class="card overflow-hidden reveal stagger-2">
          <div class="p-4" style="border-bottom:1px solid rgba(0,180,198,.1)">
            <h2 class="text-sm font-bold font-display" style="color:#1a2d3a">Cours les plus populaires</h2>
          </div>
          <div *ngIf="loading()" class="p-8 text-center text-sm" style="color:#5a7a8a">Chargement...</div>
          <table *ngIf="!loading()" class="data-table w-full">
            <thead>
              <tr>
                <th class="text-left font-medium p-4">Cours</th>
                <th class="text-left font-medium p-4">Catégorie</th>
                <th class="text-left font-medium p-4">Inscrits</th>
                <th class="text-left font-medium p-4">Note</th>
                <th class="text-left font-medium p-4">Statut</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let c of topCourses()">
                <td class="p-4 text-sm font-semibold" style="color:#1a2d3a">{{ c.title }}</td>
                <td class="p-4"><span class="badge-cat">{{ c.category }}</span></td>
                <td class="p-4 text-sm" style="color:#1a2d3a">{{ c.enrollmentCount }}</td>
                <td class="p-4 text-sm font-semibold flex items-center gap-1" style="color:#f5a524">
                  {{ c.rating | number:'1.1-1' }}
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="#f5a524" stroke="#f5a524"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                </td>
                <td class="p-4">
                  <span class="role-pill" [style.background]="c.published ? 'rgba(110,231,183,.16)' : 'rgba(0,180,198,.1)'" [style.color]="c.published ? '#1f9d6f' : '#5a7a8a'">
                    {{ c.published ? 'Publié' : 'Brouillon' }}
                  </span>
                </td>
              </tr>
              <tr *ngIf="topCourses().length === 0">
                <td colspan="5" class="p-8 text-center text-sm" style="color:#5a7a8a">Aucune donnée</td>
              </tr>
            </tbody>
          </table>
        </div>
      </main>
    </div>
  `,
  styles: [`
    .badge-cat { padding:3px 11px; border-radius:999px; background:rgba(0,180,198,.14); color:#007A8A; font-weight:600; font-size:11px; }
    .role-pill { font-size:11px; padding:3px 11px; border-radius:999px; font-weight:600; }
    .completion-ring-wrap { position:relative; display:flex; align-items:center; justify-content:center; width:96px; height:96px; margin:8px auto 0; }
    .completion-ring { width:96px; height:96px; }
    .completion-label { position:absolute; display:flex; flex-direction:column; align-items:center; }
    .completion-pct { font-family:'Fraunces',Georgia,serif; font-size:20px; font-weight:800; color:#1a2d3a; line-height:1; }
    .completion-sub { font-size:10px; color:#5a7a8a; margin-top:2px; }
  `],
})
export class AdminAnalytics implements OnInit {
  loading = signal(true);
  stats = signal<AdminStats | null>(null);
  topCourses = signal<CourseStats[]>([]);

  get role() { return this.auth.user()?.role ?? 'ADMIN'; }
  get userName() { return this.auth.user()?.name ?? ''; }

  constructor(private auth: AuthService, private api: ApiService) {}

  ngOnInit() {
    this.api.get<AdminStats>('/admin/stats').subscribe({
      next: data => this.stats.set(data),
    });
    this.api.get<CourseStats[]>('/courses?size=10').subscribe({
      next: data => { this.topCourses.set(Array.isArray(data) ? data : (data as any)?.content ?? []); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }
}
