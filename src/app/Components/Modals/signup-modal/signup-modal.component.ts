import {
  Component,
  OnInit,
  AfterViewInit,
  ChangeDetectorRef,
  ViewChild,
  ElementRef,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { GeneralService } from '../../../shared/general.service';
import Swal from 'sweetalert2';
import { environment } from '../../../../environments/environment.development';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-signup-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './signup-modal.component.html',
  styleUrls: ['./signup-modal.component.css'],
})
export class SignupModalComponent implements OnInit, AfterViewInit {
  @ViewChild('imageInput') imageInput!: ElementRef<HTMLInputElement>;
  signupForm!: FormGroup;
  latestEvent: any = null;
  selectedFile: File | null = null;

  constructor(
    private fb: FormBuilder,
    private generalService: GeneralService,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.signupForm = this.fb.group({
      fullName: ['', Validators.required],
      gender: ['', Validators.required],
      phoneNo: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      address: ['', Validators.required],
      city: ['', Validators.required],
      companyName: ['', Validators.required],
    });

    this.loadLatestEvent();

    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => {
        this.loadLatestEvent();
      });
  }

  ngAfterViewInit(): void {
    const modalEl = document.getElementById('signupModal');
    if (modalEl) {
      modalEl.addEventListener('shown.bs.modal', () => {
        this.loadLatestEvent();
        this.cdr.detectChanges();
      });
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
    } else {
      this.selectedFile = null;
    }
  }

  onSubmit(): void {
    if (!this.signupForm.valid) {
      return;
    }

    const credentials = { ...this.signupForm.value };

    if (credentials.gender) {
      credentials.gender = credentials.gender.toUpperCase();
    }

    const eventId = localStorage.getItem('eventId');
    if (eventId) {
      credentials.eventId = parseInt(eventId, 10);
    }

    const formData = new FormData();
    const jsonBlob = new Blob([JSON.stringify(credentials)], {
      type: 'application/json',
    });
    formData.append('EventRegistrationDto', jsonBlob);

    if (this.selectedFile) {
      formData.append('image', this.selectedFile);
    }

    const xhr = new XMLHttpRequest();
    xhr.open(
      'POST',
      `${environment.apiUrl}/eventtregistration/EventRegistration`,
      true
    );

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        console.log('Registration success:', xhr.responseText);
        this.signupForm.reset();
        this.selectedFile = null;
        localStorage.removeItem('eventId');

        if (this.imageInput) {
          this.imageInput.nativeElement.value = '';
        }

        Swal.fire({
          icon: 'success',
          title: 'Registered!',
          text: 'Your Application submission is successful. You will receive a confirmation email when the application is approved',
          confirmButtonColor: '#28a745',
        });

        window.location.reload();
      } else {
        console.error('Registration error:', xhr.responseText);
        this.signupForm.reset();
        this.selectedFile = null;
        localStorage.removeItem('eventId');

        let errorMessage = 'Something went wrong during registration.';
        try {
          const errorResponse = JSON.parse(xhr.responseText);
          errorMessage =
            errorResponse?.errors?.[0]?.errorPromptMessage ||
            errorResponse?.errors?.[0]?.debugMessage ||
            errorMessage;
        } catch (e) {
          console.error('Failed to parse error response:', e);
        }

        Swal.fire({
          icon: 'error',
          title: 'Oops!',
          text: errorMessage,
          confirmButtonColor: '#dc3545',
        });
      }
    };

    xhr.onerror = () => {
      console.error('Network error');
      Swal.fire({
        icon: 'error',
        title: 'Oops!',
        text: 'Network error during registration.',
        confirmButtonColor: '#dc3545',
      });
    };

    xhr.send(formData);
  }

  loadLatestEvent() {
    const eventId = localStorage.getItem('eventId');
    if (!eventId) {
      return;
    }

    const payload = { page: 1, size: 1 };
    this.generalService.post('/events/getLatestEvents', payload).subscribe({
      next: (response: any) => {
        const items = response.payload?.items;
        if (items && items.length > 0) {
          this.latestEvent = items.find(
            (event: any) => event.eventId.toString() === eventId
          );

          console.log('Latest event loaded:', this.latestEvent);

          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        console.error('Error loading latest event:', err);
      },
    });
  }

  getFormattedDateRange(from: string, to: string): string {
    const fromDate = new Date(from);
    const toDate = new Date(to);

    const fromDay = fromDate.getDate();
    const toDay = toDate.getDate();
    const fromMonth = fromDate.toLocaleString('default', { month: 'long' });
    const toMonth = toDate.toLocaleString('default', { month: 'long' });
    const fromYear = fromDate.getFullYear();
    const toYear = toDate.getFullYear();

    const sameMonth =
      fromDate.getMonth() === toDate.getMonth() && fromYear === toYear;

    if (sameMonth) {
      return `${fromDay} - ${toDay} ${toMonth} ${fromYear}`;
    } else {
      return `${fromDay} ${fromMonth} - ${toDay} ${toMonth} ${toYear}`;
    }
  }
}
