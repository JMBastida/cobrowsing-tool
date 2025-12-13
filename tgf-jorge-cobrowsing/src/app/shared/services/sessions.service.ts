import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SessionsService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.BASE_API_URL}/api`;

  getSessions(): Observable<any> {
    return this.http.get(`${this.baseUrl}/sessions`);
  }

  updateSession(session: any): Observable<any> {
    return this.http.patch(`${this.baseUrl}/sessions`, session);
  }
}
