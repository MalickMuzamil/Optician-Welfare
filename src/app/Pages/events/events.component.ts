import { Component, OnInit } from '@angular/core';
import { SidebarComponent } from '../../Components/sidebar/sidebar.component';
import { CommonModule } from '@angular/common';
import { GeneralService } from '../../shared/general.service';
import { PaginationComponent } from '../../Components/pagination/pagination.component';
import { FormsModule } from '@angular/forms';
import { EventModalComponent } from '../../Components/Modals/event-modal/event-modal.component';
import { LazyAlertService } from '../../shared/lazy-alert';

declare var bootstrap: any;

@Component({
  selector: 'app-events',
  standalone: true,
  imports: [
    SidebarComponent,
    CommonModule,
    PaginationComponent,
    FormsModule,
    EventModalComponent,
  ],
  templateUrl: './events.component.html',
  styleUrls: ['./events.component.css'],
})
export class EventsComponent implements OnInit {
  events: any[] = [];
  kinds: string[] = [];
  filteredEvents: any[] = [];
  latestEvent: any = null;
  currentPage = 1;
  totalPages = 1;
  selectedEvent: any = null;
  searchTerm: string = '';
  showDeleteModal = false;
  eventToDelete: any = null;

  constructor(
    private generalService: GeneralService,
    private alerts: LazyAlertService
  ) { }

  ngOnInit(): void {
    this.loadEvents(1, 10);
  }

  loadEvents(page: number, size: number) {
    const payload: any = { page, size };

    this.generalService.post('/events/getLatestEvents', payload).subscribe({
      next: (response: any) => {
        this.events = response.payload?.items || [];
        this.filteredEvents = [...this.events];

        this.totalPages = response.payload?.totalPages || 1;
        this.currentPage = page;

        const allKinds = this.events.map((e) => e.kind).filter((k) => !!k);
        this.kinds = Array.from(new Set(allKinds));

        console.log('Kinds in EventsComponent:', this.kinds);
      },
      error: (err: any) => {
        console.error('Error loading events:', err);
      },
    });
  }

  onPageChange(page: number) {
    this.currentPage = page;
    this.loadEvents(page, 10);
  }

  onSearchChange() {
    const term = this.searchTerm.trim().toLowerCase();

    if (!term) {
      this.filteredEvents = [...this.events];
      return;
    }

    this.filteredEvents = this.events.filter(
      (event) =>
        event.title?.toLowerCase().includes(term) ||
        event.description?.toLowerCase().includes(term) ||
        event.createdByUsername?.toLowerCase().includes(term)
    );
  }

  openEventModal(event: any = null) {
    this.selectedEvent = event;

    if (event?.eventId) {
      localStorage.setItem('eventId', event.eventId.toString());
    }

    const modalElement = document.getElementById('eventModal');
    if (modalElement) {
      const modal = bootstrap.Modal.getOrCreateInstance(modalElement);
      modal.show();
    } else {
      console.warn('Event modal not found in DOM');
    }
  }

  onModalFormSubmitted() {
    const modalElement = document.getElementById('eventModal');
    if (modalElement) {
      const modal = bootstrap.Modal.getInstance(modalElement);
      if (modal) {
        modal.hide();
        this.loadEvents(this.currentPage, 10);
      }
    }

    this.loadEvents(this.currentPage, 10);

    this.selectedEvent = null;
  }

  async deleteEvent(event: any) {
    console.log('Delete clicked for event id:', event.eventId || event.id);

    const confirmed = await this.alerts.confirm({
      title: 'Delete Confirmation',
      text: 'Are you sure you want to delete this event?',
      icon: 'warning',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#d33',
    });

    if (confirmed) {
      const id = event.eventId || event.id;
      this.generalService.delete(`/events/deleteEvent/${id}`, {}).subscribe({
        next: async () => {
          this.events = this.events.filter((e) => e !== event);
          this.filteredEvents = this.filteredEvents.filter((e) => e !== event);

          await this.alerts.fire({
            icon: 'success',
            title: 'Deleted!',
            text: 'Event has been deleted.',
            timer: 2000,
            showConfirmButton: false,
          });

          console.log('Event deleted successfully');
        },
        error: async (err) => {
          console.error('Failed to delete event:', err);
          const serverMessage =
            err?.error?.errors?.[0]?.debugMessage ||
            'Failed to delete event. Please try again.';

          await this.alerts.fire({
            icon: 'error',
            title: 'Error',
            text: serverMessage,
          });
        },
      });
    }
  }

  handleDeleteCancel() {
    this.eventToDelete = null;
    this.showDeleteModal = false;
  }
}
