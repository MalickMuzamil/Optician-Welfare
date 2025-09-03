import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Router } from '@angular/router';

const apiUrl = environment.apiUrl;

type HttpOptions = {
  headers?: HttpHeaders | { [header: string]: string | string[] };
  params?: HttpParams | { [param: string]: string | number | boolean | ReadonlyArray<string | number | boolean> };
  withCredentials?: boolean;
};

@Injectable({ providedIn: 'root' })
export class GeneralService {
  constructor(private http: HttpClient, private router: Router) {}

  private buildUrl(endpoint: string): string {
    return /^https?:\/\//i.test(endpoint) ? endpoint : apiUrl + endpoint;
  }

  get<T = any>(endpoint: string, params?: HttpOptions['params'], options?: Omit<HttpOptions, 'params'>): Observable<T> {
    return this.http.get<T>(this.buildUrl(endpoint), { params, ...(options ?? {}) });
  }

  post<T = any>(endpoint: string, body?: unknown, options?: HttpOptions): Observable<T> {
    return this.http.post<T>(this.buildUrl(endpoint), body, options);
  }

  patch<T = any>(endpoint: string, body?: unknown, options?: HttpOptions): Observable<T> {
    return this.http.patch<T>(this.buildUrl(endpoint), body, options);
  }

  delete<T = any>(endpoint: string, params?: HttpOptions['params'], options?: Omit<HttpOptions, 'params'>): Observable<T> {
    return this.http.delete<T>(this.buildUrl(endpoint), { params, ...(options ?? {}) });
  }

  logout(): void {
    localStorage.clear();
    this.router.navigate(['']);
  }
}
