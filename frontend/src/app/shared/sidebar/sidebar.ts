import { Component, Input, signal, computed } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { trigger, state, style, animate, transition } from '@angular/animations';
import { AuthService } from '../../core/services/auth';

interface NavItem { label: string; path: string; icon: string; exact?: boolean }

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  animations: [
    trigger('fadeSlide', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateX(-12px)' }),
        animate('300ms cubic-bezier(0.23,1,0.32,1)', style({ opacity: 1, transform: 'translateX(0)' })),
      ]),
    ]),
  ],
  template: `
    <aside @fadeSlide class="sidebar">
      <!-- Logo -->
      <div class="sidebar-logo">
        <img src="logo-sip.jpg" alt="Smart IT Partner" class="company-logo"
             [style.display]="logoFailed ? 'none' : 'block'"
             (error)="logoFailed = true" />
        <div class="logo-fallback" [style.display]="logoFailed ? 'flex' : 'none'">
          <div class="logo-mark">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>
            </svg>
          </div>
          <div>
            <p class="logo-name">Smart IT Partner</p>
            <p class="logo-role">{{ roleLabel }}</p>
          </div>
        </div>
      </div>

      <!-- Nav -->
      <nav class="sidebar-nav">
        <p class="nav-group-label">Menu principal</p>
        <a *ngFor="let item of navItems"
           [routerLink]="item.path"
           routerLinkActive="nav-active"
           [routerLinkActiveOptions]="{ exact: false }"
           class="nav-item">
          <span class="nav-icon" [innerHTML]="item.icon"></span>
          <span>{{ item.label }}</span>
        </a>
      </nav>

      <!-- User card -->
      <div class="sidebar-footer">
        <a [routerLink]="profilePath" class="user-card" style="text-decoration:none;cursor:pointer">
          <div class="user-avatar">
            <img *ngIf="resolvedAvatar" [src]="resolvedAvatar" class="avatar-photo" alt="Photo de profil" />
            <span *ngIf="!resolvedAvatar">{{ initials }}</span>
          </div>
          <div class="user-info">
            <p class="user-name">{{ userName }}</p>
            <p class="user-role">{{ roleLabel }}</p>
          </div>
        </a>
        <button class="logout-btn" (click)="logout()">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          Déconnexion
        </button>
      </div>
    </aside>
  `,
  styles: [`
    .sidebar {
      width: 268px;
      min-width: 268px;
      height: 100vh;
      display: flex;
      flex-direction: column;
      background: linear-gradient(180deg, #f5fdfe 0%, #e8f8fb 100%);
      border-right: 1px solid rgba(0,180,198,0.14);
      position: sticky;
      top: 0;
      overflow: hidden;
    }

    .sidebar-logo {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px 16px 16px;
      border-bottom: 1px solid rgba(0,180,198,0.10);
    }

    .logo-mark {
      width: 40px;
      height: 40px;
      border-radius: 14px;
      background: linear-gradient(135deg, #00B4C6, #007A8A);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      box-shadow: 0 6px 20px rgba(0,180,198,0.45);
      transition: transform 0.4s cubic-bezier(0.34,1.56,0.64,1);
    }
    .sidebar-logo:hover .logo-mark { transform: rotate(-8deg) scale(1.06); }

    .company-logo {
      height: 72px;
      width: auto;
      max-width: 210px;
      object-fit: contain;
      border-radius: 10px;
      filter: drop-shadow(0 4px 12px rgba(0,180,198,0.15));
      transition: filter 0.3s ease;
    }
    .company-logo:hover {
      filter: drop-shadow(0 6px 18px rgba(0,180,198,0.28));
    }

    .logo-fallback {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
    }

    .avatar-photo {
      width: 100%;
      height: 100%;
      border-radius: 12px;
      object-fit: cover;
    }

    .logo-name {
      font-family: 'Fraunces', Georgia, serif;
      font-size: 16px;
      font-weight: 700;
      color: #1a2d3a;
      margin: 0;
      line-height: 1.2;
      letter-spacing: -0.01em;
    }

    .logo-role {
      font-size: 11px;
      color: #5a7a8a;
      margin: 0;
      text-transform: capitalize;
    }

    .sidebar-nav {
      flex: 1;
      padding: 18px 14px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 3px;
    }

    .nav-group-label {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #8aaabb;
      margin: 0 10px 10px;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 11px;
      padding: 10px 14px;
      border-radius: 14px;
      border: 1px solid transparent;
      color: #5a7a8a;
      font-size: 13.5px;
      font-weight: 500;
      text-decoration: none;
      transition: all 0.25s cubic-bezier(0.16,1,0.3,1);
      cursor: pointer;

      &:hover {
        color: #2c3d4e;
        background: rgba(0,180,198,0.08);
        border-color: rgba(0,180,198,0.14);
        transform: translateX(3px);
      }
    }

    .nav-active {
      color: #007A8A !important;
      background: linear-gradient(135deg, rgba(0,180,198,0.16), rgba(0,122,138,0.10)) !important;
      border-color: rgba(0,180,198,0.28) !important;
      font-weight: 700 !important;
      box-shadow: 0 4px 16px rgba(0,180,198,0.16);

      .nav-icon { filter: none; opacity: 1; transform: scale(1.08); }
    }

    .nav-icon {
      width: 18px;
      height: 18px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      opacity: 0.6;
      transition: transform 0.25s cubic-bezier(0.34,1.56,0.64,1);
    }

    .nav-active .nav-icon { opacity: 1; }

    .sidebar-footer {
      padding: 14px;
      border-top: 1px solid rgba(0,180,198,0.10);
      display: flex;
      flex-direction: column;
      gap: 9px;
    }

    .user-card {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 11px 13px;
      border-radius: 16px;
      background: rgba(255,255,255,0.7);
      border: 1px solid rgba(0,180,198,0.14);
      transition: all 0.25s cubic-bezier(0.16,1,0.3,1);

      &:hover {
        background: #ffffff;
        border-color: rgba(0,180,198,0.3);
        transform: translateY(-1px);
        box-shadow: 0 8px 24px rgba(0,180,198,0.18);
      }
    }

    .user-avatar {
      width: 36px;
      height: 36px;
      border-radius: 12px;
      background: linear-gradient(135deg, #00B4C6, #007A8A);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: 800;
      color: #ffffff;
      flex-shrink: 0;
      box-shadow: 0 4px 14px rgba(0,180,198,0.4);
    }

    .user-info { flex: 1; min-width: 0; }

    .user-name {
      font-size: 13px;
      font-weight: 700;
      color: #1a2d3a;
      margin: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .user-role {
      font-size: 11px;
      color: #5a7a8a;
      margin: 0;
      text-transform: capitalize;
    }

    .logout-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 7px;
      width: 100%;
      padding: 10px;
      border-radius: 14px;
      border: 1px solid transparent;
      background: transparent;
      color: #5a7a8a;
      font-size: 12.5px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.25s cubic-bezier(0.16,1,0.3,1);
      font-family: inherit;

      &:hover {
        background: rgba(242,92,120,0.08);
        border-color: rgba(242,92,120,0.2);
        color: #f25c78;
        transform: translateY(-1px);
      }
    }

    .gradient-text {
      background: linear-gradient(135deg, #00B4C6, #007A8A);
      background-size: 200% auto;
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
  `],
})
export class Sidebar {
  @Input() role: string = 'STUDENT';
  @Input() userName: string = '';

