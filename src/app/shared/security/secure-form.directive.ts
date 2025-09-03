import { Directive, HostListener, Inject, Optional } from '@angular/core';
import { NgForm, FormGroupDirective } from '@angular/forms';
import { SECURE_CONFIG, SecureConfig } from './secure-config';

@Directive({
  selector: 'form[formGroup], form[ngForm], form'
})
export class SecureFormDirective {
  private lastSubmit = 0;
  constructor(
    @Optional() private ngForm: NgForm,
    @Optional() private formGroupDir: FormGroupDirective,
    @Inject(SECURE_CONFIG) private cfg: SecureConfig
  ) {}
  @HostListener('submit', ['$event'])
  onSubmit(e: Event) {
    const now = Date.now();
    if (now - this.lastSubmit < this.cfg.preventDoubleSubmitMs) {
      e.stopImmediatePropagation();
      e.preventDefault();
      return;
    }
    this.lastSubmit = now;
    if (!this.cfg.blockInvalidSubmit) return;
    const group = this.formGroupDir?.control || this.ngForm?.form;
    if (!group) return;
    if (group.invalid) {
      group.markAllAsTouched();
      e.stopImmediatePropagation();
      e.preventDefault();
    }
  }
}
