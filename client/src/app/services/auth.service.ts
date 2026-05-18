import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { LoginRequest } from '../model/loginrequest';
import { LoginResponse } from '../model/login-response';

@Injectable({ providedIn: 'root' })
export class AuthService {

  private baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getToken(): string {
    return localStorage.getItem('token') || '';
  }

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.baseUrl}/api/auth/login`, credentials);
  }

  register(user: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/api/auth/register`, user);
  }

  // ✅ REAL-TIME: Check username exists
  checkUsername(username: string): Observable<boolean> {
    return this.http.get<boolean>(`${this.baseUrl}/api/auth/check-username/${username}`);
  }

  // ✅ REAL-TIME: Check email exists
  checkEmail(email: string): Observable<boolean> {
    return this.http.get<boolean>(`${this.baseUrl}/api/auth/check-email/${email}`);
  }
}