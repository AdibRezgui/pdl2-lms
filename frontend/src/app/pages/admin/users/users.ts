import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth';
import { ApiService } from '../../../core/services/api';
import { ToastService } from '../../../core/services/toast';
import { Sidebar } from '../../../shared/sidebar/sidebar';

interface User { id: string; name: string; email: string; role: string; enabled: boolean; createdAt?: string }

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, FormsModule, Sidebar],
  template: `
    <div class="flex h-screen overflow-hidden" style="background:linear-gradient(160deg,#f5fdfe 0%,#edf9fb 60%,#daf2f6 100%)">
      <app-sidebar [role]="role" [userName]="userName"></app-sidebar>
      <main class="flex-1 overflow-y-auto p-7">
        <div class="mb-6 flex items-center justify-between reveal">
          <div>
            <h1 class="font-display text-2xl font-bold" style="color:#1a2d3a">Gestion des utilisateurs</h1>
            <p class="text-sm mt-0.5" style="color:#5a7a8a">{{ users().length }} utilisateur(s)</p>
          </div>
          <div class="flex gap-3">
            <input [(ngModel)]="search" placeholder="Rechercher..." class="input-field w-48 text-sm" />
            <select [(ngModel)]="roleFilter" class="input-field text-sm">
              <option value="">Tous les rôles</option>
              <option value="STUDENT">Stagiaire</option>
              <option value="TRAINER">Formateur</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>
        </div>

        <div *ngIf="loading()" class="space-y-3">
          <div *ngFor="let _ of [1,2,3,4,5,6]" class="card p-4 h-14 skeleton"></div>
        </div>

        <div *ngIf="!loading()" class="card overflow-hidden reveal stagger-1">
          <table class="data-table w-full">
            <thead>
              <tr>
                <th class="text-left font-medium p-4">Utilisateur</th>
                <th class="text-left font-medium p-4">Email</th>
                <th class="text-left font-medium p-4">Rôle</th>
                <th class="text-left font-medium p-4">Statut</th>
                <th class="text-left font-medium p-4">Inscrit le</th>
                <th class="text-left font-medium p-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let u of filtered()">
                <td class="p-4">
                  <div class="flex items-center gap-2.5">
                    <div class="avatar-chip" [style.background]="roleGradient(u.role)">{{ u.name[0] }}</div>
                    <span class="text-sm font-semibold" style="color:#1a2d3a">{{ u.name }}</span>
                  </div>
                </td>
                <td class="p-4 text-xs" style="color:#5a7a8a">{{ u.email }}</td>
                <td class="p-4">
                  <span class="role-pill" [style.background]="roleBg(u.role)" [style.color]="roleText(u.role)">{{ u.role }}</span>
                </td>
                <td class="p-4">
                  <span class="role-pill" [style.background]="u.enabled ? 'rgba(110,231,183,.16)' : 'rgba(242,92,120,.12)'" [style.color]="u.enabled ? '#1f9d6f' : '#f25c78'">
                    {{ u.enabled ? 'Actif' : 'Inactif' }}
                  </span>
                </td>
                <td class="p-4 text-xs" style="color:#5a7a8a">{{ u.createdAt | date:'dd/MM/yyyy' }}</td>
                <td class="p-4">
                  <div class="flex gap-2">
                    <button (click)="toggleStatus(u)" class="action-btn" [style.background]="u.enabled ? 'rgba(242,92,120,.1)' : 'rgba(110,231,183,.14)'" [style.color]="u.enabled ? '#f25c78' : '#1f9d6f'">
                      {{ u.enabled ? 'Désactiver' : 'Activer' }}
                    </button>
                    <button (click)="deleteUser(u.id)" class="del-icon-btn" aria-label="Supprimer">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                  </div>
                </td>
              </tr>
              <tr *ngIf="filtered().length === 0">
                <td colspan="6" class="p-8 text-center text-sm" style="color:#5a7a8a">Aucun utilisateur trouvé</td>
              </tr>
            </tbody>
          </table>
        </div>
      </main>
    </div>
  `,
  styles: [`
    .avatar-chip { width:32px; height:32px; border-radius:10px; display:flex; align-items:center; justify-content:center; font-size:12px; font-weight:800; color:#fff; flex-shrink:0; }
    .role-pill { font-size:11px; padding:3px 11px; border-radius:999px; font-weight:600; }
    .action-btn { padding:6px 11px; border-radius:10px; font-size:12px; font-weight:600; border:none; cursor:pointer; transition:all .2s; }
    .action-btn:hover { filter:brightness(.94); }
    .del-icon-btn { width:30px; height:30px; border-radius:10px; background:rgba(0,180,198,.08); border:none; color:#5a7a8a; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:all .2s; }
    .del-icon-btn:hover { background:rgba(242,92,120,.14); color:#f25c78; }
  `],
})
export class AdminUsers implements OnInit {
  loading = signal(true);
  users = signal<User[]>([]);
  search = '';
  roleFilter = '';

  filtered = computed(() => {
    let list = this.users();
    if (this.search) { const s = this.search.toLowerCase(); list = list.filter(u => u.name.toLowerCase().includes(s) || u.email.toLowerCase().includes(s)); }
    if (this.roleFilter) list = list.filter(u => u.role === this.roleFilter);
    return list;
  });

  get role() { return this.auth.user()?.role ?? 'ADMIN'; }
  get userName() { return this.auth.user()?.name ?? ''; }

  roleGradient(r: string) { return { ADMIN: 'linear-gradient(135deg,#f5a524,#e2940f)', TRAINER: 'linear-gradient(135deg,#00A8BC,#f25c78)', STUDENT: 'linear-gradient(135deg,#00B4C6,#0099AE)' }[r] ?? 'rgba(0,180,198,.4)'; }
  roleBg(r: string) { return { ADMIN: 'rgba(245,165,36,.14)', TRAINER: 'rgba(0,168,188,.14)', STUDENT: 'rgba(0,180,198,.14)' }[r] ?? 'rgba(0,180,198,.1)'; }
  roleText(r: string) { return { ADMIN: '#e2940f', TRAINER: '#e85586', STUDENT: '#007A8A' }[r] ?? '#007A8A'; }

  constructor(private auth: AuthService, private api: ApiService, private toast: ToastService) {}

  ngOnInit() {
    this.api.get<User[]>('/admin/users').subscribe({
      next: data => {
        const list = Array.isArray(data) ? data : (data as any)?.content ?? [];
        this.users.set(list);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  toggleStatus(user: User) {
    this.api.put(`/admin/users/${user.id}/toggle-active`).subscribe({
      next: () => this.users.update(list => list.map(u => u.id === user.id ? { ...u, enabled: !u.enabled } : u)),
    });
  }

  deleteUser(id: string) {
    this.toast.confirm('Supprimer cet utilisateur définitivement ?').then(ok => {
      if (!ok) return;
      this.api.delete(`/admin/users/${id}`).subscribe({
        next: () => {
          this.users.update(list => list.filter(u => u.id !== id));
          this.toast.success('Utilisateur supprimé.');
        },
        error: () => this.toast.error('Impossible de supprimer cet utilisateur.'),
      });
    });
  }
}
