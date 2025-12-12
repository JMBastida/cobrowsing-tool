import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { USER_ROLES } from '../enums/user.enums';

@Injectable({
  providedIn: 'root',
})
export class UsersService {
  private http = inject(HttpClient);
  private baseUrl = '/api'; // Assuming a proxy is set up for /api

  user = signal<any>(null);

  constructor() {
    this.getSelfUser().subscribe();
  }

  getSelfUser(): Observable<any> {
    return this.http.get(`${this.baseUrl}/users/self`).pipe(
      tap(user => this.user.set(user))
    );
  }

  getUsers(): Observable<any> {
    return this.http.get(`${this.baseUrl}/users`);
  }

  createUser(user: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/users`, user);
  }

  updateSelfUser(user: any): Observable<any> {
    return this.http.patch(`${this.baseUrl}/users/self`, user).pipe(
      tap(updatedUser => this.user.set(updatedUser))
    );
  }

  updateUser(user: any): Observable<any> {
    return this.http.patch(`${this.baseUrl}/users`, user);
  }
}
