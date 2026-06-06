import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { trigger, style, animate, transition } from '@angular/animations';
import { AuthService } from '../../../core/services/auth';
import { ApiService } from '../../../core/services/api';
import { Sidebar } from '../../../shared/sidebar/sidebar';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, Sidebar],
  animations: [
    trigger('fadeUp', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(18px)' }),
        animate('360ms cubic-bezier(0.23,1,0.32,1)', style({ opacity: 1, transform: 'translateY(0)' })),
      ]),
    ]),
  ],
  template: `
    <div class="shell">
      <app-sidebar [role]="auth.role() ?? ''" [userName]="auth.user()?.name ?? ''" />

      <main class="main-area">
        <header class="topbar reveal">
          <div>
            <h1 class="topbar-title">Mon <span class="gt">Profil</span></h1>
            <p class="topbar-sub">Gérez vos informations personnelles</p>
          </div>
        </header>

        <div class="content">
          <div class="two-col">
            <!-- Left: Avatar + info -->
            <section class="card p-6 flex flex-col items-center gap-5 reveal stagger-1">
              <div class="avatar-wrap">
                <img *ngIf="avatarPreview()" [src]="avatarPreview()" class="avatar-img" alt="Avatar" />
                <div *ngIf="!avatarPreview()" class="avatar-placeholder">
                  {{ auth.user()?.name?.charAt(0) ?? 'U' }}
                </div>
                <label class="avatar-edit" title="Changer l'avatar">
                  <input type="file" accept="image/*" (change)="onAvatarChange($event)" style="display:none" />
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                </label>
              </div>
              <div class="text-center">
                <p class="text-lg font-bold font-display" style="color:#221f2c">{{ auth.user()?.name }}</p>
                <p class="text-sm mt-1" style="color:#948da3">{{ auth.user()?.email }}</p>
                <span class="badge badge-primary mt-2 inline-block">{{ roleLabel(auth.role() ?? '') }}</span>
              </div>
              <button *ngIf="pendingAvatar" (click)="uploadAvatar()" class="btn-primary w-full" [disabled]="uploading()">
                <span *ngIf="!uploading()">Sauvegarder l'avatar</span>
                <span *ngIf="uploading()" class="spinner"></span>
              </button>
              <div class="toast success bounce-in" *ngIf="avatarSuccess()">Avatar mis à jour !</div>
            </section>

            <!-- Right: Edit form + change password -->
            <div class="flex flex-col gap-5">
              <!-- Profile form -->
              <section class="card p-6 reveal stagger-2">
                <h2 class="section-title mb-5">Informations générales</h2>
                <form [formGroup]="profileForm" (ngSubmit)="saveProfile()" class="form">
                  <div class="field">
                    <label>Nom complet</label>
                    <input formControlName="name" type="text" placeholder="Votre nom"
                      [class.invalid]="profileForm.get('name')?.invalid && profileForm.get('name')?.touched" />
                  </div>
                  <div class="field">
                    <label>Biographie</label>
                    <textarea formControlName="bio" placeholder="Quelques mots sur vous…" rows="3"></textarea>
                  </div>
                  <div class="err-banner bounce-in" *ngIf="profileError()">{{ profileError() }}</div>
                  <div class="toast success bounce-in" *ngIf="profileSuccess()">Profil mis à jour !</div>
                  <button type="submit" class="btn-primary" [disabled]="profileForm.invalid || savingProfile()">
                    <span *ngIf="!savingProfile()">Enregistrer</span>
                    <span *ngIf="savingProfile()" class="spinner"></span>
                  </button>
                </form>
              </section>

              <!-- Change password -->
              <section class="card p-6 reveal stagger-3">
                <h2 class="section-title mb-5">Changer le mot de passe</h2>
                <form [formGroup]="pwForm" (ngSubmit)="changePassword()" class="form">
                  <div class="field">
                    <label>Mot de passe actuel</label>
                    <input formControlName="currentPassword" type="password" placeholder="••••••••" />
                  </div>
                  <div class="field">
                    <label>Nouveau mot de passe</label>
                    <input formControlName="newPassword" type="password" placeholder="••••••••"
                      [class.invalid]="pwForm.get('newPassword')?.invalid && pwForm.get('newPassword')?.touched" />
                    <span class="err" *ngIf="pwForm.get('newPassword')?.invalid && pwForm.get('newPassword')?.touched">Min. 8 caractères</span>
                  </div>
                  <div class="err-banner bounce-in" *ngIf="pwError()">{{ pwError() }}</div>
                  <div class="toast success bounce-in" *ngIf="pwSuccess()">Mot de passe mis à jour !</div>
                  <button type="submit" class="btn-primary" [disabled]="pwForm.invalid || savingPw()">
                    <span *ngIf="!savingPw()">Mettre à jour</span>
                    <span *ngIf="savingPw()" class="spinner"></span>
                  </button>
                </form>
              </section>
            </div>
          </div>
        </div>
      </main>
    </div>
  `,
  styles: [`
    .shell { display:flex;height:100vh;overflow:hidden;background:linear-gradient(160deg,#fffdfb 0%,#fdf2f8 60%,#f6f0ff 100%); }
    .main-area { flex:1;overflow-y:auto;display:flex;flex-direction:column; }
    .topbar { display:flex;align-items:center;justify-content:space-between;padding:22px 30px;border-bottom:1px solid rgba(167,139,250,.12);background:rgba(255,253,251,.78);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);position:sticky;top:0;z-index:10; }
    .topbar-title { font-family:'Fraunces',Georgia,serif;font-size:22px;font-weight:700;color:#221f2c;margin:0;letter-spacing:-.01em; }
    .topbar-sub { font-size:13px;color:#948da3;margin:3px 0 0; }
    .gt { background:linear-gradient(135deg,#a78bfa,#fb7299);background-size:200% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;animation:shimmer-flow 5s linear infinite; }
    .content { padding:26px 30px;display:flex;flex-direction:column;gap:22px; }
    .two-col { display:grid;grid-template-columns:280px 1fr;gap:20px;align-items:start; }
    @media(max-width:900px){.two-col{grid-template-columns:1fr}}
    .avatar-wrap { position:relative;width:100px;height:100px; }
    .avatar-img { width:100px;height:100px;border-radius:50%;object-fit:cover;border:3px solid rgba(167,139,250,.3); }
    .avatar-placeholder { width:100px;height:100px;border-radius:50%;background:linear-gradient(135deg,#a78bfa,#fb7299);display:flex;align-items:center;justify-content:center;font-size:36px;font-weight:800;color:white;box-shadow:0 12px 32px rgba(167,139,250,.34); }
    .avatar-edit { position:absolute;bottom:0;right:0;width:30px;height:30px;border-radius:50%;background:linear-gradient(135deg,#a78bfa,#fb7299);display:flex;align-items:center;justify-content:center;cursor:pointer;border:2px solid #fffdfb;box-shadow:0 6px 16px rgba(167,139,250,.4); }
    .section-title { font-family:'Fraunces',Georgia,serif;font-weight:700;color:#221f2c; }
    .form { display:flex;flex-direction:column;gap:14px; }
    .field { display:flex;flex-direction:column;gap:5px; }
    .field label { font-size:11px;font-weight:600;color:#948da3;letter-spacing:.05em;text-transform:uppercase; }
    .field input, .field textarea { padding:11px 16px;border-radius:14px;background:#f8f1fc;border:1px solid rgba(167,139,250,.16);color:#221f2c;font-size:14px;font-family:inherit;outline:none;transition:all .25s cubic-bezier(.16,1,.3,1);resize:vertical; }
    .field input:focus, .field textarea:focus { border-color:#a78bfa;background:#fff;box-shadow:0 0 0 4px rgba(167,139,250,.16); }
    .field input::placeholder, .field textarea::placeholder { color:#c4bdd6; }
    .field input.invalid { border-color:rgba(242,92,120,.5); }
    .err { font-size:11px;color:#f25c78; }
    .err-banner { background:rgba(242,92,120,.08);border:1px solid rgba(242,92,120,.22);border-radius:14px;padding:11px 16px;font-size:13px;color:#f25c78; }
    .toast.success { background:rgba(110,231,183,.12);border:1px solid rgba(110,231,183,.3);border-radius:14px;padding:11px 16px;font-size:13px;color:#1f9d6f; }
    .btn-primary { padding:11px;border-radius:14px;background:linear-gradient(135deg,#a78bfa,#fb7299);border:none;color:white;font-size:14px;font-weight:700;cursor:pointer;transition:all .25s cubic-bezier(.16,1,.3,1);font-family:inherit;display:flex;align-items:center;justify-content:center;height:44px;box-shadow:0 8px 22px rgba(167,139,250,.32); }
    .btn-primary:hover:not(:disabled) { box-shadow:0 10px 28px rgba(167,139,250,.45);transform:translateY(-1px); }
    .btn-primary:disabled { opacity:.5;cursor:not-allowed; }
    .spinner { width:16px;height:16px;border:2px solid rgba(255,255,255,.35);border-top-color:white;border-radius:50%;animation:spin .7s linear infinite; }
    @keyframes spin { to { transform:rotate(360deg) } }
    .w-full { width:100%; }
  `],
})
export class ProfilePage implements OnInit {
  profileForm: FormGroup;
  pwForm: FormGroup;

