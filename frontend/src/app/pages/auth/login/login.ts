import { Component, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { trigger, style, animate, transition } from '@angular/animations';
import { AuthService } from '../../../core/services/auth';

const demos = [
  { label: 'Stagiaire',  email: 'student@eduai.tn', password: 'Demo1234!', color: '#a78bfa' },
  { label: 'Formateur',  email: 'trainer@eduai.tn',  password: 'Demo1234!', color: '#fb7299' },
  { label: 'Admin',      email: 'admin@eduai.tn',    password: 'Demo1234!', color: '#f5a524' },
];

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  animations: [
    trigger('cardIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(32px) scale(0.97)' }),
        animate('500ms cubic-bezier(0.23,1,0.32,1)', style({ opacity: 1, transform: 'translateY(0) scale(1)' })),
      ]),
    ]),
  ],
  template: `
    <div class="login-shell">
      <div class="orb orb-1 blob-morph"></div>
      <div class="orb orb-2 blob-morph"></div>
      <div class="orb orb-3 blob-morph"></div>
      <div class="grain"></div>

      <div @cardIn class="login-card">
        <!-- Header -->
        <div class="text-center mb-8 reveal stagger-1">
          <div class="logo-mark mx-auto mb-5 float-soft">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>
            </svg>
          </div>
          <h1 class="font-display text-3xl font-bold mb-1.5" style="color:#221f2c">EduAI <span class="gt">Pro</span></h1>
          <p class="text-sm" style="color:#948da3">Connectez-vous à votre espace</p>
        </div>

        <!-- Demo -->
        <p class="text-xs font-bold mb-3 reveal stagger-2" style="color:#c4bdd6;text-transform:uppercase;letter-spacing:.08em">Accès démo rapide</p>
        <div class="demo-grid mb-5 reveal stagger-2">
          <button *ngFor="let d of demos" (click)="fillDemo(d)" class="demo-btn" [style.--c]="d.color">
            <span class="demo-dot" [style.background]="d.color"></span>{{ d.label }}
          </button>
        </div>

        <div class="divider mb-5 reveal stagger-3"><span>ou vos identifiants</span></div>

        <!-- Error -->
        <div *ngIf="error()" class="error-box mb-4 bounce-in">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          {{ error() }}
        </div>

        <!-- Form -->
        <form [formGroup]="form" (ngSubmit)="submit()" class="reveal stagger-4">
          <div class="fg">
            <label class="fl">Email</label>
            <input formControlName="email" type="email" class="input-field" placeholder="votre@email.com"
              [class.ie]="form.get('email')?.invalid && form.get('email')?.touched" />
            <span *ngIf="form.get('email')?.invalid && form.get('email')?.touched" class="fe">Email invalide</span>
          </div>

          <div class="fg">
            <div class="flex items-center justify-between">
              <label class="fl">Mot de passe</label>
              <a routerLink="/forgot-password" class="fl underline-draw" style="color:#a78bfa;font-weight:600;cursor:pointer">Mot de passe oublié ?</a>
            </div>
            <div class="relative">
              <input formControlName="password" [type]="showPw?'text':'password'" class="input-field" style="padding-right:44px"
                placeholder="••••••••" [class.ie]="form.get('password')?.invalid && form.get('password')?.touched" />
              <button type="button" class="eye-btn" (click)="showPw=!showPw">
                <svg *ngIf="!showPw" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                <svg *ngIf="showPw"  width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
              </button>
            </div>
          </div>

          <button type="submit" class="btn-primary w-full justify-center mt-1" [disabled]="loading()">
            <svg *ngIf="loading()" class="spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
            {{ loading() ? 'Connexion…' : 'Se connecter' }}
          </button>
        </form>

        <p class="text-center text-xs mt-5 reveal stagger-5" style="color:#948da3">
          Pas encore de compte ?
          <a routerLink="/register" style="color:#a78bfa;font-weight:700" class="hover:opacity-75 ml-1 underline-draw">Créer un compte</a>
        </p>
      </div>
    </div>
  `,
  styles: [`
    .login-shell {
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
    .orb-1 { width:520px;height:520px;background:radial-gradient(circle, rgba(167,139,250,.34), transparent 70%);filter:blur(70px);top:-200px;left:-180px; }
    .orb-2 { width:440px;height:440px;background:radial-gradient(circle, rgba(251,114,153,.28), transparent 70%);filter:blur(70px);bottom:-160px;right:-120px;animation-delay:-4s; }
    .orb-3 { width:300px;height:300px;background:radial-gradient(circle, rgba(255,199,218,.4), transparent 70%);filter:blur(60px);top:42%;left:42%;animation-delay:-8s; }
    .login-card {
      width:100%;max-width:430px; position:relative; z-index:1;
      background:rgba(255,255,255,.72);backdrop-filter:blur(28px) saturate(180%);-webkit-backdrop-filter:blur(28px) saturate(180%);
      border:1px solid rgba(255,255,255,.6);border-radius:32px;padding:40px;
      box-shadow:0 32px 80px rgba(167,139,250,.22), inset 0 1px 0 rgba(255,255,255,.6);
    }
    .logo-mark {
      width:54px;height:54px;border-radius:18px;
      background:linear-gradient(135deg,#a78bfa,#fb7299);
      display:flex;align-items:center;justify-content:center;
      box-shadow:0 10px 30px rgba(167,139,250,.5);
    }
    .gt { background:linear-gradient(135deg,#a78bfa,#fb7299);background-size:200% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;animation:shimmer-flow 5s linear infinite; }
    .demo-grid { display:grid;grid-template-columns:repeat(3,1fr);gap:9px; }
    .demo-btn {
      display:flex;align-items:center;justify-content:center;gap:6px;padding:9px 4px;
      border-radius:14px;background:rgba(167,139,250,.05);border:1px solid rgba(167,139,250,.14);
      color:#948da3;font-size:12px;font-weight:600;cursor:pointer;transition:all .25s cubic-bezier(.16,1,.3,1);font-family:inherit;
    }
    .demo-btn:hover { background:#fff;border-color:color-mix(in srgb,var(--c) 45%,transparent);color:#221f2c;transform:translateY(-2px);box-shadow:0 8px 20px rgba(167,139,250,.18); }
    .demo-dot { width:7px;height:7px;border-radius:50%;flex-shrink:0; }
    .divider { display:flex;align-items:center;gap:12px; }
    .divider::before,.divider::after { content:'';flex:1;height:1px;background:rgba(167,139,250,.14); }
    .divider span { font-size:11px;color:#c4bdd6;white-space:nowrap; }
    .error-box { display:flex;align-items:center;gap:8px;padding:11px 15px;border-radius:14px;background:rgba(242,92,120,.08);border:1px solid rgba(242,92,120,.22);color:#f25c78;font-size:13px; }
    .fg { margin-bottom:17px; }
    .fl { display:block;font-size:12.5px;font-weight:600;color:#948da3;margin-bottom:6px; }
    .fe { font-size:11px;color:#f25c78;margin-top:4px;display:block; }
    .ie { border-color:rgba(242,92,120,.4)!important; }
    .eye-btn { position:absolute;right:12px;top:50%;transform:translateY(-50%);background:none;border:none;color:#c4bdd6;cursor:pointer;padding:4px;display:flex;align-items:center;justify-content:center;transition:color .2s; }
    .eye-btn:hover { color:#a78bfa; }
    .spin { animation:sp .8s linear infinite; }
    @keyframes sp { from{transform:rotate(0)}to{transform:rotate(360deg)} }
  `],
})
export class Login {
  form: FormGroup;
  demos = demos;
  loading = signal(false);
  error   = signal('');
  showPw  = false;

  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router) {
    this.form = this.fb.group({
      email:    ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });
  }

  fillDemo(d: { email: string; password: string }) {
    this.form.patchValue({ email: d.email, password: d.password });
    this.error.set('');
  }

  submit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading.set(true); this.error.set('');
    const { email, password } = this.form.value;
    this.auth.login(email, password).subscribe({
      next: (res: any) => {
        this.loading.set(false);
        const role = res?.data?.role ?? this.auth.role();
        if (role === 'TRAINER') this.router.navigate(['/trainer/dashboard']);
        else if (role === 'ADMIN') this.router.navigate(['/admin/dashboard']);
        else this.router.navigate(['/student/dashboard']);
      },
      error: (e: any) => { this.loading.set(false); this.error.set(e?.error?.message ?? 'Identifiants incorrects'); },
    });
  }
}
