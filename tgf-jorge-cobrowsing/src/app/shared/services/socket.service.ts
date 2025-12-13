import { Injectable, inject, effect } from '@angular/core';
import { Socket } from 'ngx-socket-io';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class SocketService {
  private authService = inject(AuthService);
  private socket = inject(Socket);

  constructor() {
    effect(() => {
      const user = this.authService.user();
      if (user) {
        this.connect();
      } else {
        this.disconnect();
      }
    });
  }

  private connect() {
    const user = this.authService.user();
    if (user && !this.socket.ioSocket.connected) {
      this.socket.ioSocket.io.opts.query = {
        entityId: user.entityId,
        userId: user._id,
        isAgent: true,
        appId: 'COBROWSING_APP_ID' // As defined in backend
      };
      this.socket.connect();
    }
  }

  private disconnect() {
    if (this.socket.ioSocket.connected) {
      this.socket.disconnect();
    }
  }

  listen(eventName: string) {
    return this.socket.fromEvent(eventName);
  }

  emit(eventName: string, data: any) {
    this.socket.emit(eventName, data);
  }
}
