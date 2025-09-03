import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GeneralService } from '../../shared/general.service';
import { SidebarComponent } from '../../Components/sidebar/sidebar.component';
import { PaginationComponent } from '../../Components/pagination/pagination.component';
import { FormsModule } from '@angular/forms';
import { DownloadReciptComponent } from '../download-recipt/download-recipt.component';

import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { LazyAlertService } from '../../shared/lazy-alert';

@Component({
  selector: 'app-admin-page',
  standalone: true,
  imports: [
    CommonModule,
    SidebarComponent,
    PaginationComponent,
    FormsModule,
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

  selectedRegistration: any = null;
  selectedReceiptLink: string | null = null;

  constructor(
    private generalService: GeneralService,
    private alerts: LazyAlertService
  ) { }

  ngOnInit(): void {
    this.loadRegistrations(this.currentPage, this.pageSize);
    this.loadEvents(1, 100);
  }

  private sortByStatus(data: any[]): any[] {
    return data.sort((a, b) => {
      if (a.status && !b.status) return -1;
      if (!a.status && b.status) return 1;
      return 0;
    });
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
          let data = response.payload?.items || [];
          this.registrations = this.sortByStatus(data);

          this.totalPages = response.payload?.totalPages || 1;
          this.currentPage = page;

          if (!eventId) {
            this.allRegistrations = data;

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

  loadEvents(page: number, size: number) {
    const payload: any = { page, size };

    this.generalService.post('/events/getLatestEvents', payload).subscribe({
      next: (response: any) => {
        const events = response.payload?.items || [];
        this.uniqueEvents = events.map((e: any) => ({
          eventId: e.eventId,
          eventTitle: e.title,
        }));

        console.log('Events loaded:', this.uniqueEvents);
      },
      error: (err: any) => {
        console.error('Error loading events:', err);
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

  async openConfirmDialog(reg: any) {
    const confirmed = await this.alerts.confirm({
      title: 'Confirm Registration',
      text: `Do you want to confirm registration for ${reg.fullName}?`,
      confirmButtonText: 'Yes, Confirm',
      cancelButtonText: 'Cancel',
    });

    if (confirmed) {
      this.confirmRegistration(reg);
    }
  }

  private confirmRegistration(reg: any) {
    const url = `/eventtregistration/sendInvite/${reg.registrationId}`;

    this.generalService.post(url, {}).subscribe({
      next: async () => {
        reg.status = true;
        await this.alerts.fire({
          icon: 'success',
          title: 'Success!',
          text: `Registration confirmed for ${reg.fullName}.`,
          timer: 2000,
          showConfirmButton: false,
        });

        this.registrations = this.sortByStatus(this.registrations);
      },
      error: async () => {
        await this.alerts.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to confirm registration. Please try again.',
        });
      },
    });
  }

  // ====== CSV Export Function (Only Confirmed) ======
  exportToExcel() {
    if (!this.selectedEventId) {
      this.alerts.fire({
        icon: 'warning',
        title: 'No Event Selected',
        text: 'Please select an event to export.',
      });
      return;
    }

    const selectedEvent = this.uniqueEvents.find(
      (e) => e.eventId === this.selectedEventId
    );

    const payload = {
      pagination: { page: 1, size: 10000 },
      eventId: this.selectedEventId,
    };

    this.generalService
      .post('/eventtregistration/getRegisteredUsers', payload)
      .subscribe({
        next: async (response) => {
          const data = response.payload?.items || [];

          if (data.length === 0) {
            await this.alerts.fire({
              icon: 'info',
              title: 'No Data',
              text: 'No registrations found for the selected event.',
            });
            return;
          }

          const excelData = data.map((reg: any, index: number) => ({
            Name: reg.fullName ?? `N/A (${index + 1})`,
            Gender: reg.gender ?? 'N/A',
            City: reg.city ?? 'N/A',
            Company: reg.companyName ?? 'N/A',
            Email: reg.email ?? 'N/A',
            Phone: reg.phoneNo ?? 'N/A',
            Event: reg.eventTitle ?? selectedEvent?.eventTitle ?? 'N/A',
            Status: 'Confirmed',
          }));

          const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(excelData);
          const workbook: XLSX.WorkBook = {
            Sheets: { Registrations: worksheet },
            SheetNames: ['Registrations'],
          };

          const excelBuffer: any = XLSX.write(workbook, {
            bookType: 'xlsx',
            type: 'array',
          });

          const blob = new Blob([excelBuffer], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          });

          const fileName = selectedEvent
            ? `${selectedEvent.eventTitle.replace(
              /\s+/g,
              '_'
            )}_Registrations.xlsx`
            : 'Registrations.xlsx';

          saveAs(blob, fileName);

          await this.alerts.fire({
            icon: 'success',
            title: 'Export Complete',
            text: `${excelData.length} records exported successfully.`,
            timer: 2000,
            showConfirmButton: false,
          });
        },
        error: async () => {
          await this.alerts.fire({
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

  openReceipt(link: string) {
    this.selectedReceiptLink = link;
  }

  closeReceipt() {
    this.selectedReceiptLink = null;
  }

  async downloadReceipt(event: MouseEvent) {
    event.stopPropagation();

    if (!this.selectedReceiptLink) {
      await this.alerts.fire({
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
      .then(async (blob) => {
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

        await this.alerts.fire({
          icon: 'success',
          title: 'Downloaded!',
          text: 'The receipt has been downloaded successfully.',
          timer: 2000,
          showConfirmButton: false,
        });
      })
      .catch(async (error) => {
        console.error('Download failed:', error);
        await this.alerts.fire({
          icon: 'error',
          title: 'Download Failed',
          text: 'Unable to download receipt. Please try again later.',
        });
      });
  }
}
