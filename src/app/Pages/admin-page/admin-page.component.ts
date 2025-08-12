import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GeneralService } from '../../shared/general.service';
import { SidebarComponent } from '../../Components/sidebar/sidebar.component';
import { PaginationComponent } from '../../Components/pagination/pagination.component';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { DailogBoxComponent } from '../../Components/dailog-box/dailog-box.component'; // add dialog box import
import { DownloadReciptComponent } from '../download-recipt/download-recipt.component';

@Component({
  selector: 'app-admin-page',
  standalone: true,
  imports: [
    CommonModule,
    SidebarComponent,
    PaginationComponent,
    FormsModule,
    DailogBoxComponent,
    DownloadReciptComponent,
  ],
  templateUrl: './admin-page.component.html',
  styleUrls: ['./admin-page.component.css'],
})
export class AdminPageComponent implements OnInit {
  allRegistrations: any[] = [];

  uniqueEvents: { eventId: number; eventTitle: string }[] = [];

  registrations: any[] = [];

  currentPage: number = 1;
  totalPages: number = 1;
  pageSize: number = 10;

  selectedEventId: number | undefined;

  showConfirmDialog = false;
  selectedRegistration: any = null;

  constructor(private generalService: GeneralService) {}

  ngOnInit(): void {
    this.loadRegistrations(this.currentPage, this.pageSize);
  }

  loadRegistrations(page: number, size: number, eventId?: number): void {
    const payload: any = {
      pagination: { page, size },
    };

    if (eventId !== undefined) {
      payload.eventId = eventId;
    }

    this.generalService
      .post('/eventtregistration/getRegisteredUsers', payload)
      .subscribe({
        next: (response) => {
          this.registrations = response.payload?.items || [];
          this.totalPages = response.payload?.totalPages || 1;
          this.currentPage = page;

          if (!eventId) {
            this.allRegistrations = response.payload?.items || [];

            const eventMap = new Map<number, string>();
            this.allRegistrations.forEach((reg) => {
              if (!eventMap.has(reg.eventId)) {
                eventMap.set(reg.eventId, reg.eventTitle);
              }
            });
            this.uniqueEvents = Array.from(
              eventMap,
              ([eventId, eventTitle]) => ({
                eventId,
                eventTitle,
              })
            );
          }
        },
        error: (err) => {
          console.error('Failed to load registrations:', err);
        },
      });
  }

  onEventSelected(event: Event): void {
    const selectedId = +(event.target as HTMLSelectElement).value;
    this.selectedEventId = selectedId || undefined;
    this.currentPage = 1;
    this.loadRegistrations(
      this.currentPage,
      this.pageSize,
      this.selectedEventId
    );
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadRegistrations(
      page,
      this.pageSize,
      this.selectedEventId ?? undefined
    );
  }

  openConfirmDialog(reg: any) {
    this.selectedRegistration = reg;
    this.showConfirmDialog = true;
  }

  confirmRegistration() {
    if (!this.selectedRegistration) return;

    const reg = this.selectedRegistration;
    const url = `/eventtregistration/sendInvite/${reg.registrationId}`;

    this.generalService.post(url, {}).subscribe({
      next: () => {
        reg.status = true;
        this.showConfirmDialog = false;
        this.selectedRegistration = null;
        Swal.fire({
          icon: 'success',
          title: 'Success!',
          text: `Registration confirmed for ${reg.fullName}.`,
          timer: 2000,
          showConfirmButton: false,
        });
      },
      error: (err) => {
        this.showConfirmDialog = false;
        this.selectedRegistration = null;
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to confirm registration. Please try again.',
        });
      },
    });
  }

  cancelConfirm() {
    this.showConfirmDialog = false;
    this.selectedRegistration = null;
  }

  // ====== CSV Export Function ======
  exportToCSV() {
    // 1. Agar event select nahi kiya
    if (!this.selectedEventId) {
      Swal.fire({
        icon: 'warning',
        title: 'No Event Selected',
        text: 'Please select an event to export.',
      });
      return;
    }

    // 2. Event ka title nikal ke console me print karo
    const selectedEvent = this.uniqueEvents.find(
      (e) => e.eventId === this.selectedEventId
    );
    console.log('Selected Event ID:', this.selectedEventId);
    console.log('Selected Event Title:', selectedEvent?.eventTitle);

    // 3. Backend se sirf selected event ka data lana
    const payload = {
      pagination: { page: 1, size: 10000 }, // Export ke liye large size
      eventId: this.selectedEventId,
    };

    this.generalService
      .post('/eventtregistration/getRegisteredUsers', payload)
      .subscribe({
        next: (response) => {
          const data = response.payload?.items || [];

          if (data.length === 0) {
            Swal.fire({
              icon: 'info',
              title: 'No Data',
              text: 'No registrations found for the selected event.',
            });
            return;
          }

          // 4. CSV banani
          const headers = [
            'Name',
            'Gender',
            'City',
            'Company',
            'Email',
            'Event',
            'Status',
          ];

          const rows = data.map((reg: any) => [
            `"${reg.fullName}"`,
            `"${reg.gender}"`,
            `"${reg.city}"`,
            `"${reg.companyName}"`,
            `"${reg.email}"`,
            `"${reg.eventTitle}"`,
            `"${reg.status ? 'Confirmed' : 'Not Confirmed'}"`,
          ]);

          const csvContent = [
            headers.join(','),
            ...rows.map((r: any) => r.join(',')),
          ].join('\n');

          // 5. Download CSV
          const blob = new Blob([csvContent], {
            type: 'text/csv;charset=utf-8;',
          });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          const fileName = selectedEvent
            ? `${selectedEvent.eventTitle.replace(
                /\s+/g,
                '_'
              )}_Registrations.csv`
            : 'Registrations.csv';
          a.setAttribute('download', fileName);
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        },
        error: (err) => {
          console.error('Failed to fetch data for export:', err);
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Failed to export registrations. Please try again later.',
          });
        },
      });
  }

  getFileName(url: string): string {
    return url?.split('/').pop() || '';
  }

  selectedReceiptLink: string | null = null;

  openReceipt(link: string) {
    this.selectedReceiptLink = link;
  }

  closeReceipt() {
    this.selectedReceiptLink = null;
  }

  downloadReceipt(event: MouseEvent) {
    event.stopPropagation();

    if (!this.selectedReceiptLink) {
      Swal.fire({
        icon: 'warning',
        title: 'No Receipt Selected',
        text: 'Please select a receipt to download.',
      });
      return;
    }

    fetch(this.selectedReceiptLink, { mode: 'cors' })
      .then((response) => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.blob();
      })
      .then((blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const fileName =
          this.selectedReceiptLink!.split('/').pop() || 'receipt';
        a.download = fileName;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);

        Swal.fire({
          icon: 'success',
          title: 'Downloaded!',
          text: 'The receipt has been downloaded successfully.',
          timer: 2000,
          showConfirmButton: false,
        });
      })
      .catch((error) => {
        console.error('Download failed:', error);
        Swal.fire({
          icon: 'error',
          title: 'Download Failed',
          text: 'Unable to download receipt. Please try again later.',
        });
      });
  }
}
