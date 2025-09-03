import { Directive, ElementRef, HostBinding, HostListener, Inject, Input } from '@angular/core';
import { InjectionToken } from '@angular/core';

export type AllowedKind = 'jpg' | 'png' | 'gif' | 'webp' | 'pdf';
export interface AutoFileConfig { kinds: AllowedKind[]; maxBytes?: number }
export const AUTO_FILE_CONFIG = new InjectionToken<AutoFileConfig>('AUTO_FILE_CONFIG', { factory: () => ({ kinds: ['jpg', 'png', 'pdf'], maxBytes: 5 * 1024 * 1024 }) });

@Directive({ selector: 'input[type=file]' })
export class AutoFileValidateDirective {
  @Input('autoFileKinds') kinds?: AllowedKind[];
  @Input('autoFileMaxBytes') maxBytes?: number;
  @HostBinding('attr.accept') get accept() {
    const map: Record<AllowedKind, string[]> = { jpg: ['.jpg', '.jpeg'], 'png': ['.png'], 'gif': ['.gif'], 'webp': ['.webp'], 'pdf': ['.pdf'] };
    const list = (this.kinds || this.cfg.kinds).flatMap(k => map[k]);
    return list.join(',');
  }
  constructor(private el: ElementRef<HTMLInputElement>, @Inject(AUTO_FILE_CONFIG) private cfg: AutoFileConfig) { }

  @HostListener('change')
  async onChange() {
    const input = this.el.nativeElement;
    const file = input.files && input.files[0];
    input.setCustomValidity('');
    if (!file) return;
    const max = this.maxBytes ?? this.cfg.maxBytes ?? Infinity;
    if (file.size > max) { this.fail('File too large'); return; }
    const ok = await this.validateMagic(file, this.kinds || this.cfg.kinds);
    if (!ok) { this.fail('Unsupported file type'); return; }
  }

  private fail(msg: string) {
    const input = this.el.nativeElement;
    input.value = '';
    input.setCustomValidity(msg);
    input.reportValidity();
  }

  private async validateMagic(file: File, kinds: AllowedKind[]): Promise<boolean> {
    const head = new Uint8Array(await this.readBytes(file, 0, 16));
    const tail = new Uint8Array(await this.readBytes(file, file.size - 2, file.size));
    const has = (sig: number[], buf: Uint8Array) => sig.every((b, i) => buf[i] === b);
    const any = (arr: boolean[]) => arr.some(Boolean);
    const tests: Partial<Record<AllowedKind, boolean>> = {};
    tests.jpg = has([0xFF, 0xD8, 0xFF], head) && tail.length >= 2 && tail[0] === 0xFF && tail[1] === 0xD9;
    tests.png = has([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A], head);
    tests.gif = has([0x47, 0x49, 0x46, 0x38, 0x39, 0x61], head) || has([0x47, 0x49, 0x46, 0x38, 0x37, 0x61], head);
    tests.webp = has([0x52, 0x49, 0x50, 0x50], head) && head[8] === 0x57 && head[9] === 0x45 && head[10] === 0x42 && head[11] === 0x50;
    tests.pdf = has([0x25, 0x50, 0x44, 0x46, 0x2D], head);
    return any(kinds.map(k => !!tests[k]));
  }

  private readBytes(file: File, start: number, end: number): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result as ArrayBuffer);
      r.onerror = () => reject(r.error);
      r.readAsArrayBuffer(file.slice(Math.max(0, start), Math.max(0, end)));
    });
  }
}
