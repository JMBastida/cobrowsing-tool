import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { AuthInterceptor } from './auth.interceptor';
import { MessageInterceptor } from './message.interceptor';
import { BlockUiInterceptor } from './block-ui.interceptor';

const interceptors = [
  {
    provide: HTTP_INTERCEPTORS,
    useClass: AuthInterceptor,
    multi: true
  },
  {
    provide: HTTP_INTERCEPTORS,
    useClass: MessageInterceptor,
    multi: true
  },
  {
    provide: HTTP_INTERCEPTORS,
    useClass: BlockUiInterceptor,
    multi: true
  },
];

export function getInterceptors(): any[] {
  return interceptors;
}
