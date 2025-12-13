import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class FilesService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.BASE_API_URL}/api`;

  uploadFile(code: string, file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post(`${this.baseUrl}/files/upload/${code}`, formData);
  }
}
