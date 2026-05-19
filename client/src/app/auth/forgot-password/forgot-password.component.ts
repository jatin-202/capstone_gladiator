import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss']
})
export class ForgotPasswordComponent {

  step: number = 1;
  email: string = '';
  otp: string = '';
  newPassword: string = '';
  confirmPassword: string = '';
  message: string = '';
  errorMessage: string = '';
  loading: boolean = false;

  constructor(private authService: AuthService, private router: Router) {}

  sendOtp() {
    this.errorMessage = '';
    this.message = '';
    if (!this.email) {
      this.errorMessage = 'Please enter your email';
      return;
    }
    this.loading = true;
    this.authService.forgotPassword(this.email).subscribe({
      next: (res: any) => {
        this.loading = false;
        this.message = res.message || 'OTP sent to your email!';
        this.step = 2;
      },
      error: (err: any) => {
        this.loading = false;
        this.errorMessage = err.error?.error || err.error?.message || 'Failed to send OTP';
      }
    });
  }

  resetPassword() {
    this.errorMessage = '';
    this.message = '';

    if (!this.otp || !this.newPassword || !this.confirmPassword) {
      this.errorMessage = 'All fields are required';
      return;
    }
    if (this.newPassword !== this.confirmPassword) {
      this.errorMessage = 'Passwords do not match';
      return;
    }
    if (this.newPassword.length < 6) {
      this.errorMessage = 'Password must be at least 6 characters';
      return;
    }

    this.loading = true;
    this.authService.resetPassword(this.email, this.otp, this.newPassword).subscribe({
      next: (res: any) => {
        this.loading = false;
        this.message = res.message || 'Password reset successful!';
        setTimeout(() => this.router.navigate(['/login']), 2000);
      },
      error: (err: any) => {
        this.loading = false;
        this.errorMessage = err.error?.error || err.error?.message || 'Invalid OTP or reset failed';
      }
    });
  }

  goBack() {
    if (this.step === 2) {
      this.step = 1;
    } else {
      this.router.navigate(['/login']);
    }
  }
}