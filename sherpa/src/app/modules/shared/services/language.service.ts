import { Injectable } from '@angular/core';

import { Subject } from 'rxjs';

import { setLanguage, getCurrentLanguage } from '../helpers/literals.helper';

@Injectable()
export class LanguageService {
  language: Subject<any>;
  lan: string;

  constructor() {
    const lan = getCurrentLanguage();
    this.lan = lan;
    this.language = new Subject();
    this.language.subscribe(newLan => this.lan = newLan);
    this.language.next(lan);
  }

  changeLanguage(lan: string) {
    setLanguage(lan);
    this.language.next(lan);
  }
}
