import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FontsService {
  private http = inject(HttpClient);
  private baseUrl = '/api'; // Assuming a proxy is set up for /api

  handleFonts(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/fonts`, data);
  }
}
