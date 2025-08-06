import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { GeneralService } from '../../shared/general.service';
import { DailogBoxComponent } from '../dailog-box/dailog-box.component';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterModule, DailogBoxComponent],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css',
})
export class SidebarComponent implements OnInit {
  adminEmail: string = '';
  showLogoutModal = false;

  constructor(private generalService: GeneralService) {}

  ngOnInit(): void {
    const adminData = JSON.parse(localStorage.getItem('adminData') || '{}');
    this.adminEmail = adminData.email || '';
  }

  openLogoutModal() {
    this.showLogoutModal = true;
  }

  handleLogoutConfirm() {
    this.showLogoutModal = false;
    this.logout();
  }

  handleLogoutCancel() {
    this.showLogoutModal = false;
  }

  logout() {
    this.generalService.logout();
  }
}
