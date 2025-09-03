import { InjectionToken } from '@angular/core';

export type SecureMime = 'image/jpeg'|'image/png'|'application/pdf';
export interface SecureConfig {
  accept: SecureMime[];
  maxBytes: number;
  blockInvalidSubmit: boolean;
  preventDoubleSubmitMs: number;
}

export const SECURE_CONFIG = new InjectionToken<SecureConfig>('SECURE_CONFIG', {
  factory: () => ({
    accept: ['image/jpeg','image/png','application/pdf'],
    maxBytes: 5 * 1024 * 1024,
    blockInvalidSubmit: true,
    preventDoubleSubmitMs: 1500
  })
});
