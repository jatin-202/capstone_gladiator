import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-verify-otp',
  templateUrl: './verify-otp.component.html',
 styleUrls: ['./verify-otp.component.css']
})
export class VerifyOtpComponent implements OnInit, OnDestroy {

  otpDigits: string[] = ['', '', '', '', '', ''];
  email: string = '';
  username: string = '';
  type: string = ''; // 'login' or 'register'

  showError = false;
  errorMessage = '';
  showSuccess = false;
  successMessage = '';

  // ✅ Resend timer
  resendTimer = 60;
  canResend = false;
  timerInterval: any;

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.email = localStorage.getItem('otpEmail') || '';
    this.username = localStorage.getItem('otpUsername') || '';
    this.type = this.route.snapshot.queryParams['type'] || 'register';

    // If no email, redirect back
    if (!this.email) {
      this.router.navigate(['/login']);
      return;
    }

    this.startTimer();
  }

  ngOnDestroy(): void {
    clearInterval(this.timerInterval);
  }
// ✅ Prevents Angular from recreating DOM inputs
trackByIndex(index: number): number {
  return index;
}

// ✅ Full control — no double typing, no skipping
onKeyDown(event: KeyboardEvent, index: number): void {
  event.preventDefault();
  const key = event.key;

  // ✅ BACKSPACE
  if (key === 'Backspace') {
    const current = document.getElementById('otp-' + index) as HTMLInputElement;
    if (current) current.value = '';
    this.otpDigits[index] = '';

    if (index > 0) {
      setTimeout(() => {
        const prev = document.getElementById('otp-' + (index - 1)) as HTMLInputElement;
        if (prev) prev.focus();
      }, 10);
    }
    return;
  }

  // ✅ ONLY DIGITS
  if (!/^\d$/.test(key)) return;

  // ✅ Set value manually
  const current = document.getElementById('otp-' + index) as HTMLInputElement;
  if (current) current.value = key;
  this.otpDigits[index] = key;

  // ✅ Delayed focus — prevents keydown firing on next box
  if (index < 5) {
    setTimeout(() => {
      const next = document.getElementById('otp-' + (index + 1)) as HTMLInputElement;
      if (next) next.focus();
    }, 10);
  }
}

// ✅ Handle paste
onPaste(event: ClipboardEvent): void {
  event.preventDefault();
  const pasteData = event.clipboardData?.getData('text')?.trim() || '';
  if (/^\d{6}$/.test(pasteData)) {
    for (let i = 0; i < 6; i++) {
      this.otpDigits[i] = pasteData[i];
      const box = document.getElementById('otp-' + i) as HTMLInputElement;
      if (box) box.value = pasteData[i];
    }
    const lastInput = document.getElementById('otp-5') as HTMLInputElement;
    lastInput?.focus();
  }
}
  // ✅ Verify OTP
  verifyOtp(): void {
    const otp = this.otpDigits.join('');

    if (otp.length !== 6) {
      this.showError = true;
      this.errorMessage = 'Please enter all 6 digits';
      return;
    }

    this.showError = false;

    if (this.type === 'login') {
      // ✅ LOGIN OTP → returns JWT
      this.authService.verifyLoginOtp(this.email, otp).subscribe({
        next: (res: any) => {
          if (res.token) {
            localStorage.setItem('token', res.token);
            localStorage.setItem('role', res.role);
            localStorage.setItem('userId', res.userId?.toString());
            localStorage.setItem('username', res.username);
            localStorage.removeItem('otpEmail');
            localStorage.removeItem('otpUsername');
            this.router.navigate(['/dashboard']);
          }
        },
        error: (err) => {
          this.showError = true;
          this.errorMessage = err?.error?.message || 'Invalid or expired OTP';
        }
      });

    } else {
      // ✅ REGISTER OTP → verify email
      this.authService.verifyRegisterOtp(this.email, otp).subscribe({
        next: (res: any) => {
          this.showSuccess = true;
          this.successMessage = 'Email verified! Redirecting to login...';
          localStorage.removeItem('otpEmail');
          localStorage.removeItem('otpUsername');
          setTimeout(() => this.router.navigate(['/login']), 2000);
        },
        error: (err) => {
          this.showError = true;
          this.errorMessage = err?.error?.message || 'Invalid or expired OTP';
        }
      });
    }
  }

  // ✅ Resend OTP
  resendOtp(): void {
    if (!this.canResend) return;

    this.authService.sendOtp(this.email).subscribe({
      next: () => {
        this.showSuccess = true;
        this.successMessage = 'OTP resent successfully!';
        this.showError = false;
        this.canResend = false;
        this.resendTimer = 60;
        this.startTimer();

        setTimeout(() => this.showSuccess = false, 3000);
      },
      error: () => {
        this.showError = true;
        this.errorMessage = 'Failed to resend OTP';
      }
    });
  }

  // ✅ Countdown timer
  startTimer(): void {
    this.canResend = false;
    this.resendTimer = 60;

    this.timerInterval = setInterval(() => {
      this.resendTimer--;
      if (this.resendTimer <= 0) {
        clearInterval(this.timerInterval);
        this.canResend = true;
      }
    }, 1000);
  }
}