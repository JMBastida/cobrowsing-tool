import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { SocketIoModule, SocketIoConfig } from 'ngx-socket-io';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

import { HttpClientModule } from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { LoginModule } from './modules/login/login.module';
import { SignupModule } from './modules/signup/signup.module';
import { BlockUiModule } from './components/block-ui/block-ui.module';
import { ContainerModule } from './modules/container/container.module';

import { getInterceptors } from './interceptors/http.provider';
import { LiteralPipe } from './modules/shared/pipes/literal.pipe';

import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { AuthService } from './modules/shared/services/auth.service';
import { LanguageService } from './modules/shared/services/language.service';
import { PrivacyModule } from './modules/privacy/privacy.module';

import { environment } from '../environments/environment';

const config: SocketIoConfig = {
  url: environment.BASE_API_URL,
  options: { autoConnect: false, transports: ['websocket'], path: '/ws/' },
};

@NgModule({
  declarations: [
    AppComponent,
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    SocketIoModule.forRoot(config),
    LoginModule,
    SignupModule,
    PrivacyModule,
    ContainerModule,
    ToastModule,
    BlockUiModule,
    AppRoutingModule,
  ],
  providers: [getInterceptors(), MessageService, LiteralPipe, AuthService, LanguageService],
  bootstrap: [AppComponent]
})
export class AppModule { }