  avatarPreview = signal<string | null>(null);
  pendingAvatar: File | null = null;

  uploading     = signal(false);
  avatarSuccess = signal(false);
  savingProfile = signal(false);
  profileError  = signal('');
  profileSuccess= signal(false);
  savingPw      = signal(false);
  pwError       = signal('');
  pwSuccess     = signal(false);

  constructor(
    public auth: AuthService,
    private api: ApiService,
    private fb: FormBuilder,
  ) {
    this.profileForm = this.fb.group({
      name: ['', Validators.required],
      bio:  [''],
    });
    this.pwForm = this.fb.group({
      currentPassword: ['', Validators.required],
      newPassword:     ['', [Validators.required, Validators.minLength(8)]],
    });
  }

  ngOnInit() {
    const u = this.auth.user();
    this.profileForm.patchValue({ name: u?.name ?? '', bio: (u as any)?.bio ?? '' });
    this.avatarPreview.set(u?.avatar ?? null);
  }

  onAvatarChange(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.pendingAvatar = file;
    const reader = new FileReader();
    reader.onload = () => this.avatarPreview.set(reader.result as string);
    reader.readAsDataURL(file);
  }

  uploadAvatar() {
    if (!this.pendingAvatar) return;
    this.uploading.set(true);
    const fd = new FormData();
    fd.append('file', this.pendingAvatar);

    this.api.postForm<string>('/users/avatar', fd).subscribe({
      next: (url: string) => {
        this.uploading.set(false);
        this.pendingAvatar = null;
        this.avatarSuccess.set(true);
        this.auth.updateLocalUser({ avatar: url });
        setTimeout(() => this.avatarSuccess.set(false), 3000);
      },
      error: () => { this.uploading.set(false); },
    });
  }

