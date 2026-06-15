import { Routes } from '@angular/router';
import { authGuard } from '../app/core/guards/auth-guard';
import { roleGuard } from '../app/core/guards/role-guard';

export const adminRoutes: Routes = [
  // Login page (root of admin app)
  { path: '', loadComponent: () => import('../app/pages/auth/admin-login/admin-login').then(m => m.AdminLogin) },
  // Redirect /login → root (handles AuthService.logout() which navigates to /login)
  { path: 'login', redirectTo: '', pathMatch: 'full' },

  // Protected admin area
  {
    path: 'admin',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ADMIN'] },
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', loadComponent: () => import('../app/pages/admin/dashboard/dashboard').then(m => m.AdminDashboard) },
      { path: 'users',     loadComponent: () => import('../app/pages/admin/users/users').then(m => m.AdminUsers) },
      { path: 'courses',   loadComponent: () => import('../app/pages/admin/courses/courses').then(m => m.AdminCourses) },
      { path: 'analytics', loadComponent: () => import('../app/pages/admin/analytics/analytics').then(m => m.AdminAnalytics) },
      { path: 'monitoring',loadComponent: () => import('../app/pages/admin/monitoring/monitoring').then(m => m.AdminMonitoring) },
      { path: 'security',  loadComponent: () => import('../app/pages/admin/security/security').then(m => m.AdminSecurity) },
      { path: 'profile',   loadComponent: () => import('../app/pages/shared/profile/profile').then(m => m.ProfilePage) },
    ],
  },

  { path: '**', redirectTo: '' },
];
