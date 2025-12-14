import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class UsersService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private baseUrl = `${environment.BASE_API_URL}/api`;

  // Get the user signal directly from the AuthService
  user = this.authService.user;

  constructor() {
    // No longer needs to fetch the user on startup
  }

  getUsers(): Observable<any> {
    return this.http.get(`${this.baseUrl}/users`);
  }

  createUser(user: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/users`, user);
  }

  updateSelfUser(user: any): Observable<any> {
    return this.http.patch(`${this.baseUrl}/users/self`, user);
  }

  updateUser(user: any): Observable<any> {
    return this.http.patch(`${this.baseUrl}/users`, user);
  }
}
