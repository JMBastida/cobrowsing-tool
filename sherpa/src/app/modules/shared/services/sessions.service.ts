import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { SESSIONS } from '../enums/api.enums';

import { buildQuery } from '../helpers/query.helper';

@Injectable()
export class SessionsService {
  constructor(
    private http: HttpClient,
  ) { }

  public createSession(testId: any): Promise<any> {
    return this.http.post(SESSIONS, { testId }).toPromise();
  }

  public getSessions(filter: any): Promise<any> {
    const url = `${SESSIONS}?${buildQuery(filter)}`;
    return this.http.get(url).toPromise();
  }

  public updateSession(body: any): Promise<any> {
    return this.http.patch(SESSIONS, body).toPromise();
  }
}
