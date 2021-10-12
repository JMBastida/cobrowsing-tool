import { NgModule } from '@angular/core';

import { SignupComponent } from './signup.component';
import { SignupRoutingModule } from './signup-routing.module';

import { SharedModule } from '../shared/shared.module';
import { AuthService } from '../shared/services/auth.service';

import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { LanguageService } from '../shared/services/language.service';


@NgModule({
  declarations: [SignupComponent],
  imports: [
    SharedModule,
    SignupRoutingModule,
    InputTextModule,
    ButtonModule,
  ],
  providers: [AuthService, LanguageService]
})
export class SignupModule { }
