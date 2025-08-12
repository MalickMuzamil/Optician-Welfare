import { Component, Input } from '@angular/core';
import { SafeUrlPipe } from '../safe-url.pipe';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-download-recipt',
  standalone: true,
  imports: [CommonModule, SafeUrlPipe],
  templateUrl: './download-recipt.component.html',
  styleUrls: ['./download-recipt.component.css'],
})
export class DownloadReciptComponent {
  @Input() receiptFileLink!: string;
}
