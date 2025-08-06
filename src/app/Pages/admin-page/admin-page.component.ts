import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GeneralService } from '../../shared/general.service';
import { SidebarComponent } from '../../Components/sidebar/sidebar.component';
import { PaginationComponent } from '../../Components/pagination/pagination.component';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { DailogBoxComponent } from '../../Components/dailog-box/dailog-box.component'; // add dialog box import

@Component({
  selector: 'app-admin-page',
  standalone: true,
  imports: [
    CommonModule,
    SidebarComponent,
    PaginationComponent,
    FormsModule,
    DailogBoxComponent,
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
    if (!this.registrations || this.registrations.length === 0) {
      Swal.fire('No data to export');
      return;
    }

    const headers = ['Name', 'Gender', 'City', 'Company', 'Event', 'Status'];

    const rows = this.registrations.map((reg) => [
      `"${reg.fullName}"`,
      `"${reg.gender}"`,
      `"${reg.city}"`,
      `"${reg.companyName}"`,
      `"${reg.eventTitle}"`,
      `"${reg.status ? 'Confirmed' : 'Not Confirmed'}"`,
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((r) => r.join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.setAttribute('download', 'Opticians-Registration.csv');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  getFileName(url: string): string {
    return url?.split('/').pop() || '';
  }
}
