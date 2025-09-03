import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { GeneralService } from '../../shared/general.service';
import { LazyAlertService } from '../../shared/lazy-alert';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css',
})
export class SidebarComponent implements OnInit {
  adminEmail: string = '';
  showLogoutModal = false;

  constructor(private generalService: GeneralService, private router: Router,
    private alerts: LazyAlertService) { }

  ngOnInit(): void {
    const adminData = JSON.parse(localStorage.getItem('adminData') || '{}');
    this.adminEmail = adminData.email || '';
  }

  async openLogoutModal() {
    const confirmed = await this.alerts.confirm({
      title: 'Logout Confirmation',
      text: 'Are you sure you want to logout?',
      confirmButtonText: 'Yes, Logout',
      cancelButtonText: 'Cancel',
    });

    if (confirmed) {
      this.logout();
      this.router.navigate(['/']);
    }
  }

  logout() {
    this.generalService.logout();
  }
}
