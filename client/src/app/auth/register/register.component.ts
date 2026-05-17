import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpService } from '../../../services/http.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent implements OnInit {

  registerForm!: FormGroup;
  showPassword = false;
  showMessage = false;
  showError = false;
  responseMessage = '';
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private httpService: HttpService,
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
        [Validators.pattern('^[0-9]{10}$')]
      ],

      role: ['PASSENGER', Validators.required]
    });
  }

  // ✅ Cleaner access for HTML (used in validation UI)
  get f(): any {
    return this.registerForm.controls;
  }

  onSubmit(): void {

    // ✅ show validation errors if invalid
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    const formData = { ...this.registerForm.value };

    // ✅ clean contact number
    if (!formData.contactNumber) {
      delete formData.contactNumber;
    } else {
      formData.contactNumber = Number(formData.contactNumber);
    }

    this.httpService.registerUser(formData).subscribe({

      next: (res: any) => {
        this.showMessage = true;
        this.responseMessage = `Registered successfully as ${res.username}`;
        this.showError = false;

        // ✅ auto redirect
        setTimeout(() => this.router.navigate(['/login']), 1500);
      },

      error: (err) => {
        this.showError = true;
        this.errorMessage =
          err?.error?.message ||
          'Registration failed. Username may already exist.';
      }

    });
  }


}