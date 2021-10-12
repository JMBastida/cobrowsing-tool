import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, NavigationStart, Router } from '@angular/router';

import { Socket } from 'ngx-socket-io';
import { PrimeNGConfig } from 'primeng/api';

import { AuthService } from './modules/shared/services/auth.service';
import { UsersService } from './modules/shared/services/user.service';

import Cookies from './modules/shared/helpers/cookies.helper';

import { USER_ORIGIN } from './modules/shared/enums/user.enums';
import { TKN_KEY } from './modules/shared/enums/cookies.enums';
import { PUBLIC_ROUTES, ROUTES } from './modules/shared/enums/views.enums';

@Component({
  selector: 'shr-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  constructor(
    private router: Router,
    private socket: Socket,
    private authService: AuthService,
    private usersService: UsersService,
    private primengConfig: PrimeNGConfig,
    private activatedroute: ActivatedRoute,
  ) { }

  async ngOnInit() {
    this.primengConfig.ripple = true;
    const { ref } = this.activatedroute.snapshot.queryParams;
    if (ref === 'home_login') this.authService.origin = USER_ORIGIN.WP_HOME;
    this.router.events.subscribe(async (event) => {
      if (event instanceof NavigationStart) {
        const url = event.url.substr(1);
        const token = Cookies.get(TKN_KEY);
        if (token) {
          const isValid = await this.checkLoggedUser(token);
          if (isValid) this.tokenLogin(url);
          else this.goToLogin();
        } else if (!PUBLIC_ROUTES.includes(url)) this.goToLogin();
      }
    });
  }

  async checkLoggedUser(token: string) {
    if (this.socket.ioSocket.connected) return true;
    const isValid = await this.authService.checkValidLogin(token);
    return isValid;
  }

  async tokenLogin(url: string) {
    if (!this.usersService.user) await this.authService.tokenLogin();
    if ([ROUTES.LOGIN, ROUTES.SIGNUP].includes(url)) {
      this.router.navigate([`${ROUTES.DASHBOARD}`]);
    }
  }

  goToLogin() {
    this.router.navigate([ROUTES.LOGIN]);
  }
}
