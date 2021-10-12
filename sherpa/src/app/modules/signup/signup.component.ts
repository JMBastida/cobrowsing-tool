import { Component, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';

import { MessageService } from 'primeng/api';

import { AuthService } from '../shared/services/auth.service';
import { LanguageService } from '../shared/services/language.service';

import { LiteralPipe } from '../shared/pipes/literal.pipe';

import { validateEmail } from '../shared/helpers/validators.helper';

import { ROUTES } from '../shared/enums/views.enums';

@Component({
  selector: 'shr-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class SignupComponent {
  email: string = '';
  password: string = '';
  lan: string = '';

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

  async signup() {
    if (this.email) this.email = this.email.trim();
    if (!this.email) {
      this.messageService.add({ severity: 'error', summary: this.literalPipe.transform('COMMON.EMPTY_FIELDS', this.lan), detail: this.literalPipe.transform('SIGNUP.EMAIL_REQUIRED', this.lan) });
      return;
    }

    if (!this.password) {
      this.messageService.add({ severity: 'error', summary: this.literalPipe.transform('COMMON.EMPTY_FIELDS', this.lan), detail: this.literalPipe.transform('SIGNUP.PASSWORD_REQUIRED', this.lan) });
      return;
    }

    const isValidEmail = validateEmail(this.email);
    if (!isValidEmail) {
      this.messageService.add({ severity: 'error', summary: this.literalPipe.transform('COMMON.INVALID_FIELDS', this.lan), detail: this.literalPipe.transform('COMMON.INVALID_COMPANY_EMAIL', this.lan) });
      return;
    }

    const user = { email: this.email, password: this.password, origin: 'APP', language: this.lan };
    await this.authService.signup(user);
    this.router.navigate([`${ROUTES.DASHBOARD}`]);
  }

}
