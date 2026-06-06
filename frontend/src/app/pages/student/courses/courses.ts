import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth';
import { ApiService } from '../../../core/services/api';
import { Sidebar } from '../../../shared/sidebar/sidebar';

interface Course {
  id: string; title: string; description: string; category: string;
  level: string; price: number; rating?: number; enrollmentCount?: number;
  trainerName?: string; imageUrl?: string; published: boolean;
}
interface Enrollment { id: string; course: Course; progressPercentage: number; completed: boolean }

@Component({
  selector: 'app-student-courses',
  standalone: true,
  imports: [CommonModule, FormsModule, Sidebar],
  template: `
    <div class="flex h-screen overflow-hidden" style="background:linear-gradient(160deg,#fffdfb 0%,#fdf2f8 60%,#f6f0ff 100%)">
      <app-sidebar [role]="role" [userName]="userName"></app-sidebar>
      <main class="flex-1 overflow-y-auto p-7">
        <div class="mb-6 flex items-center justify-between reveal">
          <div>
            <h1 class="font-display text-2xl font-bold" style="color:#221f2c">Catalogue des cours</h1>
            <p class="text-sm mt-0.5" style="color:#948da3">{{ allCourses().length }} cours disponibles</p>
          </div>
          <div class="flex gap-3">
            <input [(ngModel)]="search" placeholder="Rechercher..." class="input-field w-52 text-sm" />
            <select [(ngModel)]="categoryFilter" class="input-field text-sm">
              <option value="">Toutes catégories</option>
              <option *ngFor="let c of categories()" [value]="c">{{ c }}</option>
            </select>
          </div>
        </div>

        <!-- Tabs -->
        <div class="tabs reveal stagger-1">
          <button (click)="tab='all'" [class.active]="tab==='all'" class="tab-btn">Tous</button>
          <button (click)="tab='enrolled'" [class.active]="tab==='enrolled'" class="tab-btn">Mes cours</button>
        </div>

        <div *ngIf="loading()" class="grid grid-cols-3 gap-4 mt-5">
          <div *ngFor="let _ of [1,2,3,4,5,6]" class="card p-4 h-48 skeleton"></div>
        </div>

        <div *ngIf="!loading()" class="grid grid-cols-3 gap-4 mt-5 reveal stagger-2">
          <div *ngFor="let c of filtered()" class="card lift-on-hover p-4 flex flex-col">
            <div class="course-thumb mb-3">
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
              </svg>
            </div>
            <p class="text-sm font-bold mb-1 flex-1" style="color:#221f2c">{{ c.title }}</p>
            <p class="text-xs mb-2 line-clamp-2" style="color:#948da3">{{ c.description }}</p>
            <div class="flex items-center justify-between mb-3">
              <span class="badge-cat">{{ c.category }}</span>
              <span class="text-xs" style="color:#948da3">{{ c.level }}</span>
            </div>

            <!-- Progress if enrolled -->
            <div *ngIf="getEnrollment(c.id) as enr">
              <div class="progress-track mb-1">
                <div class="progress-fill" [style.width.%]="enr.progressPercentage"></div>
              </div>
              <p class="text-xs" style="color:#948da3">{{ enr.progressPercentage }}% complété</p>
            </div>

            <button *ngIf="!getEnrollment(c.id)" (click)="enroll(c.id)"
              [disabled]="enrolling() === c.id"
              class="btn-primary w-full justify-center mt-2 text-xs" style="height:38px;padding:0">
              {{ enrolling() === c.id ? 'Inscription...' : "S'inscrire" }}
            </button>
          </div>
        </div>

        <div *ngIf="!loading() && filtered().length === 0" class="card p-12 text-center bounce-in">
          <svg class="mx-auto mb-3" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#c4bdd6" stroke-width="1.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <p class="font-semibold" style="color:#221f2c">Aucun cours trouvé</p>
        </div>
      </main>
    </div>
  `,
  styles: [`
    .tabs { display:flex; gap:6px; margin-top:18px; background:rgba(167,139,250,.06); border:1px solid rgba(167,139,250,.12); border-radius:14px; padding:5px; width:fit-content; }
    .tab-btn { padding:8px 18px; border-radius:10px; font-size:13px; font-weight:600; color:#948da3; background:transparent; border:none; cursor:pointer; transition:all .25s cubic-bezier(.16,1,.3,1); font-family:inherit; }
    .tab-btn.active { background:linear-gradient(135deg,#a78bfa,#fb7299); color:#fff; box-shadow:0 6px 18px rgba(167,139,250,.35); }
    .tab-btn:not(.active):hover { color:#221f2c; }
    .course-thumb { width:100%; height:108px; border-radius:18px; background:linear-gradient(135deg,rgba(167,139,250,.85),rgba(251,114,153,.7)); display:flex; align-items:center; justify-content:center; box-shadow:0 12px 30px rgba(167,139,250,.28); }
    .badge-cat { font-size:11px; padding:3px 11px; border-radius:999px; background:rgba(167,139,250,.14); color:#7c5ce0; font-weight:600; }
  `],
})
export class StudentCourses implements OnInit {
  loading = signal(true);
  enrolling = signal<string | null>(null);
  allCourses = signal<Course[]>([]);
  enrollments = signal<Enrollment[]>([]);
  search = '';
  tab = 'all';
  categoryFilter = '';

  get role() { return this.auth.user()?.role ?? 'STUDENT'; }
  get userName() { return this.auth.user()?.name ?? ''; }

  categories = computed(() => [...new Set(this.allCourses().map(c => c.category))].sort());

  filtered = computed(() => {
    let list = this.tab === 'enrolled'
      ? this.enrollments().map(e => e.course)
      : this.allCourses();
    if (this.search) {
      const s = this.search.toLowerCase();
      list = list.filter(c => c.title.toLowerCase().includes(s) || c.category.toLowerCase().includes(s));
    }
    if (this.categoryFilter) list = list.filter(c => c.category === this.categoryFilter);
    return list;
  });

  getEnrollment(courseId: string): Enrollment | undefined {
    return this.enrollments().find(e => e.course.id === courseId);
  }

  constructor(private auth: AuthService, private api: ApiService) {}

  ngOnInit() {
    this.api.get<Course[]>('/courses/published').subscribe({
      next: data => { this.allCourses.set(data ?? []); },
    });
    this.api.get<Enrollment[]>('/enrollments/my').subscribe({
      next: data => { this.enrollments.set(data ?? []); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  enroll(courseId: string) {
    this.enrolling.set(courseId);
    this.api.post<Enrollment>(`/enrollments/${courseId}`).subscribe({
      next: enr => {
        this.enrollments.update(list => [...list, enr]);
        this.enrolling.set(null);
      },
      error: () => this.enrolling.set(null),
    });
  }
}
