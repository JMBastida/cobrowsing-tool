import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { SUPPORT } from '../enums/api.enums';

@Injectable()
export class SupportService {
  constructor(
    private http: HttpClient,
  ) { }

  public sendMessage(body: any): Promise<any> {
    return this.http.post(SUPPORT, body).toPromise();
  }
}
