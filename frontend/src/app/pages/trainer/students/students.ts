import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth';
import { ApiService } from '../../../core/services/api';
import { Sidebar } from '../../../shared/sidebar/sidebar';

interface StudentRow {
  id: string; name: string; email: string; enrolledCoursesCount: number;
  completedCoursesCount: number; averageProgress: number; lastActivity?: string;
}

@Component({
  selector: 'app-trainer-students',
  standalone: true,
  imports: [CommonModule, FormsModule, Sidebar],
  template: `
    <div class="flex h-screen overflow-hidden" style="background:linear-gradient(160deg,#fffdfb 0%,#fdf2f8 60%,#f6f0ff 100%)">
      <app-sidebar [role]="role" [userName]="userName"></app-sidebar>
      <main class="flex-1 overflow-y-auto p-7">
        <div class="mb-6 flex items-center justify-between reveal">
          <div>
            <h1 class="font-display text-2xl font-bold" style="color:#221f2c">Mes stagiaires</h1>
            <p class="text-sm mt-0.5" style="color:#948da3">{{ students().length }} stagiaire(s) inscrit(s)</p>
          </div>
          <input [(ngModel)]="search" placeholder="Rechercher un stagiaire..." class="input-field w-56 text-sm" />
        </div>

        <div *ngIf="loading()" class="space-y-3">
          <div *ngFor="let _ of [1,2,3,4,5]" class="card p-4 h-16 skeleton"></div>
        </div>

        <div *ngIf="!loading()" class="card overflow-hidden reveal stagger-1">
          <table class="data-table w-full">
            <thead>
              <tr>
                <th class="text-left font-medium p-4">Stagiaire</th>
                <th class="text-left font-medium p-4">Cours inscrits</th>
                <th class="text-left font-medium p-4">Complétés</th>
                <th class="text-left font-medium p-4">Progression moy.</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let s of filtered()">
                <td class="p-4">
                  <div class="flex items-center gap-3">
                    <div class="avatar-chip">{{ initials(s.name) }}</div>
                    <div>
                      <p class="text-sm font-semibold" style="color:#221f2c">{{ s.name }}</p>
                      <p class="text-xs" style="color:#948da3">{{ s.email }}</p>
                    </div>
                  </div>
                </td>
                <td class="p-4 text-sm" style="color:#221f2c">{{ s.enrolledCoursesCount }}</td>
                <td class="p-4 text-sm font-semibold" style="color:#1f9d6f">{{ s.completedCoursesCount }}</td>
                <td class="p-4">
                  <div class="flex items-center gap-2">
                    <div class="progress-track" style="width:80px">
                      <div class="progress-fill" [style.width.%]="s.averageProgress"></div>
                    </div>
                    <span class="text-xs" style="color:#948da3">{{ s.averageProgress }}%</span>
                  </div>
                </td>
              </tr>
              <tr *ngIf="filtered().length === 0">
                <td colspan="4" class="p-8 text-center text-sm" style="color:#948da3">Aucun stagiaire trouvé</td>
              </tr>
            </tbody>
          </table>
        </div>
      </main>
    </div>
  `,
  styles: [`
    .avatar-chip { width:34px; height:34px; border-radius:11px; background:linear-gradient(135deg,#a78bfa,#fb7299); display:flex; align-items:center; justify-content:center; font-size:12px; font-weight:800; color:#fff; flex-shrink:0; }
  `],
})
export class TrainerStudents implements OnInit {
  loading = signal(true);
  students = signal<StudentRow[]>([]);
  search = '';

  filtered = computed(() => {
    if (!this.search) return this.students();
    const s = this.search.toLowerCase();
    return this.students().filter(st => st.name.toLowerCase().includes(s) || st.email.toLowerCase().includes(s));
  });

  get role() { return this.auth.user()?.role ?? 'TRAINER'; }
  get userName() { return this.auth.user()?.name ?? ''; }
  initials = (name: string) => name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  constructor(private auth: AuthService, private api: ApiService) {}

  ngOnInit() {
    this.api.get<StudentRow[]>('/trainer/students').subscribe({
      next: data => { this.students.set(data ?? []); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }
}
