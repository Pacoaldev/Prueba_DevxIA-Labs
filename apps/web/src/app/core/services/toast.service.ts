import { Injectable, signal } from '@angular/core';

export type ToastType = 'error' | 'success' | 'info';

export interface ToastMessage {
  id: number;
  message: string;
  type: ToastType;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private nextId = 1;
  private readonly defaultDurationMs = 4000;

  readonly toasts = signal<ToastMessage[]>([]);

  success(message: string, durationMs = this.defaultDurationMs): void {
    this.show(message, 'success', durationMs);
  }

  error(message: string, durationMs = this.defaultDurationMs): void {
    this.show(message, 'error', durationMs);
  }

  info(message: string, durationMs = this.defaultDurationMs): void {
    this.show(message, 'info', durationMs);
  }

  dismiss(id: number): void {
    this.toasts.update((list) => list.filter((t) => t.id !== id));
  }

  private show(message: string, type: ToastType, durationMs: number): void {
    const id = this.nextId++;
    this.toasts.update((list) => [...list, { id, message, type }]);
    window.setTimeout(() => this.dismiss(id), durationMs);
  }
}
