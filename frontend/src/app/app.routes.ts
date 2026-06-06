import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth-guard';
import { roleGuard } from './core/guards/role-guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },

  // Auth
  { path: 'login',          loadComponent: () => import('./pages/auth/login/login').then(m => m.Login) },
  { path: 'register',       loadComponent: () => import('./pages/auth/register/register').then(m => m.Register) },
  { path: 'forgot-password',loadComponent: () => import('./pages/auth/forgot-password/forgot-password').then(m => m.ForgotPassword) },
  { path: 'reset-password', loadComponent: () => import('./pages/auth/reset-password/reset-password').then(m => m.ResetPassword) },

  // Student
  {
    path: 'student',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['STUDENT'] },
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard',   loadComponent: () => import('./pages/student/dashboard/dashboard').then(m => m.StudentDashboard) },
      { path: 'courses',     loadComponent: () => import('./pages/student/courses/courses').then(m => m.StudentCourses) },
      { path: 'progress',    loadComponent: () => import('./pages/student/progress/progress').then(m => m.StudentProgress) },
      { path: 'evaluations', loadComponent: () => import('./pages/student/evaluations/evaluations').then(m => m.StudentEvaluations) },
      { path: 'certificates',loadComponent: () => import('./pages/student/certificates/certificates').then(m => m.StudentCertificates) },
      { path: 'chat',        loadComponent: () => import('./pages/student/chat/chat').then(m => m.StudentChat) },
      { path: 'profile',     loadComponent: () => import('./pages/shared/profile/profile').then(m => m.ProfilePage) },
    ],
  },

  // Trainer
  {
    path: 'trainer',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['TRAINER'] },
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard',   loadComponent: () => import('./pages/trainer/dashboard/dashboard').then(m => m.TrainerDashboard) },
      { path: 'courses',     loadComponent: () => import('./pages/trainer/courses/courses').then(m => m.TrainerCourses) },
      { path: 'courses/new', loadComponent: () => import('./pages/trainer/course-form/course-form').then(m => m.CourseForm) },
      { path: 'courses/:id', loadComponent: () => import('./pages/trainer/course-form/course-form').then(m => m.CourseForm) },
      { path: 'students',    loadComponent: () => import('./pages/trainer/students/students').then(m => m.TrainerStudents) },
      { path: 'analytics',   loadComponent: () => import('./pages/trainer/analytics/analytics').then(m => m.TrainerAnalytics) },
      { path: 'evaluations', loadComponent: () => import('./pages/trainer/evaluations/evaluations').then(m => m.TrainerEvaluations) },
      { path: 'profile',     loadComponent: () => import('./pages/shared/profile/profile').then(m => m.ProfilePage) },
    ],
  },

  // Admin
  {
    path: 'admin',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ADMIN'] },
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', loadComponent: () => import('./pages/admin/dashboard/dashboard').then(m => m.AdminDashboard) },
      { path: 'users',     loadComponent: () => import('./pages/admin/users/users').then(m => m.AdminUsers) },
      { path: 'analytics', loadComponent: () => import('./pages/admin/analytics/analytics').then(m => m.AdminAnalytics) },
      { path: 'profile',   loadComponent: () => import('./pages/shared/profile/profile').then(m => m.ProfilePage) },
    ],
  },

  { path: '**', redirectTo: 'login' },
];
