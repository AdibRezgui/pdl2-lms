import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: number;
  title?: string;
  message: string;
  type: ToastType;
}

export interface ConfirmState {
  message: string;
  resolve: (value: boolean) => void;
}

let _id = 0;

@Injectable({ providedIn: 'root' })
export class ToastService {
  toasts = signal<Toast[]>([]);
  confirmState = signal<ConfirmState | null>(null);

  private add(message: string, type: ToastType, title?: string) {
    const id = ++_id;
    this.toasts.update(t => [...t, { id, message, type, title }]);
    const duration = type === 'error' ? 6200 : 4200;
    setTimeout(() => this.dismiss(id), duration);
  }

  success(message: string, title?: string) { this.add(message, 'success', title); }
  error(message: string, title?: string)   { this.add(message, 'error',   title); }
  info(message: string, title?: string)    { this.add(message, 'info',    title); }
  warning(message: string, title?: string) { this.add(message, 'warning', title); }

  dismiss(id: number) {
    this.toasts.update(t => t.filter(x => x.id !== id));
  }

  confirm(message: string): Promise<boolean> {
    return new Promise(resolve => {
      this.confirmState.set({ message, resolve });
    });
  }

  resolveConfirm(value: boolean) {
    const state = this.confirmState();
    if (state) {
      state.resolve(value);
      this.confirmState.set(null);
    }
  }
}
