import { ModuleWithProviders, NgModule } from '@angular/core';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { SecureFormDirective } from './secure-form.directive';
import { SecureInterceptor } from './secure.interceptor';
import { SECURE_CONFIG, SecureConfig } from './secure-config';
import { AutoFileValidateDirective } from './auto-file-validate.directive';

@NgModule({
  declarations: [SecureFormDirective, AutoFileValidateDirective],
  exports: [SecureFormDirective, AutoFileValidateDirective]
})
export class SecureModule {
  static forRoot(cfg?: Partial<SecureConfig>): ModuleWithProviders<SecureModule> {
    return {
      ngModule: SecureModule,
      providers: [
        { provide: SECURE_CONFIG, useValue: { accept: ['image/jpeg','image/png','application/pdf'], maxBytes: 5*1024*1024, blockInvalidSubmit: true, preventDoubleSubmitMs: 1500, ...cfg } },
        { provide: HTTP_INTERCEPTORS, useClass: SecureInterceptor, multi: true }
      ]
    };
  }
}
