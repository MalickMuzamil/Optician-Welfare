import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { GeneralService } from '../../../shared/general.service';
import Swal from 'sweetalert2';

declare var bootstrap: any;

@Component({
  selector: 'app-event-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './event-modal.component.html',
  styleUrls: ['./event-modal.component.css'],
})



export class EventModalComponent implements OnInit, OnChanges {
  eventForm: FormGroup;
  loading = false;

  @Input() selectedEvent: any = null;
  @Output() formSubmitted = new EventEmitter<void>();

  constructor(private fb: FormBuilder, private generalService: GeneralService) {
    this.eventForm = this.fb.group({
      title: ['', Validators.required],
      description: ['', Validators.required],
      address: ['', Validators.required],
      eventDateFrom: ['', Validators.required],
      eventDateTo: ['', Validators.required],
      eventTimeFrom: ['', Validators.required],
      eventTimeTo: ['', Validators.required],
      latest: [true],
      paid: [false],
      createdByUserId: [''],
    });
  }

  ngOnInit(): void {
    if (this.selectedEvent) {
      this.patchForm(this.selectedEvent);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['selectedEvent'] && changes['selectedEvent'].currentValue) {
      this.patchForm(changes['selectedEvent'].currentValue);
    } else if (
      changes['selectedEvent'] &&
      !changes['selectedEvent'].currentValue
    ) {
      this.eventForm.reset({
        latest: true,
        paid: false,
        createdByUserId: '',
      });
    }
  }

  patchForm(eventData: any) {
    this.eventForm.patchValue({
      title: eventData.title,
      description: eventData.description,
      address: eventData.address,
      eventDateFrom: eventData.eventDateFrom,
      eventDateTo: eventData.eventDateTo,
      eventTimeFrom: eventData.eventTimeFrom,
      eventTimeTo: eventData.eventTimeTo,
      latest: eventData.latest,
      paid: eventData.paid,
      createdByUserId: eventData.createdByUserId || '',
    });
  }

  get isEditMode(): boolean {
    return (
      !!this.selectedEvent &&
      (!!this.selectedEvent.id || !!this.selectedEvent.eventId)
    );
  }

  onSubmit() {
    if (this.eventForm.invalid) return;

    const userData = localStorage.getItem('adminData');
    const userId = userData ? JSON.parse(userData).id : null;

    if (!userId) {
      Swal.fire({
        icon: 'error',
        title: 'User Not Found',
        text: 'Please login again or check local storage.',
      });
      return;
    }

    this.eventForm.patchValue({ createdByUserId: userId });
    this.loading = true;

    if (this.isEditMode) {
      const id = this.selectedEvent.id || this.selectedEvent.eventId;

      this.generalService
        .patch(`/events/updateEvent/${id}`, this.eventForm.value)
        .subscribe({
          next: () => {
            Swal.fire({
              icon: 'success',
              title: 'Event Updated!',
              text: 'Your event has been successfully updated.',
            });
            this.loading = false;
            this.formSubmitted.emit();
             this.closeModal();
          },
          error: (err) => {
            console.error('Error updating event:', err);
            const serverMessage =
              err?.error?.errors?.[0]?.debugMessage ||
              'Failed to update event. Please try again.';
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: serverMessage,
            });
            this.loading = false;
            this.formSubmitted.emit();
          },
        });
    } else {
      this.generalService
        .post('/events/registerEvent', this.eventForm.value)
        .subscribe({
          next: () => {
            Swal.fire({
              icon: 'success',
              title: 'Event Created!',
              text: 'Your event has been successfully registered.',
            });
            this.eventForm.reset({
              latest: true,
              paid: false,
              createdByUserId: userId,
            });
            this.loading = false;
            this.closeModal();
          },
          error: (err) => {
            console.error('Error creating event:', err);
            const serverMessage =
              err?.error?.errors?.[0]?.debugMessage ||
              'Failed to create event. Please try again.';
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: serverMessage,
            });
            this.eventForm.reset({
              latest: true,
              paid: false,
              createdByUserId: userId,
            });
            this.loading = false;
          },
        });
    }
  }

  closeModal(): void {
    const modalElement = document.getElementById('eventModal');
    if (modalElement) {
      const modalInstance = bootstrap.Modal.getInstance(modalElement);
      if (modalInstance) {
        modalInstance.hide();
      }
    }
  }
}
