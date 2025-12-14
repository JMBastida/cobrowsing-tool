import { Injectable, inject, effect, signal } from '@angular/core';
import { Socket } from 'ngx-socket-io';
import { AuthService } from './auth.service';
// @ts-ignore
import {Observable, Subject} from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class SocketService {
  private authService = inject(AuthService);
  private socket = inject(Socket);
  
  private connectionStatus = new Subject<'connected' | 'disconnected'>();
  public connectionStatus$ = this.connectionStatus.asObservable();

  constructor() {
    effect(() => {
      const user = this.authService.user();
      if (user) {
        this.connect();
      } else {
        this.disconnect();
      }
    });

    this.socket.on('connect', () => this.connectionStatus.next('connected'));
    this.socket.on('disconnect', () => this.connectionStatus.next('disconnected'));
  }

  private connect() {
    const user = this.authService.user();
    if (user && !this.socket.ioSocket.connected) {
      this.socket.ioSocket.io.opts.query = {
        entityId: user.entityId,
        userId: user._id,
        isAgent: true,
        appId: 'COBROWSING_APP_ID'
      };
      this.socket.connect();
    }
  }

  private disconnect() {
    if (this.socket.ioSocket.connected) {
      this.socket.disconnect();
    }
  }

  listen(eventName: string): Observable<any> {
    return this.socket.fromEvent(eventName);
  }

  emit(eventName: string, data: any) {
    this.socket.emit(eventName, data);
  }
}
