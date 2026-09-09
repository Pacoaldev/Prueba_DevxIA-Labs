import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../services/toast.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-viewport" aria-live="polite" aria-atomic="true">
      @for (toast of toastService.toasts(); track toast.id) {
        <div class="toast" [class]="toast.type" role="status">
          <span class="toast-message">{{ toast.message }}</span>
          <button type="button" class="toast-close" (click)="toastService.dismiss(toast.id)" aria-label="Cerrar">
            ×
          </button>
        </div>
      }
    </div>
  `,
  styles: [
    `
      .toast-viewport {
        position: fixed;
        bottom: 1.25rem;
        right: 1.25rem;
        z-index: 2000;
        display: flex;
        flex-direction: column;
        gap: 0.6rem;
        max-width: min(420px, calc(100vw - 2rem));
        pointer-events: none;
      }
      .toast {
        display: flex;
        align-items: flex-start;
        gap: 0.75rem;
        padding: 0.85rem 1rem;
        border-radius: 8px;
        box-shadow: 0 10px 25px rgba(15, 23, 42, 0.18);
        color: #fff;
        pointer-events: auto;
        animation: toast-in 180ms ease-out;
      }
      .toast.error {
        background: #b91c1c;
      }
      .toast.success {
        background: #047857;
      }
      .toast.info {
        background: #1d4ed8;
      }
      .toast-message {
        flex: 1;
        font-size: 0.9rem;
        line-height: 1.4;
      }
      .toast-close {
        background: transparent;
        border: none;
        color: inherit;
        font-size: 1.25rem;
        line-height: 1;
        cursor: pointer;
        opacity: 0.85;
        padding: 0;
      }
      .toast-close:hover {
        opacity: 1;
      }
      @keyframes toast-in {
        from {
          opacity: 0;
          transform: translateY(8px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
    `,
  ],
})
export class ToastContainerComponent {
  constructor(public toastService: ToastService) {}
}
