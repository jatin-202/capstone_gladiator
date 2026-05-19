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

  login(credentials: LoginRequest): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/api/auth/login`, credentials);
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

  // ✅ OTP: Send OTP to email
  sendOtp(email: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/api/auth/send-otp`, { email });
  }

  // ✅ OTP: Verify registration OTP
  verifyRegisterOtp(email: string, otp: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/api/auth/verify-register-otp`, { email, otp });
  }

  // ✅ OTP: Verify login OTP (returns JWT)
  verifyLoginOtp(email: string, otp: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/api/auth/verify-login-otp`, { email, otp });
  }
  forgotPassword(email: string): Observable<any> {
  return this.http.post(`${this.baseUrl}/api/auth/forgot-password`, { email });
}

resetPassword(email: string, otp: string, newPassword: string): Observable<any> {
  return this.http.post(`${this.baseUrl}/api/auth/reset-password`, { email, otp, newPassword });
}
}