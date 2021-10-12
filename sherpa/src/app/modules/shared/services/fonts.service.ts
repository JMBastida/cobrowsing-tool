import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { FONTS } from '../enums/api.enums';

@Injectable()
export class FontsService {
  constructor(
    private http: HttpClient,
  ) { }

  public handleFonts(body: any): Promise<any> {
    return this.http.post(FONTS, body).toPromise();
  }
}
