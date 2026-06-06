import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { trigger, style, animate, transition } from '@angular/animations';
import { ApiService } from '../../../core/services/api';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  animations: [
    trigger('cardIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(24px) scale(.97)' }),
        animate('420ms cubic-bezier(0.23,1,0.32,1)', style({ opacity: 1, transform: 'translateY(0) scale(1)' })),
      ]),
    ]),
  ],
  template: `
    <div class="page">
      <div class="orb orb1 blob-morph"></div>
      <div class="orb orb2 blob-morph"></div>

      <div @cardIn class="card">
        <div class="logo">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
        </div>

        <ng-container *ngIf="!done()">
          <h1 class="title">Nouveau mot de passe</h1>
          <p class="subtitle">Choisissez un mot de passe sécurisé d'au moins 8 caractères.</p>

          <div class="err-banner" *ngIf="!token">
            Lien invalide. <a routerLink="/forgot-password" class="link">Demandez-en un nouveau.</a>
          </div>

          <form [formGroup]="form" (ngSubmit)="submit()" class="form" *ngIf="token">
            <div class="field">
              <label>Nouveau mot de passe</label>
              <div class="pw-wrap">
                <input formControlName="password" [type]="showPw ? 'text' : 'password'" placeholder="••••••••"
                  [class.invalid]="form.get('password')?.invalid && form.get('password')?.touched" />
                <button type="button" class="eye" (click)="showPw = !showPw">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path *ngIf="!showPw" d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle *ngIf="!showPw" cx="12" cy="12" r="3"/>
                    <path *ngIf="showPw" d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line *ngIf="showPw" x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                </button>
              </div>
              <span class="err" *ngIf="form.get('password')?.invalid && form.get('password')?.touched">Min. 8 caractères</span>
            </div>

            <div class="field">
              <label>Confirmer le mot de passe</label>
              <input formControlName="confirm" [type]="showPw ? 'text' : 'password'" placeholder="••••••••"
                [class.invalid]="form.errors?.['mismatch'] && form.get('confirm')?.touched" />
              <span class="err" *ngIf="form.errors?.['mismatch'] && form.get('confirm')?.touched">Les mots de passe ne correspondent pas</span>
            </div>

            <div class="err-banner" *ngIf="error()">{{ error() }}</div>

            <button type="submit" class="btn-primary" [disabled]="form.invalid || loading()">
              <span *ngIf="!loading()">Réinitialiser</span>
              <span *ngIf="loading()" class="spinner"></span>
            </button>
          </form>
        </ng-container>

        <ng-container *ngIf="done()">
          <div class="success-box">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#34d399" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
            <h2 style="color:#34d399;font-size:16px;font-weight:700;margin:14px 0 6px">Mot de passe mis à jour !</h2>
            <p style="color:#64748b;font-size:13px;text-align:center">Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.</p>
            <a routerLink="/login" class="btn-primary" style="margin-top:20px;text-decoration:none;display:block;text-align:center">
              Aller à la connexion
            </a>
          </div>
        </ng-container>

        <p class="back" *ngIf="!done()">
          <a routerLink="/login" class="link">← Retour à la connexion</a>
        </p>
      </div>
    </div>
  `,
  styles: [`
    .page { min-height:100vh;display:flex;align-items:center;justify-content:center;background:linear-gradient(160deg,#fffdfb 0%,#fdf2f8 50%,#f3edff 100%);position:relative;overflow:hidden;padding:20px; }
    .orb { position:absolute;pointer-events:none;animation:orb-float 12s ease-in-out infinite alternate; }
    .orb1 { width:420px;height:420px;background:radial-gradient(circle,rgba(167,139,250,.32),transparent 70%);filter:blur(70px);top:-140px;left:-110px; }
    .orb2 { width:340px;height:340px;background:radial-gradient(circle,rgba(251,114,153,.26),transparent 70%);filter:blur(70px);bottom:-90px;right:-90px;animation-delay:-5s; }
    .card { position:relative;z-index:1;width:100%;max-width:430px;background:rgba(255,255,255,.72);backdrop-filter:blur(28px) saturate(180%);-webkit-backdrop-filter:blur(28px) saturate(180%);border:1px solid rgba(255,255,255,.6);border-radius:32px;padding:40px 36px;box-shadow:0 32px 80px rgba(167,139,250,.22),inset 0 1px 0 rgba(255,255,255,.6); }
    .logo { width:52px;height:52px;border-radius:18px;background:linear-gradient(135deg,#a78bfa,#fb7299);display:flex;align-items:center;justify-content:center;margin:0 auto 20px;box-shadow:0 10px 30px rgba(167,139,250,.5); }
    .title { font-family:'Fraunces',Georgia,serif;font-size:24px;font-weight:700;color:#221f2c;text-align:center;margin:0 0 8px;letter-spacing:-.01em; }
    .subtitle { font-size:13px;color:#948da3;text-align:center;margin:0 0 26px;line-height:1.6; }
    .form { display:flex;flex-direction:column;gap:17px; }
    .field { display:flex;flex-direction:column;gap:6px; }
    .field label { font-size:12px;font-weight:600;color:#948da3;letter-spacing:.04em;text-transform:uppercase; }
    .field input { width:100%;padding:12px 15px;border-radius:14px;background:#f8f1fc;border:1px solid rgba(167,139,250,.16);color:#221f2c;font-size:14px;font-family:inherit;outline:none;transition:all .25s cubic-bezier(.16,1,.3,1);box-sizing:border-box; }
    .field input:focus { border-color:#a78bfa;background:#fff;box-shadow:0 0 0 4px rgba(167,139,250,.16); }
    .field input.invalid { border-color:rgba(242,92,120,.5); }
    .pw-wrap { position:relative; }
    .pw-wrap input { padding-right:42px; }
    .eye { position:absolute;right:12px;top:50%;transform:translateY(-50%);background:none;border:none;color:#c4bdd6;cursor:pointer;display:flex;align-items:center;transition:color .2s; }
    .eye:hover { color:#a78bfa; }
    .err { font-size:11px;color:#f25c78; }
    .err-banner { background:rgba(242,92,120,.08);border:1px solid rgba(242,92,120,.22);border-radius:14px;padding:11px 15px;font-size:13px;color:#f25c78; }
    .btn-primary { padding:14px;border-radius:999px;background:linear-gradient(135deg,#a78bfa,#fb7299);border:none;color:white;font-size:15px;font-weight:700;cursor:pointer;transition:all .3s cubic-bezier(.16,1,.3,1);font-family:inherit;display:flex;align-items:center;justify-content:center;height:48px;box-shadow:0 12px 36px rgba(167,139,250,.35); }
    .btn-primary:hover:not(:disabled) { box-shadow:0 16px 44px rgba(167,139,250,.45);transform:translateY(-2px); }
    .btn-primary:disabled { opacity:.5;cursor:not-allowed; }
    .spinner { width:18px;height:18px;border:2px solid rgba(255,255,255,.35);border-top-color:white;border-radius:50%;animation:spin .7s linear infinite; }
    @keyframes spin { to { transform:rotate(360deg) } }
    .success-box { display:flex;flex-direction:column;align-items:center;padding:20px 0; }
    .back { text-align:center;margin:22px 0 0; }
    .link { font-size:13px;color:#6366f1;text-decoration:none;font-weight:600; }
    .link:hover { color:#818cf8; }
  `],
})
export class ResetPassword implements OnInit {
  form: FormGroup;
  loading = signal(false);
  error   = signal('');
  done    = signal(false);
  token   = '';
  showPw  = false;

  constructor(
    private fb: FormBuilder,
    private api: ApiService,
    private route: ActivatedRoute,
    private router: Router,
  ) {
    this.form = this.fb.group({
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirm:  ['', Validators.required],
    }, { validators: this.passwordsMatch });
  }

  ngOnInit() {
    this.token = this.route.snapshot.queryParamMap.get('token') ?? '';
  }

  passwordsMatch(g: AbstractControl) {
    return g.get('password')?.value === g.get('confirm')?.value ? null : { mismatch: true };
  }

  submit() {
    if (this.form.invalid || !this.token) return;
    this.loading.set(true);
    this.error.set('');

    this.api.post<void>('/auth/reset-password', {
      token: this.token,
      password: this.form.value.password,
    }).subscribe({
      next: () => { this.loading.set(false); this.done.set(true); },
      error: (err: any) => {
        this.loading.set(false);
        this.error.set(err?.error?.message ?? 'Lien invalide ou expiré.');
      },
    });
  }
}
