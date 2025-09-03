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
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { GeneralService } from '../../../shared/general.service';
import Swal from 'sweetalert2';
import { QuillModule } from 'ngx-quill';

declare var bootstrap: any;

@Component({
  selector: 'app-event-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, QuillModule],
  templateUrl: './event-modal.component.html',
  styleUrls: ['./event-modal.component.css'],
})
export class EventModalComponent implements OnInit, OnChanges {
  eventForm: FormGroup;
  loading = false;

  @Input() selectedEvent: any = null;
  @Input() kinds: string[] = [];
  @Output() formSubmitted = new EventEmitter<void>();

  readonly staticKinds = ['GENERIC', 'LECTURE'];
  kindsToShow: string[] = [];

  quillModules = {
    toolbar: [
      [{ header: [1, 2, 3, 4, 5, 6, false] }],
      [{ font: [] }, { size: [] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ color: [] }, { background: [] }],
      [{ script: 'sub' }, { script: 'super' }],
      [{ align: [] }],
      [{ list: 'ordered' }, { list: 'bullet' }, { list: 'check' }],
      [{ indent: '-1' }, { indent: '+1' }],
      ['blockquote', 'code-block'],
      ['link', 'image', 'video'],
      ['clean'],
    ],
    history: { delay: 500, maxStack: 200, userOnly: true },
    clipboard: { matchVisual: true },
  };

  formats = [
    'header', 'font', 'size', 'bold', 'italic', 'underline', 'strike',
    'color', 'background', 'script', 'align', 'list', 'indent',
    'blockquote', 'code-block', 'link', 'image', 'video',
  ];

  constructor(private fb: FormBuilder, private generalService: GeneralService) {
    this.eventForm = this.fb.group({
      title: ['', Validators.required],
      kind: ['', Validators.required],
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
    this.kindsToShow = this.isEditMode ? this.kinds : this.staticKinds;

    if (this.selectedEvent) this.patchForm(this.selectedEvent);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['selectedEvent']) {
      if (changes['selectedEvent'].currentValue) {
        this.patchForm(changes['selectedEvent'].currentValue);
      } else {
        this.eventForm.reset({
          latest: true,
          paid: false,
          createdByUserId: '',
          kind: '',
        });
      }
    }

    if (changes['kinds'] && changes['kinds'].currentValue) {
      if (this.isEditMode) {
        this.kindsToShow = this.kinds;
      }
    }
  }

  patchForm(eventData: any) {
    this.eventForm.patchValue({
      title: eventData.title || '',
      description: eventData.description || '', // Quill HTML saved
      address: eventData.address || '',
      eventDateFrom: eventData.eventDateFrom || '',
      eventDateTo: eventData.eventDateTo || '',
      eventTimeFrom: eventData.eventTimeFrom || '',
      eventTimeTo: eventData.eventTimeTo || '',
      latest: eventData.latest ?? true,
      paid: eventData.paid ?? false,
      createdByUserId: eventData.createdByUserId || '',
      kind: eventData.kind || '',
    });
  }

  get isEditMode(): boolean {
    return !!this.selectedEvent && (!!this.selectedEvent.id || !!this.selectedEvent.eventId);
  }

  onSubmit() {
    if (this.eventForm.invalid) {
      console.warn('Form invalid', this.eventForm.value);
      return;
    }

    const userData = localStorage.getItem('adminData');
    const userId = userData ? JSON.parse(userData).id : null;

    if (!userId) {
      Swal.fire({
        icon: 'error',
        title: 'User Not Found',
        text: 'Please login again.',
      });
      return;
    }

    const descriptionHtml = this.eventForm.get('description')?.value || '';

    this.eventForm.patchValue({
      createdByUserId: userId,
      description: descriptionHtml,
    });

    const payload = Object.fromEntries(
      Object.entries(this.eventForm.value).filter(([_, v]) => v !== null && v !== '')
    );

    this.loading = true;

    const request$ = this.isEditMode
      ? this.generalService.patch(
          `/events/updateEvent/${this.selectedEvent.id || this.selectedEvent.eventId}`,
          payload
        )
      : this.generalService.post('/events/registerEvent', payload);

    request$.subscribe({
      next: () => {
        Swal.fire({
          icon: 'success',
          title: this.isEditMode ? 'Event Updated!' : 'Event Created!',
        });
        this.loading = false;
        this.formSubmitted.emit();
        this.closeModal();
      },
      error: (err) => {
        console.error(err);
        this.loading = false;
      },
    });
  }

  closeModal(): void {
    const modalElement = document.getElementById('eventModal');
    if (modalElement) {
      const modalInstance = bootstrap.Modal.getInstance(modalElement);
      if (modalInstance) modalInstance.hide();
    }
  }
}
