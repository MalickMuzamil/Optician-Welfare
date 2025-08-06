import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment.development';
import { Router } from '@angular/router';

const apiUrl = environment.apiUrl;

@Injectable({
  providedIn: 'root',
})
export class GeneralService {
  constructor(private http: HttpClient, private router: Router) {}

  get(endpoint: string, params?: any): Observable<any> {
    return this.http.get(apiUrl + endpoint, { params });
  }

  patch(endpoint: string, body: any): Observable<any> {
    return this.http.patch(apiUrl + endpoint, body);
  }

  delete(endpoint: string, params?: any): Observable<any> {
    return this.http.delete(apiUrl + endpoint, { params });
  }

  post(endpoint: string, body: any): Observable<any> {
    return this.http.post(apiUrl + endpoint, body);
  }

  logout() {
    localStorage.clear();
    this.router.navigate(['']);
  }
}
