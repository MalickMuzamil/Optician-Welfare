import { Injectable, Inject } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpContextToken } from '@angular/common/http';
import { Observable } from 'rxjs';

export const WITH_CREDS = new HttpContextToken<boolean>(() => true);

@Injectable()
export class SecureInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const withCreds = req.context.get(WITH_CREDS);
    const cloned = req.clone({
      withCredentials: withCreds,
      setHeaders: {
        'X-Requested-With': 'XMLHttpRequest',
        'Accept': req.headers.get('Accept') || 'application/json'
      }
    });
    return next.handle(cloned);
  }
}
    