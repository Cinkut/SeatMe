import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs';
import { LoginResponse } from '../models';

const TOKEN_KEY = 'seatme_token';

@Injectable({ providedIn: 'root' })
export class AuthService {
  readonly apiUrl = 'http://localhost:3000/api';
  readonly token = signal<string | null>(localStorage.getItem(TOKEN_KEY));

  constructor(private readonly http: HttpClient) {}

  login(email: string, password: string) {
    return this.http
      .post<LoginResponse>(`${this.apiUrl}/auth/login`, { email, password })
      .pipe(tap((response) => this.setToken(response.accessToken)));
  }

  logout() {
    localStorage.removeItem(TOKEN_KEY);
    this.token.set(null);
  }

  private setToken(token: string) {
    localStorage.setItem(TOKEN_KEY, token);
    this.token.set(token);
  }
}
