import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { Subject } from 'rxjs';
import { map } from 'rxjs/operators';

import { buildQuery } from '../helpers/query.helper';

import { USER, USERS } from '../enums/api.enums';

@Injectable()
export class UsersService {
  user: any;
  isEditing: boolean = false;
  userSubject: Subject<any>;

  constructor(
    private http: HttpClient,
  ) {
    this.userSubject = new Subject();
    this.userSubject.subscribe(newUser => this.user = newUser);
  }

  public async getSelf(): Promise<any> {
    if (this.user) return this.user;
    return this.http.get(USER).pipe(
      map((response: any) => response.user),
    ).toPromise();
  }

  public async getUsers(filter: any): Promise<any> {
    const url = `${USERS}?${buildQuery(filter)}`;
    return this.http.get(url).toPromise();
  }

  public async createUser(body: any): Promise<any> {
    return this.http.post(USERS, body).toPromise();
  }

  public async updateUser(body: any): Promise<any> {
    return this.http.patch(USERS, body).pipe(
      map((response: any) => response.user),
    ).toPromise();
  }

  public async updateSelf(body: any): Promise<any> {
    return this.http.patch(USER, body).toPromise();
  }
}
