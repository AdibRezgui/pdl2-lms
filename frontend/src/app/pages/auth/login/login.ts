import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { trigger, style, animate, transition } from '@angular/animations';
import { AuthService } from '../../../core/services/auth';
import { TypewriterComponent } from '../../../shared/typewriter/typewriter';

const SLIDES = [
  {
    image: 'login-bg-0.jpg',
    title: 'Formez vos équipes IT',
    subtitle: 'Des parcours d\'apprentissage personnalisés par l\'intelligence artificielle pour chaque profil.',
  },
  {
    image: 'login-bg-1.jpg',
    title: 'Gérez vos infrastructures',
    subtitle: 'Maîtrisez les technologies cloud, réseau et sécurité avec nos experts certifiés.',
  },
  {
    image: 'login-bg-2.jpg',
    title: 'Accélérez votre expertise',
    subtitle: 'Certifications, évaluations adaptatives et suivi de progression en temps réel.',
  },
];

const DEMOS = [
  { label: 'Stagiaire',  email: 'student@eduai.tn', password: 'Demo1234!', color: '#00B4C6' },
  { label: 'Formateur',  email: 'trainer@eduai.tn',  password: 'Demo1234!', color: '#0099AE' },
];

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, TypewriterComponent],
  animations: [
    trigger('panelIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateX(28px)' }),
        animate('600ms cubic-bezier(0.23,1,0.32,1)', style({ opacity: 1, transform: 'translateX(0)' })),
      ]),
    ]),
  ],
  template: `
    <div class="shell">

      <!-- ═══════════════════ LEFT: SLIDESHOW ═══════════════════ -->
      <div class="visual">

        <!-- Images stacked, fade in/out -->
        <div *ngFor="let s of slides; let i = index"
             class="slide-bg"
             [class.slide-active]="i === current">
          <div class="slide-img" [style.backgroundImage]="'url(' + s.image + ')'"></div>
        </div>

        <!-- Dark gradient overlay -->
        <div class="slide-vignette"></div>

        <!-- Top bar: logo + brand -->
        <div class="visual-top">
          <div class="brand-pill">
            <img src="logo-sip.jpg" alt="Smart IT Partner" class="brand-logo"
                 (error)="logoVisualFailed=true" [style.display]="logoVisualFailed ? 'none' : 'block'" />
            <span *ngIf="logoVisualFailed" class="brand-fallback">SIP</span>
          </div>
          <span class="brand-label">Smart IT Partner</span>
        </div>

        <!-- Floating accent chip -->
        <div class="float-chip">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#00B4C6" stroke-width="2.5"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
          Plateforme LMS · IA
        </div>

        <!-- Bottom content: rotating text + dots -->
        <div class="visual-bottom">

          <!-- Typewriter tagline -->
          <div class="tw-bar">
            <span class="tw-dot"></span>
            <app-typewriter
              [text]="taglines"
              [speed]="75"
              [deleteSpeed]="38"
              [delay]="2200"
              [loop]="true"
              cursor="_"
              className="tw-text" />
          </div>

          <div class="slide-stats">
            <div class="stat-pill-v">
              <span class="stat-n">500+</span>
              <span class="stat-l">Formations</span>
            </div>
            <div class="stat-divider"></div>
            <div class="stat-pill-v">
              <span class="stat-n">12k+</span>
              <span class="stat-l">Stagiaires</span>
            </div>
            <div class="stat-divider"></div>
            <div class="stat-pill-v">
              <span class="stat-n">98%</span>
              <span class="stat-l">Satisfaction</span>
            </div>
          </div>

          <!-- Captions stacked, CSS cross-fade -->
          <div class="caption-area">
            <div *ngFor="let s of slides; let i = index"
                 class="slide-caption"
                 [class.caption-visible]="i === current">
              <h2 class="slide-title">{{ s.title }}</h2>
              <p class="slide-sub">{{ s.subtitle }}</p>
            </div>
          </div>

          <div class="slide-dots">
            <button *ngFor="let s of slides; let i = index"
                    class="dot" [class.dot-active]="i === current"
                    (click)="goTo(i)" [attr.aria-label]="'Slide ' + (i+1)"></button>
          </div>
        </div>
      </div>

      <!-- ═══════════════════ RIGHT: LOGIN CARD ═══════════════════ -->
      <div @panelIn class="panel">
        <div class="card-scroll">
          <div class="card">

            <!-- Logo -->
            <div class="card-logo-wrap">
              <img src="logo-sip.jpg" alt="Smart IT Partner" class="card-logo"
                   (error)="logoCardFailed=true" [style.display]="logoCardFailed ? 'none' : 'block'" />
              <div class="card-logo-fb" *ngIf="logoCardFailed">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
              </div>
            </div>

            <h1 class="card-title">Bon retour !</h1>
            <p class="card-sub">Connectez-vous à votre espace de formation</p>

            <!-- Demo quick-access -->
            <p class="section-eyebrow">Accès démo rapide</p>
            <div class="demo-row">
              <button *ngFor="let d of demos" (click)="fillDemo(d)"
                      class="demo-btn" [style.--dc]="d.color">
                <span class="demo-dot" [style.background]="d.color"></span>
                {{ d.label }}
              </button>
            </div>

            <div class="sep"><span>ou vos identifiants</span></div>

            <!-- Error -->
            <div *ngIf="error()" class="err-box">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              {{ error() }}
            </div>

            <!-- Form -->
            <form [formGroup]="form" (ngSubmit)="submit()">

              <div class="fg">
                <label class="fl">Adresse email</label>
                <div class="input-wrap">
                  <svg class="input-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                  <input formControlName="email" type="email" class="input-field pl-icon"
                         placeholder="votre@email.com"
                         [class.input-err]="form.get('email')?.invalid && form.get('email')?.touched" />
                </div>
                <span *ngIf="form.get('email')?.invalid && form.get('email')?.touched" class="fe">Email invalide</span>
              </div>

              <div class="fg">
                <div class="label-row">
                  <label class="fl">Mot de passe</label>
                  <a routerLink="/forgot-password" class="forgot-link">Mot de passe oublié ?</a>
                </div>
                <div class="input-wrap">
                  <svg class="input-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  <input formControlName="password" [type]="showPw ? 'text' : 'password'"
                         class="input-field pl-icon pr-icon"
                         placeholder="••••••••"
                         [class.input-err]="form.get('password')?.invalid && form.get('password')?.touched" />
                  <button type="button" class="eye-btn" (click)="showPw = !showPw" [attr.aria-label]="showPw ? 'Masquer' : 'Afficher'">
                    <svg *ngIf="!showPw" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    <svg *ngIf="showPw"  width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  </button>
                </div>
              </div>

              <button type="submit" class="submit-btn" [disabled]="loading()">
                <svg *ngIf="loading()" class="spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                <svg *ngIf="!loading()" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
                {{ loading() ? 'Connexion…' : 'Se connecter' }}
              </button>
            </form>

            <p class="register-hint">
              Pas encore de compte ?
              <a routerLink="/register" class="register-link">Créer un compte</a>
            </p>

            <!-- Trust badges -->
            <div class="trust-row">
              <div class="trust-item">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#00B4C6" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                Connexion sécurisée
              </div>
              <div class="trust-dot"></div>
              <div class="trust-item">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#00B4C6" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
                Certifié ISO 27001
              </div>
            </div>

          </div>
        </div>
      </div>

    </div>
  `,
  styles: [`
    /* ── Shell ───────────────────────────────────────── */
    .shell {
      display: flex;
      height: 100vh;
      overflow: hidden;
    }

    /* ── Visual (left) ───────────────────────────────── */
    .visual {
      flex: 0 0 58%;
      position: relative;
      overflow: hidden;
    }
    @media (max-width: 900px) { .visual { display: none; } }

    /* Stacked slide images */
    .slide-bg {
      position: absolute; inset: 0;
      opacity: 0;
      transition: opacity 1.2s cubic-bezier(0.4, 0, 0.2, 1);
      z-index: 0;
    }
    .slide-bg.slide-active { opacity: 1; }
    .slide-img {
      position: absolute; inset: 0;
      background-size: cover;
      background-position: center;
      transform: scale(1.04);
      transition: transform 8s ease-in-out;
    }
    .slide-bg.slide-active .slide-img { transform: scale(1); }

    /* Multi-layer dark overlay */
    .slide-vignette {
      position: absolute; inset: 0; z-index: 1;
      background:
        linear-gradient(to bottom, rgba(10,20,30,0.55) 0%, transparent 40%),
        linear-gradient(to top, rgba(5,15,25,0.90) 0%, rgba(5,15,25,0.5) 45%, transparent 70%),
        linear-gradient(to right, rgba(0,0,0,0.2) 0%, transparent 60%);
    }

    /* Top bar */
    .visual-top {
      position: absolute; top: 32px; left: 36px;
      display: flex; align-items: center; gap: 12px;
      z-index: 10;
    }
    .brand-pill {
      width: 48px; height: 48px; border-radius: 14px;
      overflow: hidden;
      border: 1.5px solid rgba(255,255,255,0.25);
      background: rgba(255,255,255,0.1);
      backdrop-filter: blur(10px);
      display: flex; align-items: center; justify-content: center;
    }
    .brand-logo { width: 100%; height: 100%; object-fit: cover; }
    .brand-fallback { color: white; font-size: 13px; font-weight: 800; }
    .brand-label {
      color: rgba(255,255,255,0.92);
      font-size: 15px; font-weight: 700;
      letter-spacing: -0.01em;
      text-shadow: 0 1px 8px rgba(0,0,0,0.3);
    }

    /* Floating accent chip */
    .float-chip {
      position: absolute; top: 38px; right: 32px;
      z-index: 10;
      display: flex; align-items: center; gap: 7px;
      padding: 8px 16px; border-radius: 999px;
      background: rgba(255,255,255,0.1);
      backdrop-filter: blur(16px);
      border: 1px solid rgba(0,180,198,0.35);
      color: rgba(255,255,255,0.85);
      font-size: 12px; font-weight: 600;
      letter-spacing: 0.02em;
    }

    /* Bottom content */
    .visual-bottom {
      position: absolute; bottom: 0; left: 0; right: 0;
      z-index: 10;
      padding: 0 40px 44px;
    }

    /* Typewriter bar */
    .tw-bar {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 22px;
      min-height: 26px;
    }
    .tw-dot {
      width: 7px; height: 7px; border-radius: 50%;
      background: #00B4C6;
      flex-shrink: 0;
      box-shadow: 0 0 8px rgba(0,180,198,0.9), 0 0 16px rgba(0,180,198,0.5);
      animation: tw-pulse 2s ease-in-out infinite;
    }
    @keyframes tw-pulse {
      0%, 100% { box-shadow: 0 0 8px rgba(0,180,198,0.9), 0 0 16px rgba(0,180,198,0.5); }
      50%       { box-shadow: 0 0 14px rgba(0,180,198,1),  0 0 28px rgba(0,180,198,0.7); }
    }
    :host ::ng-deep .tw-text {
      font-family: 'Fraunces', Georgia, serif;
      font-size: 15px;
      font-weight: 600;
      color: rgba(0, 210, 230, 0.92);
      letter-spacing: 0.01em;
      text-shadow: 0 0 18px rgba(0,180,198,0.6);
    }
    :host ::ng-deep .tw-text .tw-cursor {
      color: #00B4C6;
      font-weight: 300;
    }

    /* Mini stats row */
    .slide-stats {
      display: flex; align-items: center; gap: 20px;
      margin-bottom: 28px;
    }
    .stat-pill-v { display: flex; flex-direction: column; }
    .stat-n { font-size: 20px; font-weight: 800; color: #fff; line-height: 1; font-family: 'Fraunces', Georgia, serif; }
    .stat-l { font-size: 11px; color: rgba(255,255,255,0.6); margin-top: 3px; letter-spacing: 0.03em; }
    .stat-divider { width: 1px; height: 32px; background: rgba(255,255,255,0.2); }

    /* Slide caption */
    .caption-area {
      position: relative;
      min-height: 100px;
      margin-bottom: 24px;
    }
    .slide-caption {
      position: absolute; top: 0; left: 0; right: 0;
      opacity: 0;
      transform: translateY(14px);
      transition: opacity 0.7s ease, transform 0.7s ease;
      pointer-events: none;
    }
    .slide-caption.caption-visible {
      opacity: 1; transform: translateY(0); pointer-events: auto;
    }
    .slide-title {
      font-family: 'Fraunces', Georgia, serif;
      font-size: 30px; font-weight: 800;
      color: #fff; line-height: 1.2;
      margin: 0 0 10px;
      text-shadow: 0 2px 16px rgba(0,0,0,0.35);
    }
    .slide-sub {
      font-size: 14px; color: rgba(255,255,255,0.72);
      line-height: 1.6; margin: 0;
      max-width: 440px;
    }

    /* Dot indicators */
    .slide-dots { display: flex; gap: 8px; }
    .dot {
      width: 28px; height: 4px; border-radius: 2px;
      background: rgba(255,255,255,0.3);
      border: none; cursor: pointer; padding: 0;
      transition: all 0.35s cubic-bezier(0.23,1,0.32,1);
    }
    .dot-active { background: #00B4C6; width: 44px; }

    /* ── Right panel ─────────────────────────────────── */
    .panel {
      flex: 0 0 42%;
      display: flex; align-items: center; justify-content: center;
      background: #f4fcfd;
      position: relative;
      overflow: hidden;
    }
    .panel::before {
      content: '';
      position: absolute; inset: 0;
      background-image: radial-gradient(circle at 1px 1px, rgba(0,180,198,0.07) 1px, transparent 0);
      background-size: 24px 24px;
    }

    /* Subtle teal orb */
    .panel::after {
      content: '';
      position: absolute;
      width: 380px; height: 380px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(0,180,198,0.12), transparent 70%);
      filter: blur(60px);
      top: -80px; right: -100px;
      pointer-events: none;
    }

    @media (max-width: 900px) {
      .panel { flex: 1; background: linear-gradient(160deg,#f5fdfe,#edf9fb 60%,#daf2f6); }
    }

    .card-scroll {
      width: 100%; max-height: 100vh;
      overflow-y: auto;
      display: flex; align-items: center; justify-content: center;
      padding: 32px 24px;
      position: relative; z-index: 1;
    }

    /* ── Card ───────────────────────────────────────── */
    .card {
      width: 100%; max-width: 400px;
      background: rgba(255,255,255,0.88);
      backdrop-filter: blur(30px) saturate(180%);
      -webkit-backdrop-filter: blur(30px) saturate(180%);
      border: 1px solid rgba(255,255,255,0.7);
      border-radius: 28px;
      padding: 40px 36px;
      box-shadow:
        0 4px 24px rgba(0,180,198,0.08),
        0 24px 64px rgba(0,30,50,0.12),
        inset 0 1px 0 rgba(255,255,255,0.8);
    }

    /* Logo */
    .card-logo-wrap {
      display: flex; justify-content: center;
      margin-bottom: 20px;
    }
    .card-logo {
      height: 72px; width: auto; max-width: 200px;
      object-fit: contain; border-radius: 12px;
      filter: drop-shadow(0 6px 20px rgba(0,180,198,0.2));
    }
    .card-logo-fb {
      width: 64px; height: 64px; border-radius: 18px;
      background: linear-gradient(135deg,#00B4C6,#007A8A);
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 8px 24px rgba(0,180,198,0.45);
    }

    .card-title {
      font-family: 'Fraunces', Georgia, serif;
      font-size: 24px; font-weight: 800; color: #1a2d3a;
      text-align: center; margin: 0 0 6px;
      letter-spacing: -0.02em;
    }
    .card-sub {
      font-size: 13px; color: #5a7a8a;
      text-align: center; margin: 0 0 24px;
    }

    /* Demo */
    .section-eyebrow {
      font-size: 10.5px; font-weight: 700; color: #8aaabb;
      text-transform: uppercase; letter-spacing: 0.08em;
      margin-bottom: 10px;
    }
    .demo-row { display: grid; grid-template-columns: repeat(2,1fr); gap: 8px; margin-bottom: 20px; }
    .demo-btn {
      display: flex; align-items: center; justify-content: center; gap: 6px;
      padding: 9px 4px; border-radius: 12px;
      background: rgba(0,180,198,0.05);
      border: 1px solid rgba(0,180,198,0.15);
      color: #5a7a8a; font-size: 12px; font-weight: 600;
      cursor: pointer; font-family: inherit;
      transition: all 0.25s cubic-bezier(0.16,1,0.3,1);
    }
    .demo-btn:hover {
      background: #fff;
      border-color: color-mix(in srgb, var(--dc) 50%, transparent);
      color: #1a2d3a;
      transform: translateY(-2px);
      box-shadow: 0 6px 18px rgba(0,180,198,0.16);
    }
    .demo-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }

    /* Separator */
    .sep { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; }
    .sep::before, .sep::after { content: ''; flex: 1; height: 1px; background: rgba(0,180,198,0.14); }
    .sep span { font-size: 11px; color: #8aaabb; white-space: nowrap; }

    /* Error */
    .err-box {
      display: flex; align-items: center; gap: 8px;
      padding: 11px 14px; border-radius: 13px;
      background: rgba(242,92,120,0.08); border: 1px solid rgba(242,92,120,0.22);
      color: #f25c78; font-size: 13px; margin-bottom: 16px;
    }

    /* Form fields */
    .fg { margin-bottom: 16px; }
    .fl { display: block; font-size: 12.5px; font-weight: 600; color: #4a6a7a; margin-bottom: 7px; }
    .label-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 7px; }
    .label-row .fl { margin-bottom: 0; }
    .forgot-link { font-size: 12px; font-weight: 600; color: #00B4C6; text-decoration: none; transition: opacity .2s; }
    .forgot-link:hover { opacity: 0.75; }
    .fe { font-size: 11px; color: #f25c78; margin-top: 4px; display: block; }

    .input-wrap { position: relative; }
    .input-icon {
      position: absolute; left: 13px; top: 50%; transform: translateY(-50%);
      color: #8aaabb; pointer-events: none; z-index: 1;
    }
    .input-field {
      width: 100%; height: 46px;
      border: 1.5px solid rgba(0,180,198,0.2);
      border-radius: 13px;
      background: rgba(245,253,254,0.9);
      padding: 0 14px;
      font-size: 14px; color: #1a2d3a;
      font-family: inherit;
      transition: all 0.22s cubic-bezier(0.16,1,0.3,1);
      outline: none;
    }
    .input-field.pl-icon { padding-left: 40px; }
    .input-field.pr-icon { padding-right: 44px; }
    .input-field::placeholder { color: #a0b5bf; }
    .input-field:focus {
      border-color: #00B4C6;
      background: #fff;
      box-shadow: 0 0 0 4px rgba(0,180,198,0.12);
    }
    .input-field.input-err { border-color: rgba(242,92,120,0.45) !important; }
    .input-field.input-err:focus { box-shadow: 0 0 0 4px rgba(242,92,120,0.1) !important; }

    .eye-btn {
      position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
      background: none; border: none; color: #a0b5bf;
      cursor: pointer; padding: 4px;
      display: flex; align-items: center; justify-content: center;
      transition: color .2s;
    }
    .eye-btn:hover { color: #00B4C6; }

    /* Submit */
    .submit-btn {
      width: 100%; height: 50px;
      display: flex; align-items: center; justify-content: center; gap: 9px;
      border-radius: 14px; border: none; cursor: pointer;
      background: linear-gradient(135deg, #00B4C6 0%, #007A8A 100%);
      color: #fff; font-size: 15px; font-weight: 700;
      font-family: inherit;
      transition: all 0.35s cubic-bezier(0.23,1,0.32,1);
      position: relative; overflow: hidden;
      box-shadow: 0 6px 24px rgba(0,180,198,0.38);
      margin-top: 6px;
    }
    .submit-btn::before {
      content: '';
      position: absolute; inset: 0;
      background: linear-gradient(120deg, transparent 30%, rgba(255,255,255,0.45) 50%, transparent 70%);
      transform: translateX(-120%);
      transition: transform 0.6s;
    }
    .submit-btn:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 12px 36px rgba(0,180,198,0.5);
    }
    .submit-btn:hover::before { transform: translateX(120%); }
    .submit-btn:active:not(:disabled) { transform: translateY(0) scale(0.98); }
    .submit-btn:disabled { opacity: 0.65; cursor: not-allowed; transform: none; }

    .spin { animation: sp 0.8s linear infinite; }
    @keyframes sp { from { transform: rotate(0) } to { transform: rotate(360deg) } }

    /* Register */
    .register-hint { text-align: center; font-size: 13px; color: #5a7a8a; margin-top: 20px; margin-bottom: 0; }
    .register-link { color: #00B4C6; font-weight: 700; text-decoration: none; margin-left: 4px; transition: opacity .2s; }
    .register-link:hover { opacity: 0.75; }

    /* Trust row */
    .trust-row {
      display: flex; align-items: center; justify-content: center; gap: 12px;
      margin-top: 20px;
      padding-top: 18px;
      border-top: 1px solid rgba(0,180,198,0.1);
    }
    .trust-item { display: flex; align-items: center; gap: 5px; font-size: 11px; color: #8aaabb; font-weight: 500; }
    .trust-dot { width: 3px; height: 3px; border-radius: 50%; background: rgba(0,180,198,0.3); }
  `],
})
export class Login implements OnInit, OnDestroy {
  form: FormGroup;
  slides = SLIDES;
  demos  = DEMOS;
  current    = 0;
  loading    = signal(false);

