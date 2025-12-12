import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ConfigService {
  private http = inject(HttpClient);
  private baseUrl = '/api'; // Assuming a proxy is set up for /api

  getEntityConfig(): Observable<any> {
    return this.http.get(`${this.baseUrl}/config`);
  }

  changeWidgetAvailability(available: boolean): Observable<any> {
    return this.http.patch(`${this.baseUrl}/config/widget`, { available });
  }

  updateEntityConfig(config: any): Observable<any> {
    return this.http.patch(`${this.baseUrl}/config`, config);
  }
}
