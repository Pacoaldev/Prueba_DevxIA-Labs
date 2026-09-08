import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { Role } from '../../../core/models/auth.model';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="register-container">
      <div class="register-card">
        <div class="header">
          <h2>Registrar Usuario</h2>
          <p>Exclusivo para Supervisores de TransLog</p>
        </div>

        <form [formGroup]="form" (ngSubmit)="onSubmit()">
          <div class="form-group">
            <label for="email">Correo Electrónico</label>
            <input id="email" type="email" formControlName="email" placeholder="operador@translog.com" />
          </div>

          <div class="form-group">
            <label for="password">Contraseña</label>
            <input id="password" type="password" formControlName="password" placeholder="••••••••" />
          </div>

          <div class="form-group">
            <label for="role">Rol</label>
            <select id="role" formControlName="role">
              <option [value]="Role.OPERATOR">Operador</option>
              <option [value]="Role.SUPERVISOR">Supervisor</option>
            </select>
          </div>

          <div *ngIf="successMessage" class="alert-success">
            {{ successMessage }}
          </div>

          <div *ngIf="errorMessage" class="alert-error">
            {{ errorMessage }}
          </div>

          <button type="submit" [disabled]="form.invalid || loading" class="btn-submit">
            {{ loading ? 'Registrando...' : 'Registrar Usuario' }}
          </button>
        </form>

        <div class="footer">
          <a routerLink="/shipments">Volver al Panel de Envíos</a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .register-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: #f1f5f9;
      font-family: system-ui, -apple-system, sans-serif;
    }
    .register-card {
      background: white;
      padding: 2.5rem;
      border-radius: 12px;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.08);
      width: 100%;
      max-width: 420px;
    }
    .header h2 { margin: 0 0 0.5rem; color: #0f172a; font-size: 1.75rem; text-align: center; }
    .header p { margin: 0 0 2rem; color: #64748b; font-size: 0.9rem; text-align: center; }
    .form-group { margin-bottom: 1.25rem; }
    .form-group label { display: block; margin-bottom: 0.5rem; font-weight: 500; color: #334155; font-size: 0.9rem; }
    .form-group input, .form-group select {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      box-sizing: border-box;
      font-size: 1rem;
    }
    .alert-success { background: #f0fdf4; color: #166534; padding: 0.75rem; border-radius: 6px; font-size: 0.875rem; margin-bottom: 1rem; border: 1px solid #bbf7d0; }
    .alert-error { background: #fef2f2; color: #991b1b; padding: 0.75rem; border-radius: 6px; font-size: 0.875rem; margin-bottom: 1rem; border: 1px solid #fecaca; }
    .btn-submit {
      width: 100%;
      padding: 0.85rem;
      background: #059669;
      color: white;
      border: none;
      border-radius: 6px;
      font-weight: 600;
      font-size: 1rem;
      cursor: pointer;
    }
    .btn-submit:hover:not(:disabled) { background: #047857; }
    .btn-submit:disabled { background: #94a3b8; cursor: not-allowed; }
    .footer { margin-top: 1.5rem; text-align: center; font-size: 0.9rem; }
    .footer a { color: #2563eb; text-decoration: none; }
  `],
})
export class RegisterComponent {
  Role = Role;
  form: FormGroup;
  loading = false;
  successMessage = '';
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      role: [Role.OPERATOR, [Validators.required]],
    });
  }

  onSubmit(): void {
    if (this.form.invalid) return;

    this.loading = true;
    this.successMessage = '';
    this.errorMessage = '';

    this.authService.register(this.form.value).subscribe({
      next: (user) => {
        this.loading = false;
        this.successMessage = `Usuario ${user.email} (${user.role}) registrado exitosamente.`;
        this.form.reset({ role: Role.OPERATOR });
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.message || 'Error al registrar el usuario.';
      },
    });
  }
}
