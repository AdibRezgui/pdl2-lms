import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { trigger, style, animate, transition } from '@angular/animations';
import { AuthService } from '../../../core/services/auth';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  animations: [
    trigger('cardIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(28px) scale(.97)' }),
        animate('480ms cubic-bezier(0.23,1,0.32,1)', style({ opacity: 1, transform: 'translateY(0) scale(1)' })),
      ]),
    ]),
  ],
  template: `
    <div class="page">
      <div class="orb orb1 blob-morph"></div>
      <div class="orb orb2 blob-morph"></div>
      <div class="orb orb3 blob-morph"></div>
      <div class="grain"></div>

      <div @cardIn class="card">
        <div class="text-center mb-7 reveal stagger-1">
          <div class="logo mx-auto mb-4 float-soft">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>
            </svg>
          </div>
          <h1 class="title">EduAI <span class="gt">Pro</span></h1>
          <p class="subtitle">Créez votre compte pour commencer</p>
        </div>

        <div *ngIf="error()" class="err-banner mb-4 bounce-in">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          {{ error() }}
        </div>
        <div *ngIf="success()" class="ok-banner mb-4 bounce-in">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
          Compte créé ! Redirection...
        </div>

        <form (ngSubmit)="onSubmit()" class="form reveal stagger-2">
          <div class="field">
            <label>Nom complet</label>
            <input type="text" [(ngModel)]="name" name="name" required placeholder="Prénom Nom" />
          </div>
          <div class="field">
            <label>Email</label>
            <input type="email" [(ngModel)]="email" name="email" required placeholder="votre@email.com" />
          </div>
          <div class="field">
            <label>Mot de passe</label>
            <input type="password" [(ngModel)]="password" name="password" required placeholder="••••••••" />
          </div>
          <div class="field">
            <label>Je suis</label>
            <select [(ngModel)]="role" name="role">
              <option value="STUDENT">Stagiaire</option>
              <option value="TRAINER">Formateur</option>
            </select>
          </div>

          <button type="submit" class="btn-primary" [disabled]="loading()">
            <svg *ngIf="loading()" class="spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
            <span *ngIf="!loading()">Créer mon compte</span>
            <span *ngIf="loading()">Création…</span>
          </button>
        </form>

        <p class="back reveal stagger-3">
          Déjà inscrit ?
          <a routerLink="/login" class="link underline-draw">Se connecter</a>
        </p>
      </div>
    </div>
  `,
  styles: [`
    .page {
      min-height:100vh; display:flex; align-items:center; justify-content:center;
      background: linear-gradient(160deg, #fffdfb 0%, #fdf2f8 50%, #f3edff 100%);
      position:relative; overflow:hidden; padding:20px;
    }
    .grain {
      position:absolute; inset:0; pointer-events:none; opacity:.4;
      background-image: radial-gradient(circle at 1px 1px, rgba(167,139,250,0.08) 1px, transparent 0);
      background-size: 28px 28px;
    }
    .orb { position:absolute; pointer-events:none; }
    .orb1 { width:460px;height:460px;background:radial-gradient(circle, rgba(167,139,250,.32), transparent 70%);filter:blur(70px);top:-160px;right:-140px; }
    .orb2 { width:380px;height:380px;background:radial-gradient(circle, rgba(251,114,153,.26), transparent 70%);filter:blur(70px);bottom:-120px;left:-110px;animation-delay:-5s; }
    .orb3 { width:260px;height:260px;background:radial-gradient(circle, rgba(255,199,218,.4), transparent 70%);filter:blur(60px);top:46%;right:38%;animation-delay:-9s; }

    .card {
      position:relative; z-index:1; width:100%; max-width:440px;
      background:rgba(255,255,255,.72); backdrop-filter:blur(28px) saturate(180%); -webkit-backdrop-filter:blur(28px) saturate(180%);
      border:1px solid rgba(255,255,255,.6); border-radius:32px; padding:40px 36px;
      box-shadow:0 32px 80px rgba(167,139,250,.22), inset 0 1px 0 rgba(255,255,255,.6);
    }
    .logo {
      width:54px;height:54px;border-radius:18px;
      background:linear-gradient(135deg,#a78bfa,#fb7299);
      display:flex;align-items:center;justify-content:center;
      box-shadow:0 10px 30px rgba(167,139,250,.5);
    }
    .title { font-family:'Fraunces',Georgia,serif;font-size:26px;font-weight:700;color:#221f2c;margin:0 0 6px;letter-spacing:-.01em; }
    .gt { background:linear-gradient(135deg,#a78bfa,#fb7299);background-size:200% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;animation:shimmer-flow 5s linear infinite; }
    .subtitle { font-size:13px;color:#948da3;margin:0; }

    .err-banner, .ok-banner { display:flex;align-items:center;gap:8px;padding:11px 15px;border-radius:14px;font-size:13px; }
    .err-banner { background:rgba(242,92,120,.08);border:1px solid rgba(242,92,120,.22);color:#f25c78; }
    .ok-banner { background:rgba(110,231,183,.12);border:1px solid rgba(110,231,183,.3);color:#1f9d6f; }

    .form { display:flex;flex-direction:column;gap:16px; }
    .field { display:flex;flex-direction:column;gap:6px; }
    .field label { font-size:12px;font-weight:600;color:#948da3;letter-spacing:.04em;text-transform:uppercase; }
    .field input, .field select {
      width:100%; padding:12px 15px; border-radius:14px; background:#f8f1fc;
      border:1px solid rgba(167,139,250,.16); color:#221f2c; font-size:14px; font-family:inherit;
      outline:none; transition:all .25s cubic-bezier(.16,1,.3,1); box-sizing:border-box; appearance:none;
    }
    .field select { cursor:pointer; }
    .field input:focus, .field select:focus { border-color:#a78bfa;background:#fff;box-shadow:0 0 0 4px rgba(167,139,250,.16); }

    .btn-primary {
      padding:14px;border-radius:999px;background:linear-gradient(135deg,#a78bfa,#fb7299);border:none;color:white;
      font-size:15px;font-weight:700;cursor:pointer;transition:all .3s cubic-bezier(.16,1,.3,1);font-family:inherit;
      display:flex;align-items:center;justify-content:center;gap:8px;height:48px;
      box-shadow:0 12px 36px rgba(167,139,250,.35); margin-top:2px;
    }
    .btn-primary:hover:not(:disabled) { box-shadow:0 16px 44px rgba(167,139,250,.45);transform:translateY(-2px); }
    .btn-primary:disabled { opacity:.5;cursor:not-allowed; }
    .spin { animation:sp .8s linear infinite; }
    @keyframes sp { from{transform:rotate(0)} to{transform:rotate(360deg)} }

    .back { text-align:center;margin:22px 0 0;font-size:13px;color:#948da3; }
    .link { font-size:13px;color:#a78bfa;text-decoration:none;font-weight:700;margin-left:4px; }
    .link:hover { color:#fb7299; }
  `],
})
export class Register {
  name = '';
  email = '';
  password = '';
  role = 'STUDENT';
  loading = signal(false);
  error = signal('');
  success = signal(false);

  constructor(private auth: AuthService, private router: Router) {}

  onSubmit() {
    if (!this.name || !this.email || !this.password) return;
    this.loading.set(true);
    this.error.set('');

    this.auth.register(this.name, this.email, this.password, this.role).subscribe({
      next: () => {
        this.success.set(true);
        setTimeout(() => {
          const role = this.auth.role();
          if (role === 'TRAINER') this.router.navigate(['/trainer/dashboard']);
          else this.router.navigate(['/student/dashboard']);
        }, 1200);
      },
      error: (e) => {
        this.error.set(e.error?.message || 'Erreur lors de la création du compte');
        this.loading.set(false);
      },
      complete: () => this.loading.set(false),
    });
  }
}
