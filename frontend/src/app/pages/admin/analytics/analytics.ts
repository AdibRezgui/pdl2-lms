import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth';
import { ApiService } from '../../../core/services/api';
import { Sidebar } from '../../../shared/sidebar/sidebar';

interface AdminStats {
  totalUsers: number; totalCourses: number; totalEnrollments: number;
  totalRevenue: number; studentCount: number; trainerCount: number;
}
interface CourseStats { id: string; title: string; category: string; enrollmentCount: number; rating: number; published: boolean }

@Component({
  selector: 'app-admin-analytics',
  standalone: true,
  imports: [CommonModule, Sidebar],
  template: `
    <div class="flex h-screen overflow-hidden" style="background:linear-gradient(160deg,#fffdfb 0%,#fdf2f8 60%,#f6f0ff 100%)">
      <app-sidebar [role]="role" [userName]="userName"></app-sidebar>
      <main class="flex-1 overflow-y-auto p-7">
        <div class="mb-6 reveal">
          <h1 class="font-display text-2xl font-bold" style="color:#221f2c">Analytics plateforme</h1>
          <p class="text-sm mt-0.5" style="color:#948da3">Statistiques globales et performances</p>
        </div>

        <!-- Stats grid -->
        <div class="grid grid-cols-3 gap-4 mb-6 reveal stagger-1">
          <div class="card p-6 lift-on-hover">
            <p class="text-xs mb-3" style="color:#948da3">Répartition utilisateurs</p>
            <div class="space-y-3">
              <div class="flex items-center justify-between">
                <span class="text-sm" style="color:#948da3">Stagiaires</span>
                <span class="text-sm font-bold" style="color:#221f2c">{{ stats()?.studentCount ?? 0 }}</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-sm" style="color:#948da3">Formateurs</span>
                <span class="text-sm font-bold" style="color:#221f2c">{{ stats()?.trainerCount ?? 0 }}</span>
              </div>
              <div class="flex items-center justify-between" style="border-top:1px solid rgba(167,139,250,.12);padding-top:12px">
                <span class="text-sm font-medium" style="color:#221f2c">Total</span>
                <span class="text-sm font-bold" style="color:#8b6ef2">{{ stats()?.totalUsers ?? 0 }}</span>
              </div>
            </div>
          </div>
          <div class="card p-6 lift-on-hover">
            <p class="text-xs mb-3" style="color:#948da3">Cours & inscriptions</p>
            <div class="space-y-3">
              <div class="flex items-center justify-between">
                <span class="text-sm" style="color:#948da3">Cours publiés</span>
                <span class="text-sm font-bold" style="color:#221f2c">{{ stats()?.totalCourses ?? 0 }}</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-sm" style="color:#948da3">Inscriptions totales</span>
                <span class="text-sm font-bold" style="color:#1f9d6f">{{ stats()?.totalEnrollments ?? 0 }}</span>
              </div>
            </div>
          </div>
          <div class="card p-6 lift-on-hover">
            <p class="text-xs mb-2" style="color:#948da3">Revenu total</p>
            <p class="text-4xl font-bold font-display" style="color:#f5a524">{{ (stats()?.totalRevenue ?? 0) | number:'1.0-0' }}</p>
            <p class="text-xs mt-1" style="color:#948da3">TND</p>
          </div>
        </div>

        <!-- Top courses -->
        <div class="card overflow-hidden reveal stagger-2">
          <div class="p-4" style="border-bottom:1px solid rgba(167,139,250,.1)">
            <h2 class="text-sm font-bold font-display" style="color:#221f2c">Cours les plus populaires</h2>
          </div>
          <div *ngIf="loading()" class="p-8 text-center text-sm" style="color:#948da3">Chargement...</div>
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
                <td class="p-4 text-sm font-semibold" style="color:#221f2c">{{ c.title }}</td>
                <td class="p-4"><span class="badge-cat">{{ c.category }}</span></td>
                <td class="p-4 text-sm" style="color:#221f2c">{{ c.enrollmentCount }}</td>
                <td class="p-4 text-sm font-semibold flex items-center gap-1" style="color:#f5a524">
                  {{ c.rating | number:'1.1-1' }}
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="#f5a524" stroke="#f5a524"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                </td>
                <td class="p-4">
                  <span class="role-pill" [style.background]="c.published ? 'rgba(110,231,183,.16)' : 'rgba(167,139,250,.1)'" [style.color]="c.published ? '#1f9d6f' : '#948da3'">
                    {{ c.published ? 'Publié' : 'Brouillon' }}
                  </span>
                </td>
              </tr>
              <tr *ngIf="topCourses().length === 0">
                <td colspan="5" class="p-8 text-center text-sm" style="color:#948da3">Aucune donnée</td>
              </tr>
            </tbody>
          </table>
        </div>
      </main>
    </div>
  `,
  styles: [`
    .badge-cat { padding:3px 11px; border-radius:999px; background:rgba(167,139,250,.14); color:#7c5ce0; font-weight:600; font-size:11px; }
    .role-pill { font-size:11px; padding:3px 11px; border-radius:999px; font-weight:600; }
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
    this.api.get<CourseStats[]>('/courses/published?sort=enrollmentCount,desc&size=10').subscribe({
      next: data => { this.topCourses.set(Array.isArray(data) ? data : (data as any)?.content ?? []); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }
}
