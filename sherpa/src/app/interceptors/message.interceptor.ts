import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor } from '@angular/common/http';

import { MessageService } from 'primeng/api';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

import { LiteralPipe } from '../modules/shared/pipes/literal.pipe';

@Injectable()
export class MessageInterceptor implements HttpInterceptor {
  constructor(
    private messageService: MessageService,
    private literalPipe: LiteralPipe
  ) { }

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(request).pipe(
      tap((response: any) => {
        if (response.toastMessages) {
          this.messageService.addAll(response.toastMessages);
        }
      }),
      catchError(err => {
        if (err.error && err.error.toastMessages) {
          this.messageService.addAll(err.error.toastMessages);
        } else {
          this.messageService.add({ severity: 'error', summary: this.literalPipe.transform('SERVER_ERROR'), detail: this.literalPipe.transform('SERVER_ERROR_DESCRIPTION') });
        }

        return throwError(err);
      })
    );
  }
}