import { Component } from '@angular/core';
import { NavbarComponent } from '../../Components/navbar/navbar.component';
import { FooterComponent } from '../../Components/footer/footer.component';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-gallery',
  standalone: true,
  imports: [NavbarComponent, FooterComponent, CommonModule, RouterLink],
  templateUrl: './gallery.component.html',
  styleUrl: './gallery.component.css'
})
export class GalleryComponent {
  images: string[] = [
    'assets/Carousal/Gallery/Image1.jpeg',
    'assets/Carousal/Gallery/Image2.jpeg',
    'assets/Carousal/Gallery/Image3.jpeg',
    'assets/Carousal/Gallery/Image4.jpeg',
    'assets/Carousal/Gallery/Image5.jpeg',
    'assets/Carousal/Gallery/Image6.jpeg',
    'assets/Carousal/Gallery/Image7.jpeg',
    'assets/Carousal/Gallery/Image8.jpeg',
    'assets/Carousal/Gallery/Image9.jpeg',
  ];

}
