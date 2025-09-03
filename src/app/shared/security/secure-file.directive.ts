import { Directive, ElementRef, HostBinding, HostListener, Inject, Input } from '@angular/core';
import { SECURE_CONFIG, SecureConfig, SecureMime } from './secure-config';

export interface SecureFileOptions {
  accept?: SecureMime[];
  maxBytes?: number;
}

@Directive({
  selector: 'input[type=file]'
})
export class SecureFileDirective {
  @Input('secureFile') opts?: SecureFileOptions;
  @HostBinding('attr.accept') get acceptAttr() {
    const a = (this.opts?.accept || this.cfg.accept).join(',');
    return a;
  }
  constructor(@Inject(SECURE_CONFIG) private cfg: SecureConfig, private el: ElementRef<HTMLInputElement>) {}
  @HostListener('change', ['$event'])
  onChange() {
    const input = this.el.nativeElement;
    const file = input.files && input.files[0];
    input.setCustomValidity('');
    if (!file) return;
    const allowed = new Set((this.opts?.accept || this.cfg.accept));
    if (!allowed.has(file.type as SecureMime)) {
      input.value = '';
      input.setCustomValidity('Unsupported file type');
      input.reportValidity();
      return;
    }
    const max = this.opts?.maxBytes ?? this.cfg.maxBytes;
    if (file.size > max) {
      input.value = '';
      input.setCustomValidity('File too large');
      input.reportValidity();
      return;
    }
  }
}
