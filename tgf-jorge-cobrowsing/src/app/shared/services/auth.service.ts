import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import Cookie from 'js-cookie';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.BASE_API_URL}/api/auth`;
  
  user = signal<any>(null);

  login(email: string, password: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/login`, { email, password }).pipe(
      tap((response: any) => {
        if (response && response.user && response.user.token) {
          Cookie.set('token', response.user.token, { expires: 7, secure: true });
          this.user.set(response.user);
        }
      })
    );
  }

  logout() {
    Cookie.remove('token');
    this.user.set(null);
  }

  getToken(): string | undefined {
    return Cookie.get('token');
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }
}
