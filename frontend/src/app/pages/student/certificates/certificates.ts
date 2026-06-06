import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth';
import { ApiService } from '../../../core/services/api';
import { Sidebar } from '../../../shared/sidebar/sidebar';

interface Enrollment {
  id: string;
  completedAt?: string;
  course: { title: string; category: string; level: string; trainerName?: string };
}

@Component({
  selector: 'app-student-certificates',
  standalone: true,
  imports: [CommonModule, Sidebar],
  template: `
    <div class="flex h-screen overflow-hidden" style="background:linear-gradient(160deg,#fffdfb 0%,#fdf2f8 60%,#f6f0ff 100%)">
      <app-sidebar [role]="role" [userName]="userName"></app-sidebar>
      <main class="flex-1 overflow-y-auto p-7">
        <div class="mb-7 reveal">
          <h1 class="font-display text-2xl font-bold" style="color:#221f2c">Mes certificats</h1>
          <p class="text-sm mt-0.5" style="color:#948da3">{{ certificates().length }} cours complétés</p>
        </div>

        <div *ngIf="loading()" class="grid grid-cols-2 gap-4">
          <div *ngFor="let _ of [1,2,3,4]" class="card p-6 h-40 skeleton"></div>
        </div>

        <div *ngIf="!loading() && certificates().length > 0" class="grid grid-cols-2 gap-4 reveal stagger-1">
          <div *ngFor="let e of certificates()" class="card cert-card lift-on-hover p-6 relative overflow-hidden">
            <div class="cert-glow"></div>
            <div class="flex items-start gap-4">
              <div class="cert-badge float-soft">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg>
              </div>
              <div class="flex-1">
                <p class="text-sm font-bold mb-1" style="color:#221f2c">{{ e.course.title }}</p>
                <p class="text-xs mb-1" style="color:#948da3">{{ e.course.category }} • {{ e.course.level }}</p>
                <p class="text-xs" style="color:#948da3" *ngIf="e.course.trainerName">Formateur : {{ e.course.trainerName }}</p>
                <p class="text-xs mt-2 font-semibold" style="color:#1f9d6f" *ngIf="e.completedAt">
                  Complété le {{ e.completedAt | date:'dd MMMM yyyy' }}
                </p>
              </div>
            </div>
            <button class="cert-download mt-4">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Télécharger le certificat
            </button>
          </div>
        </div>

        <div *ngIf="!loading() && certificates().length === 0" class="card p-16 text-center bounce-in">
          <div class="cert-badge mx-auto mb-4 float-soft" style="width:64px;height:64px;border-radius:22px">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg>
          </div>
          <p class="font-bold text-lg mb-2 font-display" style="color:#221f2c">Aucun certificat pour le moment</p>
          <p class="text-sm" style="color:#948da3">Terminez un cours pour obtenir votre premier certificat</p>
        </div>
      </main>
    </div>
  `,
  styles: [`
    .cert-card { border:1px solid rgba(245,165,36,.22) !important; }
    .cert-glow { position:absolute; top:-30px; right:-30px; width:120px; height:120px; border-radius:50%; background:radial-gradient(circle,rgba(245,165,36,.16),transparent 70%); pointer-events:none; }
    .cert-badge { width:54px; height:54px; border-radius:18px; background:linear-gradient(135deg,#f5a524,#fb7299); display:flex; align-items:center; justify-content:center; flex-shrink:0; box-shadow:0 10px 28px rgba(245,165,36,.35); }
    .cert-download { display:flex; align-items:center; justify-content:center; gap:8px; width:100%; padding:10px; border-radius:14px; background:rgba(245,165,36,.12); border:1px solid rgba(245,165,36,.28); color:#e2940f; font-size:12px; font-weight:600; cursor:pointer; transition:all .22s cubic-bezier(.16,1,.3,1); font-family:inherit; }
    .cert-download:hover { background:rgba(245,165,36,.2); transform:translateY(-2px); box-shadow:0 8px 22px rgba(245,165,36,.22); }
  `],
})
export class StudentCertificates implements OnInit {
  loading = signal(true);
  certificates = signal<Enrollment[]>([]);

  get role() { return this.auth.user()?.role ?? 'STUDENT'; }
  get userName() { return this.auth.user()?.name ?? ''; }

  constructor(private auth: AuthService, private api: ApiService) {}

  ngOnInit() {
    this.api.get<Enrollment[]>('/enrollments/completed').subscribe({
      next: data => { this.certificates.set(data ?? []); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }
}
