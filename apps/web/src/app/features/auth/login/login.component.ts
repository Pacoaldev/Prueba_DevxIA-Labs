import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="login-container">
      <div class="login-card">
        <div class="header">
          <h2>TransLog - Logística</h2>
          <p>Ingrese sus credenciales para continuar</p>
        </div>

        <form [formGroup]="form" (ngSubmit)="onSubmit()">
          <div class="form-group">
            <label for="email">Correo Electrónico</label>
            <input
              id="email"
              type="email"
              formControlName="email"
              placeholder="supervisor@translog.com"
            />
            <div *ngIf="form.get('email')?.touched && form.get('email')?.invalid" class="error">
              Correo electrónico no válido.
            </div>
          </div>

          <div class="form-group">
            <label for="password">Contraseña</label>
            <input
              id="password"
              type="password"
              formControlName="password"
              placeholder="••••••••"
            />
            <div *ngIf="form.get('password')?.touched && form.get('password')?.invalid" class="error">
              La contraseña debe tener al menos 6 caracteres.
            </div>
          </div>

          <div *ngIf="errorMessage" class="alert-error">
            {{ errorMessage }}
          </div>

          <button type="submit" [disabled]="form.invalid || loading" class="btn-submit">
            {{ loading ? 'Iniciando sesión...' : 'Iniciar Sesión' }}
          </button>
        </form>

        <div class="footer">
          <a routerLink="/tracking">Consultar Seguimiento Público</a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: #f1f5f9;
      font-family: system-ui, -apple-system, sans-serif;
    }
    .login-card {
      background: white;
      padding: 2.5rem;
      border-radius: 12px;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.08);
      width: 100%;
      max-width: 420px;
    }
    .header {
      text-align: center;
      margin-bottom: 2rem;
    }
    .header h2 {
      margin: 0 0 0.5rem;
      color: #0f172a;
      font-size: 1.75rem;
    }
    .header p {
      margin: 0;
      color: #64748b;
      font-size: 0.9rem;
    }
    .form-group {
      margin-bottom: 1.25rem;
    }
    .form-group label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 500;
      color: #334155;
      font-size: 0.9rem;
    }
    .form-group input {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      box-sizing: border-box;
      font-size: 1rem;
      transition: border-color 0.2s;
    }
    .form-group input:focus {
      outline: none;
      border-color: #2563eb;
    }
    .error {
      color: #ef4444;
      font-size: 0.8rem;
      margin-top: 0.25rem;
    }
    .alert-error {
      background: #fef2f2;
      color: #991b1b;
      padding: 0.75rem;
      border-radius: 6px;
      font-size: 0.875rem;
      margin-bottom: 1rem;
      border: 1px solid #fecaca;
    }
    .btn-submit {
      width: 100%;
      padding: 0.85rem;
      background: #2563eb;
      color: white;
      border: none;
      border-radius: 6px;
      font-weight: 600;
      font-size: 1rem;
      cursor: pointer;
      transition: background 0.2s;
    }
    .btn-submit:hover:not(:disabled) {
      background: #1d4ed8;
    }
    .btn-submit:disabled {
      background: #94a3b8;
      cursor: not-allowed;
    }
    .footer {
      margin-top: 1.5rem;
      text-align: center;
      font-size: 0.9rem;
    }
    .footer a {
      color: #2563eb;
      text-decoration: none;
    }
    .footer a:hover {
      text-decoration: underline;
    }
  `],
})
export class LoginComponent {
  form: FormGroup;
  loading = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  onSubmit(): void {
    if (this.form.invalid) return;

    this.loading = true;
    this.errorMessage = '';

    this.authService.login(this.form.value).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/shipments']);
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.message || 'Error de autenticación. Verifique sus credenciales.';
      },
    });
  }
}
