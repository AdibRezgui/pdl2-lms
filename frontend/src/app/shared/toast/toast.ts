import { Component, inject, ViewEncapsulation } from '@angular/core';
import { ToastService } from '../../core/services/toast';

@Component({
  selector: 'app-toast',
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="toast-stack">
      @for (t of toast.toasts(); track t.id) {
        <div class="toast-item toast-{{ t.type }}" role="alert">
          <span class="toast-icon" [innerHTML]="icon(t.type)"></span>
          <span class="toast-msg">{{ t.message }}</span>
          <button class="toast-close" (click)="toast.dismiss(t.id)" aria-label="Fermer">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      }
    </div>

    @if (toast.confirmState()) {
      <div class="confirm-backdrop" (click)="toast.resolveConfirm(false)">
        <div class="confirm-card" (click)="$event.stopPropagation()">
          <div class="confirm-icon-wrap">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          </div>
          <p class="confirm-msg">{{ toast.confirmState()?.message }}</p>
          <div class="confirm-actions">
            <button class="confirm-cancel" (click)="toast.resolveConfirm(false)">Annuler</button>
            <button class="confirm-ok" (click)="toast.resolveConfirm(true)">Confirmer</button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .toast-stack {
      position: fixed !important;
      bottom: 28px; right: 28px;
      display: flex; flex-direction: column; gap: 10px;
      z-index: 99999 !important;
      pointer-events: none;
    }
    .toast-item {
      display: flex; align-items: center; gap: 12px;
      padding: 13px 16px; border-radius: 16px;
      min-width: 280px; max-width: 380px;
      font-size: 13.5px; font-weight: 600;
      pointer-events: all;
      box-shadow: 0 8px 32px rgba(0,0,0,.14);
      backdrop-filter: blur(12px);
      animation: toast-slide-in .28s cubic-bezier(.34,1.4,.64,1) both;
      border: 1px solid transparent;
      font-family: 'Plus Jakarta Sans', sans-serif;
    }
    @keyframes toast-slide-in {
      from { opacity:0; transform: translateX(60px) scale(.92); }
      to   { opacity:1; transform: translateX(0) scale(1); }
    }
    .toast-msg  { flex: 1; line-height: 1.4; }
    .toast-icon { flex-shrink: 0; display: flex; align-items: center; }
    .toast-close {
      background: none; border: none; cursor: pointer;
      padding: 2px; border-radius: 6px; opacity: .5;
      display: flex; align-items: center; transition: opacity .15s;
    }
    .toast-close:hover { opacity: 1; }
    .toast-success { background: rgba(240,253,246,.97); border-color: rgba(31,157,111,.22); color: #166040; }
    .toast-success .toast-icon { color: #1f9d6f; }
    .toast-error   { background: rgba(255,241,243,.97); border-color: rgba(242,92,120,.22); color: #9b2335; }
    .toast-error .toast-icon   { color: #f25c78; }
    .toast-info    { background: rgba(245,240,255,.97); border-color: rgba(167,139,250,.28); color: #4c3a8a; }
    .toast-info .toast-icon    { color: #7c5ce0; }
    .toast-warning { background: rgba(255,252,235,.97); border-color: rgba(234,179,8,.28); color: #854d0e; }
    .toast-warning .toast-icon { color: #d97706; }

    .confirm-backdrop {
      position: fixed !important;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(34,31,44,.4);
      backdrop-filter: blur(5px);
      display: flex; align-items: center; justify-content: center;
      z-index: 99998 !important;
      animation: confirm-fade .18s ease both;
    }
    @keyframes confirm-fade {
      from { opacity: 0; } to { opacity: 1; }
    }
    .confirm-card {
      background: #ffffff; border-radius: 24px;
      padding: 32px 28px 24px;
      width: 100%; max-width: 360px;
      box-shadow: 0 24px 64px rgba(34,31,44,.2);
      border: 1px solid rgba(167,139,250,.18);
      animation: confirm-card-in .24s cubic-bezier(.34,1.4,.64,1) both;
      text-align: center;
    }
    @keyframes confirm-card-in {
      from { opacity:0; transform: scale(.88) translateY(16px); }
      to   { opacity:1; transform: scale(1) translateY(0); }
    }
    .confirm-icon-wrap {
      width: 52px; height: 52px; border-radius: 50%;
      background: rgba(242,92,120,.08);
      border: 1.5px solid rgba(242,92,120,.22); color: #f25c78;
      display: flex; align-items: center; justify-content: center;
      margin: 0 auto 16px;
    }
    .confirm-msg {
      font-size: 15px; font-weight: 600; color: #221f2c;
      line-height: 1.5; margin: 0 0 24px;
      font-family: 'Fraunces', Georgia, serif;
    }
    .confirm-actions { display: flex; gap: 10px; }
    .confirm-cancel {
      flex: 1; padding: 11px; border-radius: 13px;
      background: rgba(167,139,250,.08); border: 1px solid rgba(167,139,250,.2);
      color: #5c5470; font-size: 14px; font-weight: 600;
      cursor: pointer; transition: background .18s;
      font-family: 'Plus Jakarta Sans', sans-serif;
    }
    .confirm-cancel:hover { background: rgba(167,139,250,.16); }
    .confirm-ok {
      flex: 1; padding: 11px; border-radius: 13px;
      background: linear-gradient(135deg,#f25c78,#e0335c);
      border: none; color: #fff;
      font-size: 14px; font-weight: 700;
      cursor: pointer; box-shadow: 0 4px 14px rgba(242,92,120,.35);
      transition: box-shadow .18s, transform .18s;
      font-family: 'Plus Jakarta Sans', sans-serif;
    }
    .confirm-ok:hover { box-shadow: 0 6px 20px rgba(242,92,120,.5); transform: translateY(-1px); }
  `],
})
export class ToastComponent {
  toast = inject(ToastService);

  icon(type: string): string {
    if (type === 'success') return `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`;
    if (type === 'error')   return `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`;
    if (type === 'warning') return `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`;
    return `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`;
  }
}
