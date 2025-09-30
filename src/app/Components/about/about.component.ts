import { CommonModule } from '@angular/common';
import {
  Component,
  ChangeDetectionStrategy,
  ViewChild,
  ElementRef,
  inject,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { GeneralService } from '../../shared/general.service';
import {
  Observable,
  combineLatest,
  timer,
  map,
  shareReplay,
  distinctUntilChanged,
  firstValueFrom,
  filter,
  of,
} from 'rxjs';
import { SignupModalComponent } from '../Modals/signup-modal/signup-modal.component';
import { NgOptimizedImage } from '@angular/common';


declare const bootstrap: any;

interface EventItem {
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

interface LatestEventsResponse {
  status: string;
  payload?: {
    totalPages: number;
    pageSize: number;
    currentPage: number;
    items: EventItem[];
    totalElements: number;
  };
  errors: unknown[];
  metadata: unknown;
}
type Resource = {
  id: string;
  title: string;
  description?: string;
  url: string;
  viewUrl?: string;
  downloadName?: string;
  sizeBytes: number;
  mimeType: string;
  fileExt?: string;
  updatedAt: string;
};

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule, RouterLink, SignupModalComponent, NgOptimizedImage],
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AboutComponent {
  @ViewChild('signupModal', { static: false })
  signupModalRef?: ElementRef<HTMLElement>;
  selectedEvent: EventItem | null = null;
  generalService: GeneralService = inject(GeneralService);
  kinds: string[] = [];

  private readonly latestEvents$: Observable<EventItem[]> = this.generalService
    .post<LatestEventsResponse>('/events/getLatestEvents', { page: 1, size: 4 })
    .pipe(
      map((r) => r.payload?.items ?? []),
      shareReplay({ bufferSize: 1, refCount: true })
    );

  ngOnInit(): void {
    this.latestEvents$.subscribe((events) => {
      console.log('Latest events in About Section:', events);

      this.kinds = [
        ...new Set(events.map((e) => e.kind).filter((k): k is string => !!k)),
      ];
      console.log('Kinds extracted:', this.kinds);
    });
  }

  readonly featuredLatestEvent$: Observable<EventItem | null> =
    this.latestEvents$.pipe(
      map((items) => items.find((e) => e.latest === true) ?? null),
      shareReplay({ bufferSize: 1, refCount: true })
    );

  readonly upcomingEvents$: Observable<EventItem[]> = this.latestEvents$.pipe(
    map((items) => {
      const idx = items.findIndex((e) => e.latest === true);
      if (idx >= 0) return items.filter((_, i) => i !== idx);
      return items.slice(1);
    }),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  readonly countdown$: Observable<string> = combineLatest([
    this.featuredLatestEvent$,
    timer(0, 60_000),
  ]).pipe(
    filter(([evt]) => !!evt && !!evt!.eventDateFrom),
    map(([evt]) => this.formatCountdown(evt!)),
    distinctUntilChanged()
  );

  async openSignupModal(evt: EventItem): Promise<void> {
    if (!evt?.eventId) return;
    const host =
      this.signupModalRef?.nativeElement ??
      document.getElementById('signupModal');
    if (host && typeof bootstrap !== 'undefined' && bootstrap?.Modal) {
      host.setAttribute('data-event', JSON.stringify(evt));
      const modal = bootstrap.Modal.getOrCreateInstance(host);
      modal.show();
    }
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

  trackByEventId(_: number, ev: EventItem): number {
    return ev.eventId;
  }

  resources$: Observable<Resource[]> = of([
    {
      id: '1',
      title: 'Membership Form',
      description: 'Apply for Optician Association of Pakistan membership.',
      url: '/assets/resources/membership-form.pdf',
      sizeBytes: 284672,
      mimeType: 'application/pdf',
      fileExt: 'pdf',
      updatedAt: '2025-08-31',
    },
  ]);

  trackByResourceId(_: number, r: Resource) {
    return r.id;
  }

  private formatCountdown(evt: EventItem | null): string {
    if (!evt) return '';
    const start = this.toLocalDate(
      evt.eventDateFrom,
      evt.eventTimeFrom
    )?.getTime();
    if (!start) return '';
    const diff = start - Date.now();
    if (diff <= 0) return 'Started';
    const d = Math.floor(diff / 86_400_000);
    const h = Math.floor((diff % 86_400_000) / 3_600_000);
    const m = Math.floor((diff % 3_600_000) / 60_000);
    return `${d}d ${h}h ${m}m`;
  }

  private toLocalDate(dateISO: string, time?: string): Date | null {
    if (!dateISO) return null;
    const ts = time ? `${dateISO}T${time}` : `${dateISO}T00:00:00`;
    const d = new Date(ts);
    return Number.isNaN(+d) ? null : d;
  }

  formatSize(bytes: number) {
    if (!bytes && bytes !== 0) return '';
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let i = 0;
    let n = bytes;
    while (n >= 1024 && i < units.length - 1) {
      n = n / 1024;
      i++;
    }
    return `${n.toFixed(n < 10 && i > 0 ? 1 : 0)} ${units[i]}`;
  }

  formatDate(dateStr: string) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  fileIcon(mime: string) {
    if (!mime) return 'bi-file-earmark';
    if (mime.includes('pdf')) return 'bi-file-earmark-pdf';
    if (mime.includes('word') || mime.includes('msword'))
      return 'bi-file-earmark-word';
    if (mime.includes('spreadsheet') || mime.includes('excel'))
      return 'bi-file-earmark-excel';
    if (mime.includes('presentation') || mime.includes('powerpoint'))
      return 'bi-file-earmark-ppt';
    if (mime.startsWith('image/')) return 'bi-file-earmark-image';
    if (mime.startsWith('audio/')) return 'bi-file-earmark-music';
    if (mime.startsWith('video/')) return 'bi-file-earmark-play';
    if (mime.includes('zip') || mime.includes('compressed'))
      return 'bi-file-earmark-zip';
    return 'bi-file-earmark';
  }
}
