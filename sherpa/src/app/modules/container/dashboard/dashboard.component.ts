import { Component, OnDestroy, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';

import { Subscription } from 'rxjs';

import { UsersService } from '../../shared/services/user.service';
import { EntitiesService } from '../../shared/services/entities.service';
import { LanguageService } from '../../shared/services/language.service';

import { LiteralPipe } from '../../shared/pipes/literal.pipe';

import { ROUTES } from '../../shared/enums/views.enums';
import { USER_ROLES } from '../../shared/enums/user.enums';

@Component({
  selector: 'shr-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class DashboardComponent implements OnDestroy {
  user: any;
  entity: any;
  message: string = '';
  options: any[] = [];
  lan: string = '';
  userName: string = '';
  percent: number = 0;
  isAdmin: boolean = false;
  userSubscription: Subscription = new Subscription;
  entitySubscription: Subscription = new Subscription;
  languageSubscription: Subscription = new Subscription;

  constructor(
    private router: Router,
    private literalPipe: LiteralPipe,
    private usersService: UsersService,
    private entitiesService: EntitiesService,
    private languageService: LanguageService,
  ) {
    this.onLanguageChange(this.languageService.lan);
    this.languageSubscription = this.languageService.language.subscribe(lan => this.onLanguageChange(lan));
    this.handleUser(this.usersService.user);
    this.handleEntity(this.entitiesService.entity);
    this.userSubscription = this.usersService.userSubject.subscribe(user => this.handleUser(user));
    this.entitySubscription = this.entitiesService.entitySubject.subscribe(entity => this.handleEntity(entity));
  }

  ngOnDestroy() {
    this.userSubscription.unsubscribe();
    this.entitySubscription.unsubscribe();
    this.languageSubscription.unsubscribe();
  }

  onLanguageChange(lan: string) {
    this.lan = lan;
    this.setOptions();
  }

  setProfilePercentage() {
    let percent = 0;
    const inc = this.isAdmin ? 100 / 8 : 100 / 4;
    if (this.user) {
      if (this.user.name) percent += inc;
      if (this.user.lastName) percent += inc;
      if (this.user.email) percent += inc;
      if (this.user.avatarUrl) percent += inc;
    }

    if (this.entity && this.isAdmin) {
      if (this.entity.companyName) percent += inc;
      if (this.entity.companySite) percent += inc;
      if (this.entity.companyPhone) percent += inc;
      if (this.entity.companyEmail) percent += inc;
    }

    this.percent = Math.round(percent);
  }

  handleUser(user: any) {
    this.user = user;
    this.initializeUser();
  }

  handleEntity(entity: any) {
    this.entity = entity;
    this.initializeUser();
  }

  initializeUser() {
    if (!this.user) return;
    this.userName = this.user.name;
    this.isAdmin = this.user.role === USER_ROLES.ADMIN;
    this.setProfilePercentage();
    this.setOptions();
  }

  initializeEntity() {
    if (!this.entity) return;
    this.setProfilePercentage();
  }

  setOptions() {
    this.options = [
      { label: this.literalPipe.transform('MENU.SESSIONS', this.lan), url: ROUTES.SESSIONS, icon: 'pi pi-desktop' },
      { label: this.literalPipe.transform('MENU.HELP_CENTER', this.lan), url: ROUTES.HELP_CENTER, svg: 'fa-life-ring' },
      { label: this.literalPipe.transform('MENU.SETTINGS', this.lan), url: ROUTES.SETTINGS, icon: 'pi pi-cog' },
    ];
    if (!this.isAdmin) return;
    const usersOption = {
      label: this.literalPipe.transform('MENU.USERS', this.lan),
      url: ROUTES.USERS,
      icon: 'pi pi-users',
    };
    this.options.push(usersOption);
  }

  onSelect(option: any) {
    this.goTo(option.url);
  }

  goTo(url: string) {
    this.router.navigate([url]);
  }

  goToSettings() {
    this.router.navigate([ROUTES.SETTINGS]);
  }

}
