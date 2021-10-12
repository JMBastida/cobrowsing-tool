import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Router } from '@angular/router';

import { UsersService } from '../modules/shared/services/user.service';
import { EntitiesService } from '../modules/shared/services/entities.service';

import Cookie from '../modules/shared/helpers/cookies.helper';

import { ROUTES } from '../modules/shared/enums/views.enums';
import { TKN_KEY } from '../modules/shared/enums/cookies.enums';
import { LOGIN, SIGNUP } from '../modules/shared/enums/api.enums';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(
    private router: Router,
    private usersService: UsersService,
    private entitiesService: EntitiesService,
  ) { }

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    let token = Cookie.get(TKN_KEY);
    if (!token && (!request.url.includes(LOGIN) && !request.url.includes(SIGNUP))) {
      this.router.navigate([ROUTES.LOGIN]);
      throw new Error('Permission denied');
    }

    request = request.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    return next.handle(request).pipe(
      tap((response: any) => {
        if (response && response.body) {
          const { user, entity } = response.body;
          if (entity) this.entitiesService.entitySubject.next(entity);
          if (user) {
            this.usersService.userSubject.next(user);
            Cookie.remove(TKN_KEY);
            Cookie.set(TKN_KEY, user.token, { expires: 365 });
          }
        }
      })
    );
  }
}
