import { Injectable } from '@angular/core';

@Injectable()
export class BlockUiService {
  private blocked: boolean = false;
  constructor() { }

  block() {
    this.blocked = true;
  }

  unblock() {
    this.blocked = false;
  }

  isBlocked() {
    return this.blocked;
  }
}