  saveProfile() {
    if (this.profileForm.invalid) return;
    this.savingProfile.set(true);
    this.profileError.set('');

    this.api.put<any>('/users/profile', {
      name: this.profileForm.value.name,
      bio:  this.profileForm.value.bio,
      avatar: this.auth.user()?.avatar,
    }).subscribe({
      next: () => {
        this.savingProfile.set(false);
        this.profileSuccess.set(true);
        setTimeout(() => this.profileSuccess.set(false), 3000);
      },
      error: (err: any) => {
        this.savingProfile.set(false);
        this.profileError.set(err?.error?.message ?? 'Erreur lors de la mise à jour');
      },
    });
  }

  changePassword() {
    if (this.pwForm.invalid) return;
    this.savingPw.set(true);
    this.pwError.set('');

    this.api.put<void>('/users/change-password', {
      currentPassword: this.pwForm.value.currentPassword,
      newPassword:     this.pwForm.value.newPassword,
    }).subscribe({
      next: () => {
        this.savingPw.set(false);
        this.pwSuccess.set(true);
        this.pwForm.reset();
        setTimeout(() => this.pwSuccess.set(false), 3000);
      },
      error: (err: any) => {
        this.savingPw.set(false);
        this.pwError.set(err?.error?.message ?? 'Mot de passe actuel incorrect');
      },
    });
  }

  roleLabel(r: string) {
    return { STUDENT: 'Stagiaire', TRAINER: 'Formateur', ADMIN: 'Administrateur' }[r] ?? r;
  }
}
