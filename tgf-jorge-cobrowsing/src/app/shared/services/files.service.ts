import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FilesService {
  private http = inject(HttpClient);
  private baseUrl = '/api'; // Assuming a proxy is set up for /api

  uploadFile(code: string, file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post(`${this.baseUrl}/files/upload/${code}`, formData);
  }
}
