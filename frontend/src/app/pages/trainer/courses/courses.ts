import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth';
import { ApiService } from '../../../core/services/api';
import { Sidebar } from '../../../shared/sidebar/sidebar';

interface Course {
  id: string; title: string; description: string; category: string;
  level: string; price: number; enrollmentCount?: number; rating?: number; published: boolean;
}

@Component({
  selector: 'app-trainer-courses',
  standalone: true,
  imports: [CommonModule, RouterLink, Sidebar],
  template: `
    <div class="flex h-screen overflow-hidden" style="background:linear-gradient(160deg,#fffdfb 0%,#fdf2f8 60%,#f6f0ff 100%)">
      <app-sidebar [role]="role" [userName]="userName"></app-sidebar>
      <main class="flex-1 overflow-y-auto p-7">
        <div class="mb-6 flex items-center justify-between reveal">
          <div>
            <h1 class="font-display text-2xl font-bold" style="color:#221f2c">Mes cours</h1>
            <p class="text-sm mt-0.5" style="color:#948da3">{{ courses().length }} cours créés</p>
          </div>
          <a routerLink="/trainer/courses/new" class="btn-primary">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Nouveau cours
          </a>
        </div>

        <div *ngIf="loading()" class="grid grid-cols-3 gap-4">
          <div *ngFor="let _ of [1,2,3,4,5,6]" class="card p-4 h-48 skeleton"></div>
        </div>

        <div *ngIf="!loading()" class="grid grid-cols-3 gap-4 reveal stagger-1">
          <div *ngFor="let c of courses()" class="card lift-on-hover p-4 flex flex-col">
            <div class="course-thumb mb-3">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
            </div>
            <p class="text-sm font-bold mb-1 flex-1" style="color:#221f2c">{{ c.title }}</p>
            <p class="text-xs mb-3 line-clamp-2" style="color:#948da3">{{ c.description }}</p>
            <div class="flex items-center justify-between mb-3 text-xs">
              <span class="badge-cat">{{ c.category }}</span>
              <span style="color:#948da3">{{ c.enrollmentCount ?? 0 }} inscrits</span>
            </div>
            <div class="flex gap-2">
              <span class="flex-1 text-center py-1.5 rounded-xl text-xs font-medium"
                [style.background]="c.published ? 'rgba(110,231,183,.16)' : 'rgba(167,139,250,.1)'"
                [style.color]="c.published ? '#1f9d6f' : '#948da3'">
                {{ c.published ? 'Publié' : 'Brouillon' }}
              </span>
              <a [routerLink]="'/trainer/courses/' + c.id" class="modify-link flex-1 text-center py-1.5 rounded-xl text-xs font-medium">
                Modifier
              </a>
              <button (click)="deleteCourse(c.id)" class="del-btn px-3 py-1.5 rounded-xl text-xs font-medium">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
          </div>
        </div>

        <div *ngIf="!loading() && courses().length === 0" class="card p-16 text-center bounce-in">
          <svg class="mx-auto mb-4" width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#c4bdd6" stroke-width="1.5"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
          <p class="font-bold text-lg mb-2 font-display" style="color:#221f2c">Aucun cours créé</p>
          <a routerLink="/trainer/courses/new" class="btn-primary inline-flex mt-4">Créer mon premier cours</a>
        </div>
      </main>
    </div>
  `,
  styles: [`
    .course-thumb { width:100%; height:104px; border-radius:18px; background:linear-gradient(135deg,rgba(167,139,250,.85),rgba(251,114,153,.7)); display:flex; align-items:center; justify-content:center; box-shadow:0 12px 30px rgba(167,139,250,.28); }
    .badge-cat { padding:3px 11px; border-radius:999px; background:rgba(167,139,250,.14); color:#7c5ce0; font-weight:600; }
    .modify-link { background:rgba(167,139,250,.12); color:#7c5ce0; text-decoration:none; transition:all .2s; }
    .modify-link:hover { background:rgba(167,139,250,.22); }
    .del-btn { background:rgba(242,92,120,.1); color:#f25c78; border:none; cursor:pointer; transition:all .2s; display:flex; align-items:center; justify-content:center; }
    .del-btn:hover { background:rgba(242,92,120,.2); }
  `],
})
export class TrainerCourses implements OnInit {
  loading = signal(true);
  courses = signal<Course[]>([]);

  get role() { return this.auth.user()?.role ?? 'TRAINER'; }
  get userName() { return this.auth.user()?.name ?? ''; }

  constructor(private auth: AuthService, private api: ApiService) {}

  ngOnInit() {
    this.api.get<Course[]>('/courses/my').subscribe({
      next: data => { this.courses.set(data ?? []); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  deleteCourse(id: string) {
    if (!confirm('Supprimer ce cours ?')) return;
    this.api.delete(`/courses/${id}`).subscribe({
      next: () => this.courses.update(list => list.filter(c => c.id !== id)),
    });
  }
}
