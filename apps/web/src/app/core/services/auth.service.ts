import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { AuthResponse, LoginPayload, RegisterPayload, Role, User } from '../models/auth.model';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly API_URL = 'http://localhost:3000/auth';
  private readonly TOKEN_KEY = 'translog_token';
  private readonly USER_KEY = 'translog_user';

  currentUser = signal<User | null>(this.getStoredUser());

  constructor(
    private http: HttpClient,
    private router: Router,
  ) {}

  login(payload: LoginPayload): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_URL}/login`, payload).pipe(
      tap((res) => {
        localStorage.setItem(this.TOKEN_KEY, res.accessToken);
        localStorage.setItem(this.USER_KEY, JSON.stringify(res.user));
        this.currentUser.set(res.user);
      }),
    );
  }

  register(payload: RegisterPayload): Observable<User> {
    return this.http.post<User>(`${this.API_URL}/register`, payload);
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  isSupervisor(): boolean {
    const user = this.currentUser();
    return user?.role === Role.SUPERVISOR;
  }

  private getStoredUser(): User | null {
    const data = localStorage.getItem(this.USER_KEY);
    if (!data) return null;
    try {
      return JSON.parse(data);
    } catch {
      return null;
    }
  }
}
