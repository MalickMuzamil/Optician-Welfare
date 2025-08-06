import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LoginModalComponent } from "./Components/Modals/login-modal/login-modal.component";
import { SignupModalComponent } from "./Components/Modals/signup-modal/signup-modal.component";

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, LoginModalComponent, SignupModalComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'Optician';
}
