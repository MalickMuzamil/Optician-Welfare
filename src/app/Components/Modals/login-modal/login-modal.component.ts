import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { GeneralService } from '../../../shared/general.service';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';

declare var bootstrap: any;

@Component({
  selector: 'app-login-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login-modal.component.html',
  styleUrls: ['./login-modal.component.css'],
})
export class LoginModalComponent implements OnInit {
  loginForm!: FormGroup;
  submitting = false;

  constructor(
    private fb: FormBuilder,
    private generalService: GeneralService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      this.submitting = true;
      const credentials = this.loginForm.value;

      this.generalService.post('/user/login', credentials).subscribe({
        next: (res) => {
          console.log('Login success:', res);

          const userPayload = res?.payload;
          if (userPayload) {
            localStorage.setItem('adminData', JSON.stringify(userPayload));
          }

          this.loginForm.reset();
          this.closeModal();

          this.router.navigate(['/registrations']);
        },

        error: (err) => {
          console.error('Login error:', err);

          Swal.fire({
            title: 'Login Failed',
            text: 'Invalid credentials or server error. Please try again.',
            icon: 'error',
            confirmButtonColor: '#dc3545',
          });

          this.loginForm.reset();
          this.closeModal();
        },
      });
    }
  }

  closeModal(): void {
    const modalElement = document.getElementById('loginModal');
    if (modalElement) {
      const modalInstance = bootstrap.Modal.getInstance(modalElement);
      if (modalInstance) {
        modalInstance.hide();
      }
    }
  }
}
