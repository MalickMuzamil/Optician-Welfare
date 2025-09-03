import { Component } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [CommonModule, NgOptimizedImage],
  templateUrl: './hero.component.html',
  styleUrls: ['./hero.component.css']  
})
export class HeroComponent {
   slides = [
    {
      src: 'assets/Carousal/Main-Images/Image1.avif',
      width: 1920,   // intrinsic dimensions of your PNG
      height: 1080,
      alt: 'Image 1'
    },
    {
      src: 'assets/Carousal/Main-Images/Image2.avif',
      width: 1920,
      height: 1080,
      alt: 'Image 2'
    },
    {
      src: 'assets/Carousal/Main-Images/Image3.avif',
      width: 1920,
      height: 1080,
      alt: 'Image 3'
    }
  ];
}
