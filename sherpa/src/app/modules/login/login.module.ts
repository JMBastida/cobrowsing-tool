import { NgModule } from '@angular/core';

import { LoginComponent } from './login.component';
import { LoginRoutingModule } from './login-routing.module';

import { SharedModule } from '../shared/shared.module';
import { AuthService } from '../shared/services/auth.service';

import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';


@NgModule({
  declarations: [LoginComponent],
  imports: [
    SharedModule,
    LoginRoutingModule,
    ButtonModule,
    InputTextModule,
  ],
  providers: [AuthService]
})
export class LoginModule { }
