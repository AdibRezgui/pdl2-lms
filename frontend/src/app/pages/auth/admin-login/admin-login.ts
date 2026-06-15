import { Component, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="shell">

      <!-- Left: branding panel -->
      <div class="visual">
        <div class="visual-overlay"></div>
        <div class="visual-content">
          <div class="logo-block">
            <div class="logo-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </div>
            <span class="logo-label">Smart IT Partner</span>
          </div>
          <div class="visual-text">
            <h1 class="visual-title">Espace<br/>Administration</h1>
            <p class="visual-sub">Accès restreint au personnel autorisé uniquement.</p>
          </div>
          <div class="visual-badges">
            <div class="badge">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              Connexion chiffrée TLS
            </div>
            <div class="badge">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              Accès journalisé
            </div>
          </div>
        </div>
      </div>

      <!-- Right: login form -->
      <div class="panel">
        <div class="card">

          <div class="card-header">
            <div class="shield-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#00B4C6" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            </div>
            <h2 class="card-title">Portail Administrateur</h2>
            <p class="card-sub">Identifiants réservés aux administrateurs système</p>
          </div>

          <div *ngIf="error()" class="err-box">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            {{ error() }}
          </div>

          <form [formGroup]="form" (ngSubmit)="submit()">
            <div class="fg">
              <label class="fl">Adresse email administrateur</label>
              <div class="input-wrap">
                <svg class="input-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                <input formControlName="email" type="email" class="input-field"
                       placeholder="admin@domaine.com"
                       [class.input-err]="form.get('email')?.invalid && form.get('email')?.touched" />
              </div>
              <span *ngIf="form.get('email')?.invalid && form.get('email')?.touched" class="fe">Email invalide</span>
            </div>

            <div class="fg">
              <label class="fl">Mot de passe</label>
              <div class="input-wrap">
                <svg class="input-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                <input formControlName="password" [type]="showPw ? 'text' : 'password'"
                       class="input-field pr-icon" placeholder="••••••••"
                       [class.input-err]="form.get('password')?.invalid && form.get('password')?.touched" />
                <button type="button" class="eye-btn" (click)="showPw = !showPw">
                  <svg *ngIf="!showPw" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  <svg *ngIf="showPw"  width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                </button>
              </div>
            </div>

            <button type="submit" class="submit-btn" [disabled]="loading()">
              <svg *ngIf="loading()" class="spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
              <svg *ngIf="!loading()" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              {{ loading() ? 'Vérification…' : 'Accéder au panneau admin' }}
            </button>
          </form>

          <p class="back-link">
            <a href="http://localhost:4200/login">← Connexion espace utilisateurs</a>
          </p>

          <div class="warning-box">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#d97706" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            Toute tentative d'accès non autorisée est journalisée et susceptible de poursuites.
          </div>

        </div>
      </div>

    </div>
  `,
  styles: [`
    .shell { display:flex;height:100vh;overflow:hidden;background:#0f1923; }

    /* Left visual */
    .visual { flex:0 0 42%;position:relative;overflow:hidden;background:linear-gradient(160deg,#0d1f2d 0%,#0a1621 50%,#071218 100%); }
    .visual::before { content:'';position:absolute;inset:0;background-image:radial-gradient(circle at 1px 1px,rgba(0,180,198,.06) 1px,transparent 0);background-size:28px 28px; }
    .visual-overlay { position:absolute;inset:0;background:radial-gradient(ellipse at 30% 60%,rgba(0,180,198,.12) 0%,transparent 70%); }
    .visual-content { position:relative;z-index:1;height:100%;display:flex;flex-direction:column;padding:40px; }
    .logo-block { display:flex;align-items:center;gap:12px;margin-bottom:auto; }
    .logo-icon { width:46px;height:46px;border-radius:14px;background:linear-gradient(135deg,#00B4C6,#007A8A);display:flex;align-items:center;justify-content:center;box-shadow:0 8px 24px rgba(0,180,198,.4); }
    .logo-label { color:rgba(255,255,255,.85);font-size:15px;font-weight:700;letter-spacing:-.01em; }
    .visual-text { padding:40px 0; }
    .visual-title { font-family:'Fraunces',Georgia,serif;font-size:42px;font-weight:800;color:#fff;line-height:1.1;margin:0 0 16px;letter-spacing:-.02em; }
    .visual-sub { font-size:14px;color:rgba(255,255,255,.5);line-height:1.6;margin:0;max-width:280px; }
    .visual-badges { display:flex;flex-direction:column;gap:8px;margin-top:auto; }
    .badge { display:inline-flex;align-items:center;gap:8px;padding:8px 14px;border-radius:10px;background:rgba(0,180,198,.08);border:1px solid rgba(0,180,198,.18);color:rgba(0,180,198,.85);font-size:12px;font-weight:600; }
    @media (max-width:900px) { .visual { display:none; } }

    /* Right panel */
    .panel { flex:1;display:flex;align-items:center;justify-content:center;background:#111c26;padding:32px 24px;overflow-y:auto; }
    .card { width:100%;max-width:400px; }

    /* Card header */
    .card-header { text-align:center;margin-bottom:28px; }
    .shield-icon { width:56px;height:56px;border-radius:18px;background:rgba(0,180,198,.1);border:1px solid rgba(0,180,198,.2);display:flex;align-items:center;justify-content:center;margin:0 auto 16px; }
    .card-title { font-family:'Fraunces',Georgia,serif;font-size:22px;font-weight:800;color:#e8f4f8;margin:0 0 6px;letter-spacing:-.01em; }
    .card-sub { font-size:13px;color:#4a6878;margin:0; }

    /* Error */
    .err-box { display:flex;align-items:center;gap:8px;padding:11px 14px;border-radius:12px;background:rgba(242,92,120,.08);border:1px solid rgba(242,92,120,.22);color:#f25c78;font-size:13px;margin-bottom:18px; }

    /* Form */
    .fg { margin-bottom:16px; }
    .fl { display:block;font-size:12px;font-weight:600;color:#4a6878;margin-bottom:7px;text-transform:uppercase;letter-spacing:.04em; }
    .fe { font-size:11px;color:#f25c78;margin-top:4px;display:block; }
    .input-wrap { position:relative; }
    .input-icon { position:absolute;left:13px;top:50%;transform:translateY(-50%);color:#2a4050;pointer-events:none;z-index:1; }
    .input-field { width:100%;height:46px;border:1.5px solid rgba(0,180,198,.15);border-radius:13px;background:rgba(255,255,255,.04);padding:0 14px 0 40px;font-size:14px;color:#c8dce8;font-family:inherit;transition:all .22s;outline:none;box-sizing:border-box; }
    .input-field.pr-icon { padding-right:44px; }
    .input-field::placeholder { color:#2a4050; }
    .input-field:focus { border-color:#00B4C6;background:rgba(0,180,198,.06);box-shadow:0 0 0 3px rgba(0,180,198,.1); }
    .input-field.input-err { border-color:rgba(242,92,120,.4); }
    .eye-btn { position:absolute;right:12px;top:50%;transform:translateY(-50%);background:none;border:none;color:#2a4050;cursor:pointer;padding:4px;display:flex;align-items:center; }
    .eye-btn:hover { color:#00B4C6; }

    /* Submit */
    .submit-btn { width:100%;height:50px;display:flex;align-items:center;justify-content:center;gap:9px;border-radius:14px;border:none;cursor:pointer;background:linear-gradient(135deg,#00B4C6,#007A8A);color:#fff;font-size:15px;font-weight:700;font-family:inherit;transition:all .3s;box-shadow:0 6px 24px rgba(0,180,198,.3);margin-top:6px; }
    .submit-btn:hover:not(:disabled) { transform:translateY(-2px);box-shadow:0 10px 32px rgba(0,180,198,.45); }
    .submit-btn:disabled { opacity:.5;cursor:not-allowed;transform:none; }
    .spin { animation:sp .8s linear infinite; }
    @keyframes sp { to { transform:rotate(360deg); } }

    /* Back + warning */
    .back-link { text-align:center;margin-top:20px; }
    .back-link a { font-size:12px;color:#2a4050;text-decoration:none;transition:color .2s; }
    .back-link a:hover { color:#00B4C6; }
    .warning-box { display:flex;align-items:flex-start;gap:8px;padding:11px 14px;border-radius:12px;background:rgba(245,165,36,.06);border:1px solid rgba(245,165,36,.18);color:#92670a;font-size:11.5px;line-height:1.5;margin-top:20px; }
  `],
})
export class AdminLogin {
  form: FormGroup;
  loading = signal(false);
  error   = signal('');
  showPw  = false;

  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router) {
    this.form = this.fb.group({
      email:    ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });
  }

  submit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading.set(true);
    this.error.set('');
    const { email, password } = this.form.value;
    this.auth.login(email, password).subscribe({
      next: (res: any) => {
        this.loading.set(false);
        const role = res?.data?.role ?? this.auth.role();
        if (role !== 'ADMIN') {
          this.auth.clearSession();
          this.error.set('Accès refusé — cet espace est réservé aux administrateurs système.');
          return;
        }
        this.router.navigate(['/admin/dashboard']);
      },
      error: (e: any) => {
        this.loading.set(false);
        const msg = e?.error?.message ?? e?.message ?? '';
        this.error.set(msg || 'Email ou mot de passe incorrect');
      },
    });
  }
}
