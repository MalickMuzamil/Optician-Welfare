import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ViewChild,
  AfterViewInit,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import Swal from 'sweetalert2';
import { environment } from '../../../../environments/environment';
import { HostListener } from '@angular/core';

declare const bootstrap: any;

export interface EventItem {
  eventId: number;
  title: string;
  description?: string;
  eventDateFrom: string;
  eventDateTo: string;
  eventTimeFrom?: string;
  eventTimeTo?: string;
  address?: string;
  createdByUsername?: string;
  paid?: boolean;
  latest?: boolean;
  kind?: string;
}

type Gender = 'Male' | 'Female';

interface SignupFormValue {
  companyName: string;
  fullName: string;
  gender: Gender | '';
  email: string;
  phoneNo: string;
  address: string;
  city: string;
}

@Component({
  selector: 'app-signup-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './signup-modal.component.html',
  styleUrls: ['./signup-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SignupModalComponent implements OnInit, AfterViewInit {
  private readonly fb = inject(FormBuilder);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly http = inject(HttpClient);

  @ViewChild('imageInput', { static: false })
  imageInputRef?: ElementRef<HTMLInputElement>;
  @ViewChild('hostModal', { static: false })
  hostModalRef?: ElementRef<HTMLDivElement>;

  @Input() event: EventItem | null = null;
  @Input() kinds: string[] = [];
  @Output() submitted = new EventEmitter<{
    eventId: number | string;
    payload: SignupFormValue;
    file?: File | null;
  }>();

  readonly signupForm = this.fb.nonNullable.group({
    companyName: this.fb.nonNullable.control('', [
      Validators.required,
      Validators.maxLength(120),
      Validators.pattern(/^[a-zA-Z\s]+$/),
    ]),
    fullName: this.fb.nonNullable.control('', [
      Validators.required,
      Validators.maxLength(120),
      Validators.pattern(/^[a-zA-Z\s]+$/),
    ]),
    gender: this.fb.nonNullable.control<Gender | ''>('', [Validators.required]),
    email: this.fb.nonNullable.control('', [
      Validators.required,
      Validators.email,
      Validators.maxLength(256),
    ]),
    phoneNo: this.fb.nonNullable.control('', [
      Validators.required,
      Validators.maxLength(30),
      Validators.pattern(/^[0-9+\-()\s]{7,30}$/),
    ]),
    address: this.fb.nonNullable.control('', [
      Validators.required,
      Validators.maxLength(200),
    ]),
    city: this.fb.nonNullable.control('', [
      Validators.required,
      Validators.maxLength(120),
    ]),
  });

  private file: File | null = null;
  private fileTouched = false;
  submitting = false;
  private submitAttempted = false;
  private readonly MAX_FILE_SIZE = 5 * 1024 * 1024;
  lastSignupEmail: string | null = null;

  showFullDescription = false;
  innerWidth: number = window.innerWidth;

  toggleDescription() {
    this.showFullDescription = !this.showFullDescription;
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.innerWidth = event.target.innerWidth;
  }

  isDesktop(): boolean {
    return this.innerWidth >= 768;
  }

  get latestEvent(): EventItem | null {
    return this.event ?? null;
  }

  ngOnInit(): void {
    if (!this.event) this.hydrateFromDataset();
    console.log('Kinds for signup modal:', this.kinds);
  }

  ngAfterViewInit(): void {
    const host = this.getModalHost();
    if (!host) return;
    host.addEventListener('show.bs.modal', () => this.hydrateFromDataset());
  }

  open(): void {
    const host = this.getModalHost();
    if (host && typeof bootstrap !== 'undefined' && bootstrap?.Modal) {
      this.hydrateFromDataset();
      const modal = bootstrap.Modal.getOrCreateInstance(host);
      modal.show();
    }
  }

  close(): void {
    const host = this.getModalHost();
    if (host && typeof bootstrap !== 'undefined' && bootstrap?.Modal) {
      const modal = bootstrap.Modal.getOrCreateInstance(host);
      modal.hide();
    }
  }

  onFileSelected(evt: Event): void {
    const input = evt.target as HTMLInputElement;
    this.file = input?.files?.[0] ?? null;
    this.fileTouched = true;
    this.cdr.markForCheck();
  }

  async onSubmit(): Promise<void> {
    this.submitAttempted = true;
    if (!this.event) this.hydrateFromDataset();
    if (!this.event?.eventId) {
      this.touchAll();
      this.cdr.markForCheck();
      return;
    }
    if (this.signupForm.invalid || this.fileInvalid()) {
      this.touchAll();
      this.cdr.markForCheck();
      return;
    }
    this.submitting = true;
    this.signupForm.disable({ emitEvent: false });
    try {
      const payload: SignupFormValue = this.signupForm.getRawValue();
      const evt = {
        eventId: this.event.eventId as number | string,
        payload,
        file: this.file,
      };
      await this.saveToApi(evt);
      this.submitted.emit(evt);
      this.signupForm.reset();
      this.file = null;
      this.fileTouched = false;
      this.submitAttempted = false;
      this.close();
    } finally {
      this.submitting = false;
      this.signupForm.enable({ emitEvent: false });
      this.cdr.markForCheck();
    }
  }

  private async saveToApi(evt: {
    eventId: number | string;
    payload: SignupFormValue;
    file?: File | null;
  }): Promise<void> {
    const credentials: any = { ...evt.payload };
    if (credentials.gender)
      credentials.gender = String(credentials.gender).toUpperCase();
    if (evt.eventId != null) credentials.eventId = evt.eventId;
    const formData = new FormData();
    const jsonBlob = new Blob([JSON.stringify(credentials)], {
      type: 'application/json',
    });
    formData.append('EventRegistrationDto', jsonBlob);
    if (evt.file) formData.append('image', evt.file);
    try {
      await firstValueFrom(
        this.http.post(
          `${environment.apiUrl}/eventtregistration/EventRegistration`,
          formData
        )
      );
      this.lastSignupEmail = credentials.email ?? null;
      Swal.fire({
        icon: 'success',
        title: 'Registered!',
        text: 'Your Application submission is successful. You will receive a confirmation email when the application is approved',
        confirmButtonColor: '#28a745',
      });
    } catch (err: any) {
      let errorMessage = 'Something went wrong during registration.';
      try {
        const e = err?.error;
        errorMessage =
          e?.errors?.[0]?.errorPromptMessage ||
          e?.errors?.[0]?.debugMessage ||
          errorMessage;
      } catch { }
      Swal.fire({
        icon: 'error',
        title: 'Oops!',
        text: errorMessage,
        confirmButtonColor: '#dc3545',
      });
    }
  }

  isInvalid(name: keyof SignupFormValue): boolean {
    const c = this.signupForm.get(name as string);
    return !!c && c.invalid && (c.touched || this.submitAttempted);
  }

  hasError(name: keyof SignupFormValue, error: string): boolean {
    const c = this.signupForm.get(name as string);
    return !!c && c.hasError(error) && (c.touched || this.submitAttempted);
  }

  fileInvalid(): boolean {
    if (!this.latestEvent?.paid) return false;
    if (!this.file) return this.fileTouched || this.submitAttempted;
    if (!this.file.type?.startsWith('image/')) return true;
    if (this.file.size > this.MAX_FILE_SIZE) return true;
    return false;
  }

  fileHasError(kind: 'required' | 'type' | 'size'): boolean {
    if (!this.latestEvent?.paid) return false;
    const active = this.fileTouched || this.submitAttempted;
    if (kind === 'required') return active && !this.file;
    if (!this.file) return false;
    if (kind === 'type') return active && !this.file.type?.startsWith('image/');
    if (kind === 'size') return active && this.file.size > this.MAX_FILE_SIZE;
    return false;
  }

  getFormattedDateRange(
    from?: string,
    to?: string,
    timeFrom?: string,
    timeTo?: string
  ): string {
    if (!from && !to) return '';
    const f = from ? new Date(from) : null;
    const t = to ? new Date(to) : null;
    const df = f ? f.toLocaleDateString() : '';
    const dt = t ? t.toLocaleDateString() : '';
    const tf = timeFrom ?? '';
    const tt = timeTo ?? '';
    if (df && dt && df !== dt)
      return `${df}${tf ? ' ' + tf : ''} – ${dt}${tt ? ' ' + tt : ''}`;
    return `${df || dt}${tf ? ' ' + tf : ''}${tt ? ' – ' + tt : ''}`;
  }

  private hydrateFromDataset(): void {
    try {
      const host = this.getModalHost();
      const raw = host?.dataset?.['event'] ?? host?.getAttribute('data-event');
      if (!raw) return;
      const evt: EventItem = JSON.parse(raw);
      this.event = evt;

      this.kinds = evt.kind ? [evt.kind] : [];

      console.log('Hydrated event:', this.event);
      console.log('Updated kinds:', this.kinds);

      this.cdr.markForCheck();
    } catch (e) {
      console.error(e);
    }
  }

  private getModalHost(): HTMLDivElement | null {
    return (
      this.hostModalRef?.nativeElement ??
      (document.getElementById('signupModal') as HTMLDivElement | null)
    );
  }

  private touchAll(): void {
    this.signupForm.markAllAsTouched();
  }

  private toLocalDate(dateISO: string, time?: string): Date | null {
    if (!dateISO) return null;
    const ts = time ? `${dateISO}T${time}` : `${dateISO}T00:00:00`;
    const d = new Date(ts);
    return Number.isNaN(+d) ? null : d;
  }

  getDateRange(fromDate: string, toDate: string): string {
    const start = this.toLocalDate(fromDate, '');
    const end = this.toLocalDate(toDate, '');
    if (!start || !end) return '';
    const sameDay =
      start.getFullYear() === end.getFullYear() &&
      start.getMonth() === end.getMonth() &&
      start.getDate() === end.getDate();
    const dFmt = new Intl.DateTimeFormat('en-US', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    return sameDay
      ? dFmt.format(start)
      : `${dFmt.format(start)} – ${dFmt.format(end)}`;
  }

  getTimeRange(
    fromDate: string,
    toDate: string,
    fromTime?: string,
    toTime?: string
  ): string {
    if (!fromTime && !toTime) return '';

    const start = fromTime ? this.toLocalDate(fromDate, fromTime) : null;
    const end = toTime ? this.toLocalDate(toDate, toTime) : null;

    const tFmt = new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

    if (start && end) {
      return `${tFmt.format(start)} – ${tFmt.format(end)}`;
    } else if (start) {
      return `${tFmt.format(start)}`;
    } else if (end) {
      return `${tFmt.format(end)}`;
    }

    return '';
  }
}
