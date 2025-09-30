import { Component, Inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LoginModalComponent } from "./Components/Modals/login-modal/login-modal.component";
import { SignupModalComponent } from "./Components/Modals/signup-modal/signup-modal.component";

import { SwUpdate } from '@angular/service-worker';
import { filter, interval } from 'rxjs';
import { LazyAlertService } from './shared/lazy-alert';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, LoginModalComponent, SignupModalComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'Optician';


   constructor(
    private swUpdate: SwUpdate,
    @Inject(LazyAlertService) private lazyAlert: LazyAlertService
  ) {
    if (this.swUpdate.isEnabled) {
      this.swUpdate.versionUpdates.subscribe(async (event) => {
        if (event.type === 'VERSION_READY') {
          const confirmed = await this.lazyAlert.confirm({
            title: 'Update Available',
            text: 'A new version is available. Do you want to load it?',
            confirmButtonText: 'Yes, reload',
            cancelButtonText: 'Later'
          });

          if (confirmed) {
            window.location.reload();
          }
        }
      });

      interval(3000).subscribe(() => this.swUpdate.checkForUpdate());
    }
  }
}