  taglines = [
    'Formation professionnelle IT continue',
    'Certifications reconnues en entreprise',
    'Cloud · DevOps · Cybersécurité · Data',
    'Apprentissage adaptatif par l\'IA',
    '12 000+ professionnels formés',
  ];
  error      = signal('');
  showPw     = false;
  logoVisualFailed = false;
  logoCardFailed   = false;

  private timer: ReturnType<typeof setInterval> | null = null;

  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router) {
    this.form = this.fb.group({
      email:    ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });
  }

  ngOnInit() {
    this.timer = setInterval(() => {
      this.current = (this.current + 1) % this.slides.length;
    }, 5000);
  }

  ngOnDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  goTo(i: number) {
    this.current = i;
    if (this.timer) { clearInterval(this.timer); }
    this.timer = setInterval(() => {
      this.current = (this.current + 1) % this.slides.length;
    }, 5000);
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
        if (role === 'ADMIN') {
          this.auth.logout();
          this.error.set('Accès administrateur refusé ici. Utilisez le portail dédié : /portail-admin');
          return;
        }
        if (role === 'TRAINER') this.router.navigate(['/trainer/dashboard']);
        else                    this.router.navigate(['/student/dashboard']);
      },
      error: (e: any) => {
        this.loading.set(false);
        this.error.set(e?.error?.message ?? 'Identifiants incorrects');
      },
    });
  }
}
