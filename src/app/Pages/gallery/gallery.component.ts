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
  styleUrl: './gallery.component.css',
})
export class GalleryComponent {
  images: string[] = [
    'assets/Carousal/Gallery/Image1.avif',
    'assets/Carousal/Gallery/Image2.avif',
    'assets/Carousal/Gallery/Image3.avif',
    'assets/Carousal/Gallery/Image10.avif',
    'assets/Carousal/Gallery/Image4.avif',
    'assets/Carousal/Gallery/Image5.avif',
    'assets/Carousal/Gallery/Image6.avif',
    'assets/Carousal/Gallery/Image7.avif',
    'assets/Carousal/Gallery/Image11.avif',
    'assets/Carousal/Gallery/Image8.avif',
    'assets/Carousal/Gallery/Image9.avif',
  ];
}
