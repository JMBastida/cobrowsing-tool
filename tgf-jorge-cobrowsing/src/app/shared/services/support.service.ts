import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SupportService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.BASE_API_URL}/api`;

  supportRequest(request: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/support`, request);
  }
}
