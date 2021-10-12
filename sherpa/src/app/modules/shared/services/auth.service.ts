import { Router } from '@angular/router';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { Socket } from 'ngx-socket-io';
import { tap, map } from 'rxjs/operators';

import { UsersService } from './user.service';
import { EntitiesService } from './entities.service';

import Cookie from '../helpers/cookies.helper';

import { ROUTES } from '../enums/views.enums';
import { TKN_KEY } from '../enums/cookies.enums';
import { USER_ORIGIN } from '../enums/user.enums';
import { LOGIN, USER, SIGNUP } from '../enums/api.enums';

import { environment } from '../../../../environments/environment';

@Injectable()
export class AuthService {
  origin: string = USER_ORIGIN.APP;

  constructor(
    private socket: Socket,
    private router: Router,
    private http: HttpClient,
    private usersService: UsersService,
    private entitiesService: EntitiesService,
  ) { }

  public async signup(user: any): Promise<any> {
    const userParsed = { ...user, origin };
    return this.http.post(SIGNUP, userParsed).pipe(
      tap(response => { this.initialize(); })
    ).toPromise();
  }

  public async login(user: any): Promise<any> {
    return this.http.post(LOGIN, user).pipe(
      tap(response => { this.initialize(); })
    ).toPromise();
  }

  public async checkValidLogin(token: string) {
    const url = `${LOGIN}/${token}`;
    return this.http.get(url).pipe(
      map((response: any) => response.isValid)
    ).toPromise();
  }

  public async tokenLogin(): Promise<any> {
    return this.http.get(USER).pipe(
      tap(response => { this.initialize(); })
    ).toPromise();
  }

  public logout() {
    this.usersService.userSubject.next(null);
    this.entitiesService.entitySubject.next(null);
    Cookie.remove(TKN_KEY);
    this.socket.removeAllListeners();
    this.socket.disconnect();
    this.router.navigate([ROUTES.LOGIN]).then(() => {
      window.location.reload();
    });
  }

  initializeSocket(user: any) {
    if (!user || !user.entityId) return;
    this.socket.ioSocket.io.opts.query = {
      isAgent: true,
      entityId: user.entityId,
      userId: user._id,
      forceConnection: true,
      appId: environment.COBROWSING_APP_ID,
    };
    this.socket.connect();
  }

  initialize() {
    const user = this.usersService.user;
    const entity = this.entitiesService.entity;
    if (!user) return;
    this.initializeSocket(user);
    if (!entity) return;
    this.initializePendo(entity, user, 0);
    this.initializeSideby(entity, user, 0);
    this.initializeFroged(entity, user, 0);
  }

  initializeSideby(entity: any, user: any, n: number) {
    n += 1;
    if (n > 5) return;
    try {
      const sideby = eval('window.sideby');
      if (!sideby) {
        setTimeout(() => this.initializeSideby(entity, user, n), 3000);
        return;
      }

      const data = {
        id: user._id,
        role: user.role,
        email: user.email,
        phone: user.phone,
        language: user.language || navigator.language,
        isPaying: entity.isPaying || '',
        planLevel: entity.planLevel || '',
        creationDate: entity.creationDate || '',
        fullName: `${user.name ? user.name : ''} ${user.lastName ? user.lastName : ''}`,
      };
      sideby.setUserData(data);
    } catch (error) {
      setTimeout(() => this.initializeSideby(entity, user, n), 3000);
    }
  }

  initializePendo(entity: any, user: any, n: number) {
    n += 1;
    if (n > 5) return;
    if (!environment.production) return;
    try {
      const pendo = eval('window.pendo');
      if (!pendo) {
        setTimeout(() => this.initializePendo(entity, user, n), 3000);
        return;
      }

      const data = {
        visitor: {
          id: user._id,
          role: user.role,
          email: user.email,
          full_name: `${user.name ? user.name : ''} ${user.lastName ? user.lastName : ''}`,
          language: user.language || navigator.language,
        },
        account: {
          id: user.entityId,
          name: entity.companyName || '',
          email: entity.companyEmail || '',
          creationDate: entity.creationDate || '',
          is_paying: entity.is_paying || '',
          planLevel: entity.planLevel || '',
          planPrice: entity.planPrice || '',
          monthly_value: entity.monthly_value || '',
        }
      };
      pendo.initialize(data);
    } catch (error) {
      setTimeout(() => this.initializePendo(entity, user, n), 3000);
    }
  }

  initializeFroged(entity: any, user: any, n: number) {
    n += 1;
    if (n > 5) return;
    try {
      const Froged = eval('window.Froged');
      if (!Froged) {
        setTimeout(() => this.initializeFroged(entity, user, n), 3000);
        return;
      }

      const data = {
        userId: user._id,
        email: user.email,
        username: `${user.name ? user.name : ''} ${user.lastName ? user.lastName : ''}`,
        name: `${user.name ? user.name : ''} ${user.lastName ? user.lastName : ''}`,
        firstname: user.name,
        lastname: user.lastName || '',
        phone: user.phone,
        web: entity.companySite,
        company: entity.companyName,
      };
      Froged('set', data);
      const elements = document.getElementsByClassName('routing-content');
      const [element] = Array.from(elements);
      if (!element) return;
      element.classList.add('froged-space');
    } catch (error) {
      setTimeout(() => this.initializeFroged(entity, user, n), 3000);
    }
  }

}
