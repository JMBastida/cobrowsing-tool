import { Component, OnDestroy, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';

import { Subscription } from 'rxjs';
import { ConfirmationService, MessageService, SelectItem } from 'primeng/api';

import { UsersService } from '../../shared/services/user.service';
import { LanguageService } from '../../shared/services/language.service';

import { LiteralPipe } from '../../shared/pipes/literal.pipe';

import { validateEmail } from '../../shared/helpers/validators.helper';
import { allowEdition, avoidEdition } from '../../shared/helpers/global.helpers';

import { ROUTES } from '../../shared/enums/views.enums';
import { USER_ROLES, USER_ROLES_KEYS } from '../../shared/enums/user.enums';

@Component({
  selector: 'shr-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class UsersComponent implements OnDestroy {
  user: any;
  newUser: any;
  users: any[] = [];
  rolesOptions: SelectItem[] = [];
  usersOptions: SelectItem[] = [];
  isAdmin: boolean = false;
  lan: string = '';
  userSubscription: Subscription = new Subscription;
  entitySubscription: Subscription = new Subscription;
  languageSubscription: Subscription = new Subscription;

  constructor(
    private router: Router,
    private literalPipe: LiteralPipe,
    private usersService: UsersService,
    private messageService: MessageService,
    private languageService: LanguageService,
    private confirmationService: ConfirmationService,
  ) {
    this.onLanguageChange(this.languageService.lan);
    this.languageSubscription = this.languageService.language.subscribe(lan => this.onLanguageChange(lan));
    this.handleUser(this.usersService.user);
    this.userSubscription = this.usersService.userSubject.subscribe(user => this.handleUser(user));
  }

  ngOnDestroy(): void {
    this.userSubscription.unsubscribe();
    this.languageSubscription.unsubscribe();
  }

  onLanguageChange(lan: string) {
    this.lan = lan;
    this.rolesOptions = USER_ROLES_KEYS.map(k => ({ label: this.literalPipe.transform(`COMMON.${k}`, this.lan), value: k }));
    this.rolesOptions.unshift({ label: this.literalPipe.transform('COMMON.SELECT_OPTION', this.lan), value: null });
  }

  handleUser(user: any) {
    this.user = user;
    if (!this.user) return;
    this.isAdmin = this.user.role === USER_ROLES.ADMIN;
    if (!this.isAdmin) {
      this.router.navigate([`${ROUTES.DASHBOARD}`]);
      return;
    }

    this.getUsers();
  }

  async getUsers() {
    const response = await this.usersService.getUsers({});
    this.users = response.users;
    this.usersOptions = this.users.map(u => ({ label: u.name, value: u._id }));
  }

  async createUser() {
    if (!this.isAdmin) {
      this.messageService.add({ severity: 'error', summary: this.literalPipe.transform('COMMON.IS_NOT_ADMIN', this.lan) });
      return;
    }

    if (this.newUser.name) this.newUser.name = this.newUser.name.trim();
    if (this.newUser.email) this.newUser.email = this.newUser.email.trim();
    if (!this.newUser.role) {
      this.messageService.add({ severity: 'error', summary: this.literalPipe.transform('COMMON.EMPTY_FIELDS', this.lan), detail: this.literalPipe.transform('USERS.ROLE_REQUIRED', this.lan) });
      return;
    }

    if (!this.newUser.email) {
      this.messageService.add({ severity: 'error', summary: this.literalPipe.transform('COMMON.EMPTY_FIELDS', this.lan), detail: this.literalPipe.transform('USERS.EMAIL_REQUIRED', this.lan) });
      return;
    }

    const isValidEmail = validateEmail(this.newUser.email);
    if (!isValidEmail) {
      this.messageService.add({ severity: 'error', summary: this.literalPipe.transform('COMMON.INVALID_FIELDS', this.lan), detail: this.literalPipe.transform('COMMON.INVALID_COMPANY_EMAIL', this.lan) });
      return;
    }

    if (!this.newUser.name) {
      this.messageService.add({ severity: 'error', summary: this.literalPipe.transform('COMMON.EMPTY_FIELDS', this.lan), detail: this.literalPipe.transform('USERS.NAME_REQUIRED', this.lan) });
      return;
    }

    if (!this.newUser.password) {
      this.messageService.add({ severity: 'error', summary: this.literalPipe.transform('COMMON.EMPTY_FIELDS', this.lan), detail: this.literalPipe.transform('USERS.ROLE_REQUIRED', this.lan) });
      return;
    }

    const userCreated = await this.usersService.createUser(this.newUser);
    this.messageService.add({ severity: 'success', summary: this.literalPipe.transform('USERS.USER_CREATED', this.lan) });
    this.users.push(userCreated);
    this.usersOptions.push({ label: userCreated.name, value: userCreated._id });
    this.newUser = {};
  }

  handleUpdateUser(userData: any) {
    if (userData.name) userData.name = userData.name.trim();
    if (userData.email) userData.email = userData.email.trim();
    if (!userData.role) {
      this.messageService.add({ severity: 'error', summary: this.literalPipe.transform('COMMON.EMPTY_FIELDS', this.lan), detail: this.literalPipe.transform('USERS.ROLE_REQUIRED', this.lan) });
      return;
    }

    if (!userData.email) {
      this.messageService.add({ severity: 'error', summary: this.literalPipe.transform('COMMON.EMPTY_FIELDS', this.lan), detail: this.literalPipe.transform('USERS.EMAIL_REQUIRED', this.lan) });
      return;
    }

    const isValidEmail = validateEmail(userData.email);
    if (!isValidEmail) {
      this.messageService.add({ severity: 'error', summary: this.literalPipe.transform('COMMON.INVALID_FIELDS', this.lan), detail: this.literalPipe.transform('COMMON.INVALID_COMPANY_EMAIL', this.lan) });
      return;
    }

    if (!userData.name) {
      this.messageService.add({ severity: 'error', summary: this.literalPipe.transform('COMMON.EMPTY_FIELDS', this.lan), detail: this.literalPipe.transform('USERS.NAME_REQUIRED', this.lan) });
      return;
    }

    if (userData.password) {
      this.confirmationService.confirm({
        message: `${this.literalPipe.transform('USERS.UPDATE_PASSWORD_ADVISE', this.lan)} "${userData.name}"`,
        accept: () => this.updateUser(userData),
      });
      return;
    }

    this.updateUser(userData);
  }

  async updateUser(userData: any) {
    if (!this.isAdmin) {
      this.messageService.add({ severity: 'error', summary: this.literalPipe.transform('COMMON.IS_NOT_ADMIN', this.lan) });
      return;
    }

    const userUpdated = await this.usersService.updateUser(userData);
    this.messageService.add({ severity: 'success', summary: this.literalPipe.transform('USERS.USER_UPDATED', this.lan) });
    const index = this.users.findIndex(u => u._id === userUpdated._id);
    if (index !== -1) this.users[index] = userUpdated;
    const userOption = this.usersOptions.find(o => o.value === userUpdated._id);
    if (userOption) userOption.label = userUpdated.name;
  }

  initializeNewUser() {
    this.newUser = {};
  }

  cancelNewUser() {
    this.newUser = null;
  }

  allowEdition(event: any) {
    allowEdition(event);
  }

  avoidEdition(event: any) {
    avoidEdition(event);
  }

}
