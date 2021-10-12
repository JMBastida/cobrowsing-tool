import { Component, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';

import { MessageService } from 'primeng/api';

import { AuthService } from '../shared/services/auth.service';
import { LanguageService } from '../shared/services/language.service';

import { LiteralPipe } from '../shared/pipes/literal.pipe';

import { ROUTES } from '../shared/enums/views.enums';

@Component({
  selector: 'shr-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class LoginComponent {
  email: string = '';
  password: string = '';
  lan: string;

  constructor(
    private router: Router,
    private literalPipe: LiteralPipe,
    private authService: AuthService,
    private messageService: MessageService,
    private languageService: LanguageService,
  ) {
    this.lan = this.languageService.lan;
    this.languageService.language.subscribe(lan => this.lan = lan);
  }

  async login() {
    if (this.email) this.email = this.email.trim();
    if (!this.email) {
      this.messageService.add({ severity: 'error', summary: this.literalPipe.transform('COMMON.EMPTY_FIELDS', this.lan), detail: this.literalPipe.transform('LOGIN.EMAIL_REQUIRED', this.lan) });
      return;
    }

    if (!this.password) {
      this.messageService.add({ severity: 'error', summary: this.literalPipe.transform('COMMON.EMPTY_FIELDS', this.lan), detail: this.literalPipe.transform('LOGIN.PASSWORD_REQUIRED', this.lan) });
      return;
    }

    const user = { email: this.email, password: this.password, language: this.lan };
    await this.authService.login(user);
    this.router.navigate([`${ROUTES.DASHBOARD}`]);
  }

}
