import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpResponse,
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { BlockUiService } from '../components/block-ui/block-ui.service';
import { tap } from 'rxjs/operators';

@Injectable()
export class BlockUiInterceptor implements HttpInterceptor {
  constructor(
    private blockUiService: BlockUiService,
  ) { }

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    this.blockUiService.block();
    return next.handle(request).pipe(
      tap(
        (event: HttpEvent<any>) => {
          if (event instanceof HttpResponse) {
            this.blockUiService.unblock();
          }
        },
        (err: any) => {
          this.blockUiService.unblock();
        })
    );
  }
}
