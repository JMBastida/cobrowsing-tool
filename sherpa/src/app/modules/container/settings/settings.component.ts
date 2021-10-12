import { Component, OnDestroy, ViewEncapsulation } from '@angular/core';

import { Subscription } from 'rxjs';
import { Socket } from 'ngx-socket-io';
import { MessageService } from 'primeng/api';

import { UsersService } from '../../shared/services/user.service';
import { EntitiesService } from '../../shared/services/entities.service';
import { LanguageService } from '../../shared/services/language.service';

import { LiteralPipe } from '../../shared/pipes/literal.pipe';

import { allowEdition, copyToClippboard } from '../../shared/helpers/global.helpers';

import { UPLOAD } from '../../shared/enums/api.enums';
import { USER_ROLES } from '../../shared/enums/user.enums';

import { environment } from '../../../../environments/environment';

@Component({
  selector: 'shr-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class SettingsComponent implements OnDestroy {
  apiUrl = environment.BASE_API_URL;
  identifyUsersDocUrl: string = environment.DOCS_URLS.IDENTIFY_USERS;
  entity: any;
  user: any;
  lan: string;
  isAdmin: boolean = false;
  tabIndex: number = 0;
  displayScripts: boolean = false;
  displayIframeScript: boolean = false;
  displayWidgetExample: boolean = false;
  userSubscription: Subscription = new Subscription;
  entitySubscription: Subscription = new Subscription;
  languageSubscription: Subscription = new Subscription;
  cobrowsingScript: string = '<script>function e(){var e=a.createElement("script");e.async=...';
  name: string = '';
  lastName: string = '';
  email: string = '';
  password: string = '';
  newPassword: string = '';
  companyName: string = '';
  companySite: string = '';
  companyPhone: string = '';
  companyEmail: string = '';
  code: string = '';
  avatarUrl: string = '';
  fileUploadUrl: string = UPLOAD;
  displayPassword: boolean = false;

  constructor(
    private socket: Socket,
    private literalPipe: LiteralPipe,
    private usersService: UsersService,
    private messageService: MessageService,
    private entitiesService: EntitiesService,
    private languageService: LanguageService,
  ) {
    this.lan = this.languageService.lan;
    this.languageSubscription = this.languageService.language.subscribe(lan => this.lan = lan);
    this.handleUser(this.usersService.user);
    this.handleEntity(this.entitiesService.entity);
    this.entity = this.entitiesService.entity;
    this.userSubscription = this.usersService.userSubject.subscribe(user => this.handleUser(user));
    this.entitySubscription = this.entitiesService.entitySubject.subscribe(entity => this.handleEntity(entity));
  }

  ngOnDestroy() {
    this.usersService.isEditing = false;
    this.userSubscription.unsubscribe();
    this.entitySubscription.unsubscribe();
    this.languageSubscription.unsubscribe();
  }

  handleUser(user: any) {
    this.user = user;
    if (!this.user) return;
    this.isAdmin = this.user.role === USER_ROLES.ADMIN;
    this.name = this.user.name;
    this.lastName = this.user.lastName;
    this.email = this.user.email;
    this.avatarUrl = this.user.avatarUrl;
    this.checkEdition();
  }

  handleEntity(entity: any) {
    this.entity = entity;
    if (!this.entity) return;
    this.code = this.entity.code;
    this.companyName = this.entity.companyName;
    this.companySite = this.entity.companySite;
    this.companyPhone = this.entity.companyPhone;
    this.companyEmail = this.entity.companyEmail;
    this.checkEdition();
  }

  showScripts() {
    this.displayScripts = true;
  }

  showIframeScript() {
    this.displayIframeScript = true;
  }

  showWidgetExample() {
    this.displayWidgetExample = true;
  }

  onTabChange(event: any) {
    this.tabIndex = event.index;
  }

  async onWidgetAvailabilityChange() {
    if (!this.isAdmin) {
      this.messageService.add({ severity: 'error', summary: this.literalPipe.transform('COMMON.IS_NOT_ADMIN', this.lan) });
      return;
    }

    const entityParsed = { entityId: this.user.entityId, isWidgetEnabled: this.entity.isWidgetEnabled };
    await this.entitiesService.updateWidgetAvailability(entityParsed);
    this.socket.emit('widget-availability-change', entityParsed);
  }

  copyScript() {
    const script = `
    <!-- Sideby script start -->
    <script>function e(){var e=a.createElement("script");e.async=!0,e.type="text/javascript",e.src="${this.apiUrl}/p/${this.entity.code}";var t=a.getElementsByTagName("script")[0];t&&t.parentNode?t.parentNode.insertBefore(e,t):a.head.appendChild(e)}var a,t;"undefined"==typeof Sideby&&(Sideby={}),a=document,t=window,"complete"===a.readyState?e():t.addEventListener("load",e,!1);</script>
    <!-- Sideby script end -->
`;
    copyToClippboard(script);
    this.messageService.add({ severity: 'info', summary: this.literalPipe.transform('SETTINGS.SCRIPT_COPPIED', this.lan) });
  }

  copyIframeScript() {
    const script = `
    <!-- Sideby iframe script start -->
    <script>function e(){var e=a.createElement("script");e.async=!0,e.type="text/javascript",e.src="${this.apiUrl}/p/iframe";var t=a.getElementsByTagName("script")[0];t&&t.parentNode?t.parentNode.insertBefore(e,t):a.head.appendChild(e)}var a,t;"undefined"==typeof Sideby&&(Sideby={}),a=document,t=window,"complete"===a.readyState?e():t.addEventListener("load",e,!1);</script>
    <!-- Sideby iframe script end -->
`;
    copyToClippboard(script);
    this.messageService.add({ severity: 'info', summary: this.literalPipe.transform('SETTINGS.SCRIPT_COPPIED', this.lan) });
  }

  checkEdition() {
    if (!this.user || !this.entity) return;
    if (
      this.user.newPassword ||
      (!this.user.name && this.name) ||
      (this.user.name && !this.name) ||
      (this.user.name && this.name && this.user.name !== this.name) ||
      (!this.user.email && this.email) ||
      (this.user.email && !this.email) ||
      (this.user.email && this.email && this.user.email !== this.email) ||
      (!this.user.lastName && this.lastName) ||
      (this.user.lastName && !this.lastName) ||
      (this.user.lastName && this.lastName && this.user.lastName !== this.lastName) ||
      (!this.entity.companyName && this.companyName) ||
      (this.entity.companyName && !this.companyName) ||
      (this.entity.companyName && this.companyName && this.entity.companyName !== this.companyName) ||
      (!this.entity.companySite && this.companySite) ||
      (this.entity.companySite && !this.companySite) ||
      (this.entity.companySite && this.companySite && this.entity.companySite !== this.companySite) ||
      (!this.entity.companyPhone && this.companyPhone) ||
      (this.entity.companyPhone && !this.companyPhone) ||
      (this.entity.companyPhone && this.companyPhone && this.entity.companyPhone !== this.companyPhone) ||
      (!this.entity.companyEmail && this.companyEmail) ||
      (this.entity.companyEmail && !this.companyEmail) ||
      (this.entity.companyEmail && this.companyEmail && this.entity.companyEmail !== this.companyEmail)
    ) {
      this.usersService.isEditing = true;
      return;
    }

    this.usersService.isEditing = false;
  }

  async updateEntity() {
    if (!this.isAdmin) {
      this.messageService.add({ severity: 'error', summary: this.literalPipe.transform('COMMON.IS_NOT_ADMIN', this.lan) });
      return;
    }

    const data = {
      companyName: this.companyName ? this.companyName.trim() : this.companyName,
      companySite: this.companySite ? this.companySite.trim() : this.companySite,
      companyPhone: this.companyPhone ? this.companyPhone.trim() : this.companyPhone,
      companyEmail: this.companyEmail ? this.companyEmail.trim() : this.companyEmail,
    };

    if (!data.companyName) {
      this.messageService.add({ severity: 'error', summary: this.literalPipe.transform('COMMON.EMPTY_FIELDS', this.lan), detail: this.literalPipe.transform('SETTINGS.PROFILE.COMPANY_NAME_REQUIRED', this.lan) });
      return;
    }

    if (!data.companyEmail) {
      this.messageService.add({ severity: 'error', summary: this.literalPipe.transform('COMMON.EMPTY_FIELDS', this.lan), detail: this.literalPipe.transform('SETTINGS.PROFILE.COMPANY_EMAIL_REQUIRED', this.lan) });
      return;
    }

    await this.entitiesService.updateEntity(data);
    this.messageService.add({ severity: 'success', summary: this.literalPipe.transform('SETTINGS.PROFILE.ENTITY_UPDATED', this.lan) });
  }

  async updateSelf() {
    if (this.name) this.name = this.name.trim();
    if (this.email) this.email = this.email.trim();
    if (this.lastName) this.lastName = this.lastName.trim();
    if (!this.email) {
      this.messageService.add({ severity: 'error', summary: this.literalPipe.transform('COMMON.EMPTY_FIELDS', this.lan), detail: this.literalPipe.transform('SETTINGS.PROFILE.EMAIL_REQUIRED', this.lan) });
      return;
    }

    const newUserData = {
      name: this.name,
      email: this.email,
      lastName: this.lastName,
      password: this.password,
      newPassword: this.newPassword,
    };
    await this.usersService.updateSelf(newUserData);
    this.messageService.add({ severity: 'success', summary: this.literalPipe.transform('SETTINGS.PROFILE.USER_UPDATED', this.lan) });
    this.password = '';
    this.newPassword = '';
    this.displayPassword = false;
  }

  async onUserLogoUpload(event: any) {
    if (!event || !event.originalEvent || !event.originalEvent.body || !event.originalEvent.body.paths) return;
    const path = event.originalEvent.body.paths[0];
    const userParsed = { _id: this.user._id, avatarUrl: path };
    await this.usersService.updateSelf(userParsed);
  }

  showPassword() {
    this.displayPassword = true;
  }

  allowEdition(event: any) {
    allowEdition(event);
  }

}
