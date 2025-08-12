import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { GeneralService } from '../../shared/general.service';
import { Subscription } from 'rxjs';
import { RouterLink } from '@angular/router';

declare var bootstrap: any;

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './about.component.html',
  styleUrl: './about.component.css',
})


export class AboutComponent implements OnInit, OnDestroy {
  latestEvent: any = null;
  upcomingEvents: any[] = [];
  countdown: string = '';
  private countdownInterval: any;
  private latestEventSubscription: Subscription | undefined;

  constructor(private generalService: GeneralService) {}

  ngOnInit(): void {
    this.loadLatestEvent().subscribe({
      next: (response: any) => this.handleLatestEventResponse(response),
      error: (err) => console.error('Error loading latest event:', err),
    });
  }

  loadLatestEvent() {
    const payload = { page: 1, size: 4 };
    return this.generalService.post('/events/getLatestEvents', payload);
  }

  private handleLatestEventResponse(response: any) {
    const items = response.payload?.items;
    if (items && items.length > 0) {
      this.latestEvent = items[0];
      this.upcomingEvents = items.slice(1); // 👈 new addition

      this.updateCountdown();

      if (this.countdownInterval) {
        clearInterval(this.countdownInterval);
      }

      this.countdownInterval = setInterval(() => {
        this.updateCountdown();
      }, 60000);
    }
  }

  updateCountdown() {
    if (!this.latestEvent || !this.latestEvent.eventDateFrom) {
      this.countdown = '';
      return;
    }

    const startDate = new Date(this.latestEvent.eventDateFrom);
    const now = new Date();

    let diff = startDate.getTime() - now.getTime();

    if (diff <= 0) {
      this.countdown = 'Started';
      return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    diff -= days * (1000 * 60 * 60 * 24);

    const hours = Math.floor(diff / (1000 * 60 * 60));
    diff -= hours * (1000 * 60 * 60);

    const minutes = Math.floor(diff / (1000 * 60));

    this.countdown = `${days}d ${hours}h ${minutes}m`;
  }

  openSignupModal() {
    this.latestEventSubscription = this.loadLatestEvent().subscribe({
      next: (response: any) => {
        this.handleLatestEventResponse(response);

        if (this.latestEvent?.eventId) {
          localStorage.setItem('eventId', this.latestEvent.eventId.toString());
        }

        const modalElement = document.getElementById('signupModal');
        if (modalElement) {
          const modal = bootstrap.Modal.getOrCreateInstance(modalElement);
          modal.show();
        }
      },
      error: (err) => {
        console.error('Error loading latest event:', err);
      },
    });
  }

  ngOnDestroy(): void {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }

    if (this.latestEventSubscription) {
      this.latestEventSubscription.unsubscribe();
    }
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
