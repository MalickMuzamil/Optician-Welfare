import { Component } from '@angular/core';
import { NavbarComponent } from '../../Components/navbar/navbar.component';
import { HeroComponent } from '../../Components/hero/hero.component';
import { AboutComponent } from '../../Components/about/about.component';
import { LoginModalComponent } from "../../Components/Modals/login-modal/login-modal.component";
import { FooterComponent } from '../../Components/footer/footer.component';
import { SignupModalComponent } from "../../Components/Modals/signup-modal/signup-modal.component";

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [NavbarComponent, HeroComponent, AboutComponent, FooterComponent, SignupModalComponent],
  templateUrl: './home-page.component.html',
  styleUrl: './home-page.component.css'
})
export class HomePageComponent {

}
