import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: number;
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

  private add(message: string, type: ToastType) {
    const id = ++_id;
    this.toasts.update(t => [...t, { id, message, type }]);
    setTimeout(() => this.dismiss(id), 4200);
  }

  success(message: string) { this.add(message, 'success'); }
  error(message: string)   { this.add(message, 'error');   }
  info(message: string)    { this.add(message, 'info');    }
  warning(message: string) { this.add(message, 'warning'); }

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
