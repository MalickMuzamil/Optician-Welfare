import { Injectable } from '@angular/core';
import type { SweetAlertOptions, SweetAlertResult } from 'sweetalert2';

@Injectable({ providedIn: 'root' })
export class LazyAlertService {
  async fire(options: SweetAlertOptions): Promise<SweetAlertResult<any>> {
    const Swal = (await import('sweetalert2')).default;
    return Swal.fire(options);
  }

  async confirm(options: SweetAlertOptions) {
    const Swal = (await import('sweetalert2')).default;
    const result = await Swal.fire({
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'OK',
      cancelButtonText: 'Cancel',
      ...options
    });
    return result.isConfirmed;
  }
}
