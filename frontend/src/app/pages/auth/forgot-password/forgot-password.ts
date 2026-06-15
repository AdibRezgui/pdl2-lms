import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { trigger, style, animate, transition } from '@angular/animations';
import { ApiService } from '../../../core/services/api';

@Component({
  selector: 'app-forgot-password',
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
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/></svg>
        </div>
        <h1 class="title">Mot de passe oublié</h1>

        <ng-container *ngIf="!sent()">
          <p class="subtitle">Entrez votre email pour recevoir un lien de réinitialisation.</p>

          <form [formGroup]="form" (ngSubmit)="submit()" class="form">
            <div class="field">
              <label>Adresse email</label>
              <input formControlName="email" type="email" placeholder="vous@exemple.tn"
                [class.invalid]="form.get('email')?.invalid && form.get('email')?.touched" />
              <span class="err" *ngIf="form.get('email')?.invalid && form.get('email')?.touched">Email invalide</span>
            </div>

            <div class="err-banner" *ngIf="error()">{{ error() }}</div>

            <button type="submit" class="btn-primary" [disabled]="form.invalid || loading()">
              <span *ngIf="!loading()">Envoyer le lien</span>
              <span *ngIf="loading()" class="spinner"></span>
            </button>
          </form>
        </ng-container>

        <ng-container *ngIf="sent()">
          <div class="success-box">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#34d399" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
            <h2 style="color:#34d399;font-size:16px;font-weight:700;margin:12px 0 6px">Email envoyé !</h2>
            <p style="color:#64748b;font-size:13px;text-align:center;line-height:1.6">
              Si cet email est associé à un compte, vous recevrez un lien valable <strong style="color:#fbbf24">15 minutes</strong>.
            </p>
          </div>
        </ng-container>

        <p class="back">
          <a routerLink="/login" class="link">← Retour à la connexion</a>
        </p>
      </div>
    </div>
  `,
  styles: [`
    .page { min-height:100vh;display:flex;align-items:center;justify-content:center;background:linear-gradient(160deg,#f5fdfe 0%,#edf9fb 50%,#f3edff 100%);position:relative;overflow:hidden;padding:20px; }
    .orb { position:absolute;pointer-events:none;animation:orb-float 12s ease-in-out infinite alternate; }
    .orb1 { width:420px;height:420px;background:radial-gradient(circle,rgba(0,180,198,.32),transparent 70%);filter:blur(70px);top:-140px;left:-110px; }
    .orb2 { width:340px;height:340px;background:radial-gradient(circle,rgba(0,168,188,.26),transparent 70%);filter:blur(70px);bottom:-90px;right:-90px;animation-delay:-5s; }
    .card { position:relative;z-index:1;width:100%;max-width:430px;background:rgba(255,255,255,.72);backdrop-filter:blur(28px) saturate(180%);-webkit-backdrop-filter:blur(28px) saturate(180%);border:1px solid rgba(255,255,255,.6);border-radius:32px;padding:40px 36px;box-shadow:0 32px 80px rgba(0,180,198,.22),inset 0 1px 0 rgba(255,255,255,.6); }
    .logo { width:52px;height:52px;border-radius:18px;background:linear-gradient(135deg,#00B4C6,#00A8BC);display:flex;align-items:center;justify-content:center;margin:0 auto 20px;box-shadow:0 10px 30px rgba(0,180,198,.5); }
    .title { font-family:'Fraunces',Georgia,serif;font-size:24px;font-weight:700;color:#1a2d3a;text-align:center;margin:0 0 8px;letter-spacing:-.01em; }
    .subtitle { font-size:13px;color:#5a7a8a;text-align:center;margin:0 0 26px;line-height:1.6; }
    .form { display:flex;flex-direction:column;gap:17px; }
    .field { display:flex;flex-direction:column;gap:6px; }
    .field label { font-size:12px;font-weight:600;color:#5a7a8a;letter-spacing:.04em;text-transform:uppercase; }
    .field input { padding:12px 15px;border-radius:14px;background:#e0f6f9;border:1px solid rgba(0,180,198,.16);color:#1a2d3a;font-size:14px;font-family:inherit;outline:none;transition:all .25s cubic-bezier(.16,1,.3,1); }
    .field input:focus { border-color:#00B4C6;background:#fff;box-shadow:0 0 0 4px rgba(0,180,198,.16); }
    .field input.invalid { border-color:rgba(242,92,120,.5); }
    .err { font-size:11px;color:#f25c78; }
    .err-banner { background:rgba(242,92,120,.08);border:1px solid rgba(242,92,120,.22);border-radius:14px;padding:11px 15px;font-size:13px;color:#f25c78; }
    .btn-primary { padding:14px;border-radius:999px;background:linear-gradient(135deg,#00B4C6,#00A8BC);border:none;color:white;font-size:15px;font-weight:700;cursor:pointer;transition:all .3s cubic-bezier(.16,1,.3,1);font-family:inherit;display:flex;align-items:center;justify-content:center;height:48px;box-shadow:0 12px 36px rgba(0,180,198,.35); }
    .btn-primary:hover:not(:disabled) { box-shadow:0 16px 44px rgba(0,180,198,.45);transform:translateY(-2px); }
    .btn-primary:disabled { opacity:.5;cursor:not-allowed; }
    .spinner { width:18px;height:18px;border:2px solid rgba(255,255,255,.35);border-top-color:white;border-radius:50%;animation:spin .7s linear infinite; }
    @keyframes spin { to { transform:rotate(360deg) } }
    .success-box { display:flex;flex-direction:column;align-items:center;padding:24px 0; }
    .back { text-align:center;margin:22px 0 0; }
    .link { font-size:13px;color:#00B4C6;text-decoration:none;font-weight:700; }
    .link:hover { color:#00A8BC; }
  `],
})
export class ForgotPassword {
  form: FormGroup;
  loading = signal(false);
  error   = signal('');
  sent    = signal(false);

  constructor(private fb: FormBuilder, private api: ApiService) {
    this.form = this.fb.group({ email: ['', [Validators.required, Validators.email]] });
  }

  submit() {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.error.set('');

    this.api.post<void>('/auth/forgot-password', { email: this.form.value.email }).subscribe({
      next: () => { this.loading.set(false); this.sent.set(true); },
      error: () => { this.loading.set(false); this.sent.set(true); }, // always show success (anti-enumeration)
    });
  }
}
