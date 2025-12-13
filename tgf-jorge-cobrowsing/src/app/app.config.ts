import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { providePrimeNG } from 'primeng/config';
import { routes } from './app.routes';
import Aura from '@primeuix/themes/aura';
import { provideSocketIo, SocketIoConfig } from 'ngx-socket-io';
import { environment } from '../environments/environment';
import { authInterceptor } from './shared/interceptors/auth.interceptor';

const config: SocketIoConfig = { url: environment.BASE_API_URL, options: { autoConnect: false, transports: ['websocket'], path: '/ws/' } };

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    providePrimeNG({
      theme: {
        preset: Aura,
        options: {
          prefix: 'p',
          darkModeSelector: 'system',
          cssLayer: false
        }
      },
      ripple: true,
    }),
    provideSocketIo(config)
  ]
};