  logoFailed = false;

  get resolvedAvatar(): string {
    const av = this.auth.user()?.avatar;
    if (!av) return '';
    return av.startsWith('http') ? av : '/api' + av;
  }

  get initials() {
    return this.userName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'U';
  }

  get roleLabel() {
    const map: Record<string, string> = { STUDENT: 'Stagiaire', TRAINER: 'Formateur', ADMIN: 'Administrateur' };
    return map[this.role] ?? this.role;
  }

  get profilePath() {
    const map: Record<string, string> = { STUDENT: '/student/profile', TRAINER: '/trainer/profile', ADMIN: '/admin/profile' };
    return map[this.role] ?? '/student/profile';
  }

  get navItems(): NavItem[] {
    const svg = (d: string) => `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;

    const studentNav: NavItem[] = [
      { label: 'Tableau de bord', path: '/student/dashboard',   icon: svg('<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>') },
      { label: 'Mes cours',       path: '/student/courses',     icon: svg('<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>') },
      { label: 'Progression',     path: '/student/progress',    icon: svg('<line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>') },
      { label: 'Mes Badges',      path: '/student/evaluations', icon: svg('<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>') },
      { label: 'Mon Parcours',    path: '/student/parcours',    icon: svg('<path d="M3 12h18"/><path d="M3 6h18"/><path d="M3 18h11"/>') },
      { label: 'Certificats',     path: '/student/certificates',icon: svg('<circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/>') },
      { label: 'Assistant IA',    path: '/student/chat',        icon: svg('<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>') },
    ];

    const trainerNav: NavItem[] = [
      { label: 'Tableau de bord', path: '/trainer/dashboard',   icon: svg('<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>') },
      { label: 'Mes cours',       path: '/trainer/courses',     icon: svg('<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>') },
      { label: 'Mes stagiaires',  path: '/trainer/students',    icon: svg('<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>') },
      { label: 'Analytics',       path: '/trainer/analytics',   icon: svg('<line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>') },
    ];

    const adminNav: NavItem[] = [
      { label: 'Tableau de bord', path: '/admin/dashboard', icon: svg('<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>') },
      { label: 'Utilisateurs',    path: '/admin/users',     icon: svg('<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>') },
      { label: 'Cours',           path: '/admin/courses',  icon: svg('<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>') },
      { label: 'Analytics',        path: '/admin/analytics',   icon: svg('<line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>') },
      { label: 'Monitoring',       path: '/admin/monitoring',  icon: svg('<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>') },
      { label: 'Sécurité',         path: '/admin/security',    icon: svg('<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>') },
    ];

    if (this.role === 'TRAINER') return trainerNav;
    if (this.role === 'ADMIN')   return adminNav;
    return studentNav;
  }

  constructor(private auth: AuthService) {}
  logout() { this.auth.logout(); }
}
