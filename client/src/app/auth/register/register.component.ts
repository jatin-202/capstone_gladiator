import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpService } from '../../../services/http.service';
import { AuthService } from '../../services/auth.service';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent implements OnInit, OnDestroy {

  registerForm!: FormGroup;
  showPassword = false;
  showMessage = false;
  showError = false;
  responseMessage = '';
  errorMessage = '';

  // ✅ Field-specific errors (from submit)
  fieldErrors: any = {};

  // ✅ REAL-TIME STATUS: '' | 'checking' | 'taken' | 'available'
  usernameStatus: string = '';
  emailStatus: string = '';

  private subscriptions: Subscription[] = [];

  constructor(
    private fb: FormBuilder,
    private httpService: HttpService,
    private authService: AuthService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.registerForm = this.fb.group({

      username: [
        '',
        [
          Validators.required,
          Validators.minLength(3),
          Validators.maxLength(20),
          Validators.pattern('^[a-zA-Z0-9_]+$')
        ]
      ],

      email: ['', [Validators.required, Validators.email]],

      password: [
        '',
        [
          Validators.required,
          Validators.minLength(8),
          Validators.pattern('^(?=.*[A-Z])(?=.*[a-z])(?=.*\\d)(?=.*[@$!%*?&]).+$')
        ]
      ],

      contactNumber: [
        '',
        [Validators.pattern('^[6-9][0-9]{9}$')]
      ],

      role: ['PASSENGER', Validators.required]
    });

    // ✅ REAL-TIME USERNAME CHECK
    const usernameSub = this.registerForm.get('username')!.valueChanges
      .pipe(
        debounceTime(400),
        distinctUntilChanged(),
        switchMap((value: string) => {
          // Only check if basic validations pass
          if (!value || value.length < 3 || !/^[a-zA-Z0-9_]+$/.test(value)) {
            this.usernameStatus = '';
            return [];
          }
          this.usernameStatus = 'checking';
          return this.authService.checkUsername(value);
        })
      )
      .subscribe({
        next: (exists: boolean) => {
          this.usernameStatus = exists ? 'taken' : 'available';
        },
        error: () => {
          this.usernameStatus = '';
        }
      });

    // ✅ REAL-TIME EMAIL CHECK
    const emailSub = this.registerForm.get('email')!.valueChanges
      .pipe(
        debounceTime(400),
        distinctUntilChanged(),
        switchMap((value: string) => {
          // Only check if email format is valid
          if (!value || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
            this.emailStatus = '';
            return [];
          }
          this.emailStatus = 'checking';
          return this.authService.checkEmail(value);
        })
      )
      .subscribe({
        next: (exists: boolean) => {
          this.emailStatus = exists ? 'taken' : 'available';
        },
        error: () => {
          this.emailStatus = '';
        }
      });

    this.subscriptions.push(usernameSub, emailSub);
  }

  // ✅ Cleanup subscriptions
  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  get f(): any {
    return this.registerForm.controls;
  }

  onSubmit(): void {

    // ✅ Block submit if username/email is taken
    if (this.usernameStatus === 'taken' || this.emailStatus === 'taken') {
      return;
    }

    // ✅ Reset errors before submit
    this.fieldErrors = {};
    this.showError = false;

    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    const formData = { ...this.registerForm.value };

    if (!formData.contactNumber) {
      delete formData.contactNumber;
    } else {
      formData.contactNumber = Number(formData.contactNumber);
    }
    this.httpService.registerUser(formData).subscribe({

      next: (res: any) => {

        // ✅ OTP REQUIRED → redirect to verify page
        if (res.otpRequired) {
          localStorage.setItem('otpEmail', res.email);
          localStorage.setItem('otpUsername', res.username);
          this.router.navigate(['/verify-otp'], {
            queryParams: { type: 'register' }
          });
          return;
        }

        // Fallback (if OTP ever disabled)
        this.showMessage = true;
        this.responseMessage = `Registered successfully as ${res.username}`;
        this.showError = false;
        setTimeout(() => this.router.navigate(['/login']), 1500);
      },

      error: (err) => {

        // ✅ FIELD LEVEL ERROR HANDLING
        if (err?.error?.field) {
          this.fieldErrors[err.error.field] = err.error.message;
          return;
        }

        // ✅ GENERAL ERROR
        this.showError = true;
        this.errorMessage =
          err?.error?.message ||
          'Registration failed. Please try again.';
      }

    });
  }
}