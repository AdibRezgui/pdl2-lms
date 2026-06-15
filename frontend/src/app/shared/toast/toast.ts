import { Component, inject, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, ToastType } from '../../core/services/toast';

const DEFAULT_TITLES: Record<ToastType, string> = {
  success: 'Succès',
  error:   'Erreur',
  warning: 'Avertissement',
  info:    'Information',
};

const ICONS: Record<ToastType, string> = {
  success: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`,
  error:   `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`,
  warning: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
  info:    `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
};

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  encapsulation: ViewEncapsulation.None,
  template: `
    <!-- ── Toast stack ─────────────────────────────────── -->
    <div class="nb-stack">
      @for (t of toast.toasts(); track t.id) {
        <div class="nb-alert nb-{{ t.type }}" role="alert">

          <!-- Icon -->
          <span class="nb-icon" [innerHTML]="icon(t.type)"></span>

          <!-- Body -->
          <div class="nb-body">
            <h5 class="nb-title">{{ t.title || defaultTitle(t.type) }}</h5>
            <div class="nb-desc">{{ t.message }}</div>
          </div>

          <!-- Close -->
          <button class="nb-close" (click)="toast.dismiss(t.id)" aria-label="Fermer">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      }
    </div>

    <!-- ── Confirm dialog ──────────────────────────────── -->
    @if (toast.confirmState()) {
      <div class="nb-confirm-backdrop" (click)="toast.resolveConfirm(false)">
        <div class="nb-confirm-card" (click)="$event.stopPropagation()">
          <div class="nb-confirm-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          </div>
          <p class="nb-confirm-msg">{{ toast.confirmState()?.message }}</p>
          <div class="nb-confirm-actions">
            <button class="nb-btn-cancel" (click)="toast.resolveConfirm(false)">Annuler</button>
            <button class="nb-btn-ok"     (click)="toast.resolveConfirm(true)">Confirmer</button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    /* ── Stack ────────────────────────────────────────────── */
    .nb-stack {
      position: fixed !important;
      top: 24px; right: 24px;
      display: flex; flex-direction: column; gap: 12px;
      z-index: 99999 !important;
      pointer-events: none;
    }

    /* ── Alert card ─────────────────────────────────────── */
    .nb-alert {
      position: relative;
      display: flex; align-items: flex-start; gap: 12px;
      width: 360px; max-width: calc(100vw - 48px);
      padding: 14px 40px 14px 14px;
      border: 2px solid #000;
      border-radius: 5px;
      box-shadow: 4px 4px 0 0 #000;
      font-family: 'Plus Jakarta Sans', sans-serif;
      pointer-events: all;
      animation: nb-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) both;
      overflow: hidden;
    }

    @keyframes nb-in {
      from { opacity: 0; transform: translateX(80px) scale(0.92); }
      to   { opacity: 1; transform: translateX(0) scale(1); }
    }

    /* ── Variants ───────────────────────────────────────── */
    .nb-success {
      background: #bbf7d0;
      --nb-icon-color: #166534;
    }
    .nb-error {
      background: #1a2d3a;
      color: #fff;
      box-shadow: 4px 4px 0 0 #000;
      --nb-icon-color: #fff;
    }
    .nb-warning {
      background: #fef08a;
      --nb-icon-color: #854d0e;
    }
    .nb-info {
      background: #a5f3fc;
      --nb-icon-color: #0e7490;
    }

    /* ── Icon ──────────────────────────────────────────── */
    .nb-icon {
      flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
      margin-top: 1px;
      color: var(--nb-icon-color, #1a2d3a);
    }

    /* ── Body ──────────────────────────────────────────── */
    .nb-body { flex: 1; min-width: 0; }
    .nb-title {
      margin: 0 0 3px;
      font-size: 13.5px; font-weight: 700; line-height: 1.2;
      color: inherit;
      letter-spacing: -0.01em;
    }
    .nb-desc {
      font-size: 12.5px; font-weight: 500;
      color: inherit; opacity: 0.78;
      line-height: 1.4;
    }
    .nb-error .nb-title { color: #fff; }
    .nb-error .nb-desc  { color: rgba(255,255,255,0.75); }

    /* ── Close button ──────────────────────────────────── */
    .nb-close {
      position: absolute; top: 10px; right: 10px;
      width: 24px; height: 24px;
      display: flex; align-items: center; justify-content: center;
      background: rgba(0,0,0,0.08); border: 1.5px solid rgba(0,0,0,0.2);
      border-radius: 4px; cursor: pointer; transition: all 0.15s;
      color: inherit;
    }
    .nb-close:hover {
      background: rgba(0,0,0,0.18); transform: scale(1.08);
    }
    .nb-error .nb-close {
      background: rgba(255,255,255,0.1); border-color: rgba(255,255,255,0.25); color: #fff;
    }
    .nb-error .nb-close:hover { background: rgba(255,255,255,0.2); }

    /* ── Progress bar ──────────────────────────────────── */
    .nb-alert::after {
      content: '';
      position: absolute; bottom: 0; left: 0; right: 0;
      height: 3px;
      background: rgba(0,0,0,0.25);
      animation: nb-progress 4.2s linear forwards;
      transform-origin: left;
    }
    .nb-error::after { background: rgba(255,255,255,0.3); animation-duration: 6.2s; }
    @keyframes nb-progress {
      from { transform: scaleX(1); }
      to   { transform: scaleX(0); }
    }

    /* ── Confirm backdrop ──────────────────────────────── */
    .nb-confirm-backdrop {
      position: fixed !important;
      inset: 0;
      background: rgba(0,0,0,0.55);
      backdrop-filter: blur(4px);
      display: flex; align-items: center; justify-content: center;
      z-index: 99998 !important;
      animation: nb-fade-in 0.18s ease both;
    }
    @keyframes nb-fade-in { from { opacity: 0; } to { opacity: 1; } }

    /* ── Confirm card ──────────────────────────────────── */
    .nb-confirm-card {
      background: #fff;
      border: 2px solid #000;
      border-radius: 5px;
      box-shadow: 6px 6px 0 0 #000;
      padding: 28px 24px 22px;
      width: 100%; max-width: 360px;
      text-align: center;
      font-family: 'Plus Jakarta Sans', sans-serif;
      animation: nb-card-in 0.24s cubic-bezier(0.34, 1.4, 0.64, 1) both;
    }
    @keyframes nb-card-in {
      from { opacity: 0; transform: scale(0.86) translateY(20px); }
      to   { opacity: 1; transform: scale(1)    translateY(0); }
    }
    .nb-confirm-icon {
      width: 52px; height: 52px; border-radius: 5px;
      background: #fef08a;
      border: 2px solid #000;
      box-shadow: 3px 3px 0 0 #000;
      color: #000;
      display: flex; align-items: center; justify-content: center;
      margin: 0 auto 16px;
    }
    .nb-confirm-msg {
      font-family: 'Fraunces', Georgia, serif;
      font-size: 15px; font-weight: 700; color: #000;
      line-height: 1.5; margin: 0 0 22px;
    }
    .nb-confirm-actions { display: flex; gap: 10px; }
    .nb-btn-cancel {
      flex: 1; padding: 10px 0;
      border: 2px solid #000; border-radius: 5px;
      box-shadow: 3px 3px 0 0 #000;
      background: #fff; color: #000;
      font-size: 13.5px; font-weight: 700; cursor: pointer;
      font-family: 'Plus Jakarta Sans', sans-serif;
      transition: box-shadow 0.15s, transform 0.15s;
    }
    .nb-btn-cancel:hover {
      box-shadow: 1px 1px 0 0 #000;
      transform: translate(2px, 2px);
    }
    .nb-btn-ok {
      flex: 1; padding: 10px 0;
      border: 2px solid #000; border-radius: 5px;
      box-shadow: 3px 3px 0 0 #000;
      background: #1a2d3a; color: #fff;
      font-size: 13.5px; font-weight: 700; cursor: pointer;
      font-family: 'Plus Jakarta Sans', sans-serif;
      transition: box-shadow 0.15s, transform 0.15s;
    }
    .nb-btn-ok:hover {
      box-shadow: 1px 1px 0 0 #000;
      transform: translate(2px, 2px);
    }
  `],
})
export class ToastComponent {
  toast = inject(ToastService);

  defaultTitle(type: ToastType): string { return DEFAULT_TITLES[type]; }
  icon(type: ToastType): string         { return ICONS[type]; }
}
