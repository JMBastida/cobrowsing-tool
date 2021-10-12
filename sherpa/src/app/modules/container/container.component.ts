import { Component, NgZone, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';

import { Subscription } from 'rxjs';
import { Socket } from 'ngx-socket-io';
import { ConfirmationService, MessageService } from 'primeng/api';

import { AuthService } from '../shared/services/auth.service';
import { UsersService } from '../shared/services/user.service';
import { EntitiesService } from '../shared/services/entities.service';
import { LanguageService } from '../shared/services/language.service';

import { LiteralPipe } from '../shared/pipes/literal.pipe';

import { copyToClippboard } from '../shared/helpers/global.helpers';

import { ROUTES } from '../shared/enums/views.enums';
import { USER_ROLES } from '../shared/enums/user.enums';
import { STATE_KEY } from '../shared/enums/cookies.enums';
import { LANGUAGES } from '../shared/enums/language.enums';

@Component({
  selector: 'shr-container',
  templateUrl: './container.component.html',
  styleUrls: ['./container.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class ContainerComponent implements OnInit, OnDestroy {
  user: any;
  entity: any;
  menuOptions: any[] = [];
  showMenu: boolean = false;
  selected: any;
  isOnSession: boolean = false;
  sessionId: string = '';
  lan: string = '';
  languages = LANGUAGES;
  showDeviceDialog: boolean = false;
  smartLink: string = '';
  isAdmin: boolean = false;
  showPendoOption: boolean = false;
  userSubscription: Subscription = new Subscription;
  entitySubscription: Subscription = new Subscription;
  languageSubscription: Subscription = new Subscription;
  routerSubscription: Subscription = new Subscription;
  isScriptInstalled: boolean = false;

  constructor(
    private ngZone: NgZone,
    private socket: Socket,
    private router: Router,
    private authService: AuthService,
    private literalPipe: LiteralPipe,
    private usersService: UsersService,
    private messageService: MessageService,
    private languageService: LanguageService,
    private entitiesService: EntitiesService,
    private confirmationService: ConfirmationService,
  ) {
    this.initializeLanguage(this.languageService.lan);
    this.languageSubscription = this.languageService.language.subscribe(lan => this.onLanguageChange(lan));
    this.initializeUser(this.usersService.user);
    this.initializeEntity(this.entitiesService.entity);
    this.userSubscription = this.usersService.userSubject.subscribe(user => this.initializeUser(user));
    this.entitySubscription = this.entitiesService.entitySubject.subscribe(entity => this.initializeEntity(entity));
    this.routerSubscription = this.router.events.subscribe(data => this.onRouteChange(data));
  }

  ngOnInit(): void {
    this.handleSleep();
    this.handleDevice();
    this.initializeSocket();
    this.handlePendoOption(0);
  }

  ngOnDestroy(): void {
    this.socket.removeListener('force-logout');
    this.socket.removeListener('help-requested');
    this.socket.removeListener('custom-trigger');
    this.socket.removeListener('smart-link-connection');
    this.socket.removeListener('set-session-connected');
    this.socket.removeListener('set-session-disconnected');
    this.userSubscription.unsubscribe();
    this.entitySubscription.unsubscribe();
    this.routerSubscription.unsubscribe();
    this.languageSubscription.unsubscribe();
  }

  handlePendoOption(n: number) {
    n += 1;
    if (n > 5) return;
    try {
      const pendo = eval('window.pendo');
      if (!pendo) {
        setTimeout(() => this.handlePendoOption(n), 3000);
        return;
      }

      this.showPendoOption = true;
      this.setOptions();
    } catch (error) {
      setTimeout(() => this.handlePendoOption(n), 3000);
    }
  }

  onRouteChange(data: any) {
    if (data instanceof NavigationEnd) this.setOptionSelected(data.url);
  }

  initializeUser(user: any) {
    this.user = user;
    if (!this.user) return;
    this.isAdmin = this.user.role === USER_ROLES.ADMIN;
    this.setOptions();
    this.setSmartLink();
  }

  initializeEntity(entity: any) {
    this.entity = entity;
    if (!this.entity) return;
    this.setSmartLink();
    this.isScriptInstalled = this.entity.isScriptInstalled;
  }

  initializeSocket() {
    this.socket.on('set-session-connected', (data: any) => {
      if (!data || !data.sessionId) return;
      this.isOnSession = true;
      this.sessionId = data.sessionId;
    });
    this.socket.on('set-session-disconnected', (data: any) => {
      this.isOnSession = false;
      this.sessionId = '';
    });
    this.socket.on('smart-link-connection', (data: any) => {
      if (!data || !data.sessionId) return;
      const stateString = sessionStorage.getItem(STATE_KEY);
      let state;
      if (stateString) state = JSON.parse(stateString);
      const { sessionId } = data;
      if (state && state.sessionId === sessionId) return;
      this.confirmationService.confirm({
        message: `${this.literalPipe.transform('CONTAINER.SMART_LINK_CONNECTION', this.lan)}`,
        accept: () => { this.router.navigate([ROUTES.SESSIONS], { queryParams: { sessionId }, }) },
        reject: () => { this.socket.emit('smart-link-response', { sessionId, isBusy: true }) },
      });
      this.handleNotifications(sessionId, 'CONTAINER.NEW_SMART_LINK_CONNECTION');
    });
    this.socket.on('custom-trigger', (data: any) => {
      if (this.isOnSession || !data || !data.sessionId) return;
      const { sessionId } = data;
      this.handleNotifications(sessionId, 'CONTAINER.NEW_CUSTOM_TRIGGER');
    });
    this.socket.on('help-requested', (data: any) => {
      if (this.isOnSession || !data || !data.sessionId) return;
      const { sessionId } = data;
      this.handleNotifications(sessionId, 'CONTAINER.NEW_HELP_REQUEST');
    });
    this.socket.on('force-logout', () => {
      this.authService.logout();
    });
  }

  async handleNotifications(sessionId: string, literal: string) {
    if (!Notification || Notification.permission === 'denied') return;
    const permission = await Notification.requestPermission();
    if (permission === 'granted') this.notify(sessionId, literal);
  }

  notify(sessionId: string, literal: string) {
    const title = this.literalPipe.transform(literal, this.lan);
    const notification = new Notification(title);
    notification.onclick = () => {
      this.ngZone.run(() => {
        window.focus();
        this.router.navigate([ROUTES.SESSIONS], { queryParams: { sessionId } });
        this.confirmationService.close();
      });
    };
  }

  handleDevice() {
    if (window && window.innerWidth <= 768) this.showDeviceDialog = true;
  }

  onLanguageChange(lan: string) {
    this.lan = lan;
    if (this.lan === this.user.language) return;
    this.usersService.updateSelf({ language: this.lan });
  }

  initializeLanguage(lan: string) {
    this.lan = lan;
    this.setOptions();
    this.setOptionSelected(this.router.url);
  }

  setOptions() {
    this.menuOptions = [
      { label: this.literalPipe.transform('MENU.SESSIONS', this.lan), url: ROUTES.SESSIONS, icon: 'pi pi-desktop', class: 'sessions-option' },
      { label: this.literalPipe.transform('MENU.HELP_CENTER', this.lan), url: ROUTES.HELP_CENTER, svg: 'fa-life-ring', class: 'help-option' },
      { label: this.literalPipe.transform('MENU.SETTINGS', this.lan), url: ROUTES.SETTINGS, icon: 'pi pi-cog', class: 'settings-option' },
    ];
    if (this.showPendoOption) {
      const pendoRetryTourOption = {
        label: this.literalPipe.transform('MENU.RETRY_TOUR', this.lan),
        icon: 'pi pi-star-o',
        class: 'restart-tour-button',
      };
      this.menuOptions.push(pendoRetryTourOption);
    }

    if (!this.user || !this.isAdmin) return;
    const usersOption = {
      label: this.literalPipe.transform('MENU.USERS', this.lan),
      url: ROUTES.USERS,
      icon: 'pi pi-users',
      class: 'users-option'
    };
    this.menuOptions.splice(3, 0, usersOption);
  }

  setSmartLink() {
    if (!this.entity || !this.entity.companySite || !this.user || !this.user.code) {
      this.smartLink = '';
      return;
    }

    this.smartLink = `${this.entity.companySite}?sideby=${this.user.code}`;
  }

  openInstallationScriptPopup() {
    if (!this.isAdmin) return;
    this.router.navigate([ROUTES.SETTINGS]).then(() => {
      setTimeout(() => {
        const button = document.getElementsByClassName('installation-button')[0];
        if (!button) return;
        eval('button.click();');
      }, 500);
    });
  }

  setUpSmartLink() {
    if (!this.isAdmin) return;
    this.router.navigate([ROUTES.SETTINGS]).then(() => {
      setTimeout(() => {
        const input = document.getElementsByClassName('company-site-input')[0];
        if (!input) return;
        input.scrollIntoView();
        eval('input.focus();');
      }, 500);
    });
  }

  copySmartLink() {
    copyToClippboard(this.smartLink);
    this.messageService.add({ severity: 'info', summary: this.literalPipe.transform('CONTAINER.SMART_LINK_COPIED', this.lan) });
  }

  goTo(url: string) {
    this.router.navigate([url]);
  }

  setOptionSelected(url: string) {
    const option = this.menuOptions.find((o) => url.includes(o.url));
    this.selected = option ? option : '';
  }

  switchMenu(): void {
    this.showMenu = !this.showMenu;
  }

  onSelect(option: any) {
    if ([null, undefined].includes(option.url)) return;
    this.selected = option;
    this.showMenu = false;
    this.goTo(option.url);
  }

  handleLogOut() {
    if (this.isOnSession) {
      this.confirmationService.confirm({
        message: `${this.literalPipe.transform('CONTAINER.ON_SESSION', this.lan)}`,
        accept: () => {
          this.socket.emit('stop-watching', { sessionId: this.sessionId });
          this.logout();
        },
      });
      return;
    }

    this.logout();
  }

  logout() {
    this.socket.emit('agent-logout', {});
    this.authService.logout();
  }

  handleOnSelect(option: any) {
    if (this.isOnSession) {
      this.confirmationService.confirm({
        message: `${this.literalPipe.transform('CONTAINER.ON_SESSION', this.lan)}`,
        accept: () => {
          this.socket.emit('stop-watching', { sessionId: this.sessionId });
          this.onSelect(option);
        },
      });
      return;
    } else if (this.usersService.isEditing) {
      this.confirmationService.confirm({
        message: `${this.literalPipe.transform('CONTAINER.PROFILE_EDITING', this.lan)}`,
        accept: () => this.onSelect(option),
      });
      return;
    }

    this.onSelect(option);
  }

  handleSleep() {
    let lastTime = Date.now();
    const TIMEOUT = 5000;
    const that = this;
    setInterval(() => {
      const currentTime = Date.now();
      const time = lastTime + TIMEOUT + 2000;
      if (currentTime > time) that.socket.connect();
      lastTime = currentTime;
    }, TIMEOUT);
  }

  changeLanguage(lan: string) {
    this.languageService.changeLanguage(lan);
  }
}
